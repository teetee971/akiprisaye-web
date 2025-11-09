/**
 * Barcode Scanner Module
 * Handles camera access, barcode detection, and image upload fallback
 * Uses @zxing/library for EAN barcode scanning
 */

import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } from '@zxing/library';

// DOM Elements
let videoElement;
let videoContainer;
let startCameraBtn;
let stopCameraBtn;
let fileUploadInput;
let statusMessage;
let torchBtn;
let manualEanInput;
let manualSubmitBtn;
let historySection;
let historyList;
let clearHistoryBtn;

// Scanner instance
let codeReader = null;
let isScanning = false;
let lastDetectedCode = null;
let lastDetectionTime = 0;
let currentStream = null;
let torchEnabled = false;
let scanAttempts = 0;
let zoomLevel = 1;

/**
 * Initialize the scanner when DOM is loaded
 */
function init() {
  // Get DOM elements
  videoElement = document.getElementById('video-preview');
  videoContainer = document.getElementById('video-container');
  startCameraBtn = document.getElementById('start-camera-btn');
  stopCameraBtn = document.getElementById('stop-camera-btn');
  fileUploadInput = document.getElementById('file-upload');
  statusMessage = document.getElementById('status-message');
  torchBtn = document.getElementById('torch-btn');
  manualEanInput = document.getElementById('manual-ean-input');
  manualSubmitBtn = document.getElementById('manual-submit-btn');
  historySection = document.getElementById('history-section');
  historyList = document.getElementById('history-list');
  clearHistoryBtn = document.getElementById('clear-history-btn');

  // Initialize the barcode reader with specific formats
  const hints = new Map();
  const formats = [
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_A,
    BarcodeFormat.UPC_E
  ];
  hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
  hints.set(DecodeHintType.TRY_HARDER, true);
  
  codeReader = new BrowserMultiFormatReader(hints);

  // Add event listeners
  startCameraBtn.addEventListener('click', startCamera);
  stopCameraBtn.addEventListener('click', stopCamera);
  fileUploadInput.addEventListener('change', handleFileUpload);
  torchBtn.addEventListener('click', toggleTorch);
  manualSubmitBtn.addEventListener('click', handleManualSubmit);
  clearHistoryBtn.addEventListener('click', clearHistory);
  
  // Handle Enter key in manual input
  manualEanInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleManualSubmit();
    }
  });

  // Check if camera is available
  checkCameraAvailability();
  
  // Load and display recent scans
  displayRecentScans();
}

/**
 * Check if camera access is available
 */
async function checkCameraAvailability() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showStatus('Votre navigateur ne supporte pas l\'accès à la caméra. Utilisez le téléchargement d\'image.', 'info');
    startCameraBtn.disabled = true;
  }
}

/**
 * Start camera and begin scanning
 */
async function startCamera() {
  try {
    showStatus('Démarrage de la caméra...', 'info');
    startCameraBtn.disabled = true;

    // Request camera access with preference for back camera
    const constraints = {
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    };

    // Start decoding from video
    await codeReader.decodeFromConstraints(
      constraints,
      videoElement,
      (result, error) => {
        if (result) {
          handleBarcodeDetected(result);
        }
        // Errors are expected when no barcode is in view, so we don't log them
      }
    );

    // Get the video stream to check for torch support
    currentStream = videoElement.srcObject;
    await checkTorchSupport();

    // Update UI
    videoContainer.classList.add('active');
    startCameraBtn.style.display = 'none';
    stopCameraBtn.style.display = 'block';
    isScanning = true;
    
    showStatus('Positionnez le code-barres dans le cadre', 'info');
  } catch (error) {
    console.error('Camera error:', error);
    let errorMessage = 'Impossible d\'accéder à la caméra. ';
    
    if (error.name === 'NotAllowedError') {
      errorMessage += 'Veuillez autoriser l\'accès à la caméra.';
    } else if (error.name === 'NotFoundError') {
      errorMessage += 'Aucune caméra trouvée.';
    } else {
      errorMessage += 'Utilisez le téléchargement d\'image.';
    }
    
    showStatus(errorMessage, 'error');
    startCameraBtn.disabled = false;
  }
}

/**
 * Stop camera and reset UI
 */
function stopCamera() {
  if (codeReader) {
    codeReader.reset();
  }
  
  // Turn off torch if enabled
  if (torchEnabled && currentStream) {
    toggleTorch();
  }
  
  currentStream = null;
  videoContainer.classList.remove('active');
  startCameraBtn.style.display = 'block';
  stopCameraBtn.style.display = 'none';
  torchBtn.style.display = 'none';
  startCameraBtn.disabled = false;
  isScanning = false;
  
  showStatus('Caméra arrêtée', 'info');
}

/**
 * Handle file upload for fallback mode
 */
async function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    showStatus('Analyse de l\'image...', 'info');
    
    // Create image URL from file
    const imageUrl = URL.createObjectURL(file);
    
    // Decode barcode from image
    const result = await codeReader.decodeFromImageUrl(imageUrl);
    
    // Clean up
    URL.revokeObjectURL(imageUrl);
    
    if (result) {
      handleBarcodeDetected(result);
    } else {
      showStatus('Aucun code-barres détecté dans l\'image', 'error');
    }
  } catch (error) {
    console.error('Image decode error:', error);
    showStatus('Impossible de détecter un code-barres. Assurez-vous que l\'image est claire.', 'error');
  }
  
  // Reset file input
  event.target.value = '';
}

/**
 * Handle successful barcode detection
 */
function handleBarcodeDetected(result) {
  const barcode = result.getText();
  const format = result.getBarcodeFormat();
  
  // Debounce: Prevent duplicate detections within 2 seconds
  const now = Date.now();
  if (barcode === lastDetectedCode && now - lastDetectionTime < 2000) {
    return;
  }
  
  lastDetectedCode = barcode;
  lastDetectionTime = now;
  
  console.log('Barcode detected:', barcode, 'Format:', format);
  
  // Validate EAN format (8-14 digits)
  if (!/^\d{8,14}$/.test(barcode)) {
    showStatus('Code-barres invalide détecté', 'error');
    return;
  }
  
  // Save to recent scans
  saveToRecentScans(barcode);
  
  // Stop scanning
  if (isScanning) {
    stopCamera();
  }
  
  // Provide haptic feedback on mobile devices
  if (navigator.vibrate) {
    navigator.vibrate(200);
  }
  
  // Play success beep sound (optional, subtle)
  playBeep();
  
  // Show success message
  showStatus(`✅ Code-barres détecté : ${barcode}`, 'success');
  
  // Redirect to comparateur with the barcode
  setTimeout(() => {
    window.location.href = `/comparateur.html?ean=${encodeURIComponent(barcode)}`;
  }, 1000);
}

/**
 * Show status message to user
 */
function showStatus(message, type = 'info') {
  statusMessage.textContent = message;
  statusMessage.className = 'status-message active ' + type;
  
  // Update ARIA live region for screen readers
  statusMessage.setAttribute('role', 'status');
  statusMessage.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
  
  // Auto-hide info messages after 5 seconds
  if (type === 'info') {
    setTimeout(() => {
      if (statusMessage.classList.contains('info')) {
        statusMessage.classList.remove('active');
      }
    }, 5000);
  }
}

/**
 * Play a subtle beep sound on successful scan
 */
function playBeep() {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  } catch (error) {
    // Silently fail if audio is not supported
    console.debug('Audio feedback not available');
  }
}

/**
 * Check if torch/flashlight is supported
 */
async function checkTorchSupport() {
  if (!currentStream) return;
  
  try {
    const track = currentStream.getVideoTracks()[0];
    const capabilities = track.getCapabilities();
    
    if (capabilities.torch) {
      torchBtn.style.display = 'block';
    }
  } catch (error) {
    console.debug('Torch not supported on this device');
  }
}

/**
 * Toggle torch/flashlight on/off
 */
async function toggleTorch() {
  if (!currentStream) return;
  
  try {
    const track = currentStream.getVideoTracks()[0];
    torchEnabled = !torchEnabled;
    
    await track.applyConstraints({
      advanced: [{ torch: torchEnabled }]
    });
    
    torchBtn.classList.toggle('active', torchEnabled);
    torchBtn.setAttribute('aria-pressed', torchEnabled);
  } catch (error) {
    console.error('Failed to toggle torch:', error);
    showStatus('Impossible d\'activer la lampe torche', 'error');
  }
}

/**
 * Save scanned barcode to recent scans in localStorage
 */
function saveToRecentScans(barcode) {
  try {
    const recentScans = JSON.parse(localStorage.getItem('recentScans') || '[]');
    
    // Remove duplicates and add to beginning
    const filtered = recentScans.filter(scan => scan.code !== barcode);
    filtered.unshift({
      code: barcode,
      timestamp: Date.now()
    });
    
    // Keep only last 10 scans
    const trimmed = filtered.slice(0, 10);
    
    localStorage.setItem('recentScans', JSON.stringify(trimmed));
    
    // Update display
    displayRecentScans();
  } catch (error) {
    console.debug('Failed to save to recent scans:', error);
  }
}

/**
 * Display recent scans from localStorage
 */
function displayRecentScans() {
  try {
    const recentScans = JSON.parse(localStorage.getItem('recentScans') || '[]');
    
    if (recentScans.length === 0) {
      historySection.style.display = 'none';
      return;
    }
    
    historySection.style.display = 'block';
    historyList.innerHTML = '';
    
    recentScans.forEach(scan => {
      const item = document.createElement('div');
      item.className = 'history-item';
      
      const timeAgo = getTimeAgo(scan.timestamp);
      
      item.innerHTML = `
        <div style="flex: 1;" onclick="navigateToComparateur('${scan.code}')">
          <div class="history-item-code">${scan.code}</div>
          <div class="history-item-time">${timeAgo}</div>
        </div>
        <div class="history-item-actions">
          <button class="history-item-btn" onclick="copyToClipboard('${scan.code}')" aria-label="Copier" title="Copier">
            📋
          </button>
          <button class="history-item-btn" onclick="shareCode('${scan.code}')" aria-label="Partager" title="Partager">
            📤
          </button>
        </div>
      `;
      
      historyList.appendChild(item);
    });
  } catch (error) {
    console.debug('Failed to display recent scans:', error);
  }
}

/**
 * Get human-readable time ago string
 */
function getTimeAgo(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'À l\'instant';
  if (minutes < 60) return `Il y a ${minutes}min`;
  if (hours < 24) return `Il y a ${hours}h`;
  if (days < 7) return `Il y a ${days}j`;
  return new Date(timestamp).toLocaleDateString('fr-FR');
}

/**
 * Navigate to comparateur with EAN code
 */
function navigateToComparateur(ean) {
  window.location.href = `/comparateur.html?ean=${encodeURIComponent(ean)}`;
}

/**
 * Copy EAN code to clipboard
 */
async function copyToClipboard(ean) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(ean);
      showStatus(`✓ Code ${ean} copié dans le presse-papiers`, 'success');
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = ean;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        showStatus(`✓ Code ${ean} copié dans le presse-papiers`, 'success');
      } catch (err) {
        showStatus('Impossible de copier le code', 'error');
      }
      document.body.removeChild(textArea);
    }
  } catch (error) {
    console.error('Copy failed:', error);
    showStatus('Impossible de copier le code', 'error');
  }
}

/**
 * Share EAN code using Web Share API or fallback
 */
async function shareCode(ean) {
  const shareData = {
    title: 'Code EAN - A KI PRI SA YÉ',
    text: `Code EAN: ${ean}`,
    url: `${window.location.origin}/comparateur.html?ean=${encodeURIComponent(ean)}`
  };
  
  try {
    if (navigator.share) {
      await navigator.share(shareData);
      showStatus('Code partagé avec succès', 'success');
    } else {
      // Fallback: copy URL to clipboard
      await copyToClipboard(shareData.url);
      showStatus('Lien copié dans le presse-papiers', 'success');
    }
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('Share failed:', error);
      showStatus('Impossible de partager le code', 'error');
    }
  }
}

/**
 * Clear all recent scans
 */
function clearHistory() {
  if (confirm('Voulez-vous vraiment effacer tout l\'historique ?')) {
    try {
      localStorage.removeItem('recentScans');
      displayRecentScans();
      showStatus('Historique effacé', 'success');
    } catch (error) {
      console.error('Clear history failed:', error);
      showStatus('Impossible d\'effacer l\'historique', 'error');
    }
  }
}

// Make functions globally accessible for inline onclick handlers
window.navigateToComparateur = navigateToComparateur;
window.copyToClipboard = copyToClipboard;
window.shareCode = shareCode;

/**
 * Apply zoom to camera
 */
async function applyZoom(level) {
  if (!currentStream) return;
  
  try {
    const track = currentStream.getVideoTracks()[0];
    const capabilities = track.getCapabilities();
    
    if (capabilities.zoom) {
      zoomLevel = Math.max(capabilities.zoom.min || 1, Math.min(level, capabilities.zoom.max || 3));
      
      await track.applyConstraints({
        advanced: [{ zoom: zoomLevel }]
      });
    }
  } catch (error) {
    console.debug('Zoom not supported or failed:', error);
  }
}

/**
 * Handle manual EAN input submission
 */
function handleManualSubmit() {
  const ean = manualEanInput.value.trim();
  
  // Validate EAN format (8-14 digits)
  if (!ean) {
    showStatus('Veuillez saisir un code EAN', 'error');
    manualEanInput.focus();
    return;
  }
  
  if (!/^\d{8,14}$/.test(ean)) {
    showStatus('Code EAN invalide (8 à 14 chiffres requis)', 'error');
    manualEanInput.focus();
    return;
  }
  
  // Save to recent scans
  saveToRecentScans(ean);
  
  // Show success and redirect
  showStatus(`✅ Code EAN validé : ${ean}`, 'success');
  
  setTimeout(() => {
    window.location.href = `/comparateur.html?ean=${encodeURIComponent(ean)}`;
  }, 500);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (codeReader) {
    codeReader.reset();
  }
});
