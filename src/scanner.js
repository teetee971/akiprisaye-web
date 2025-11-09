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

// Scanner instance
let codeReader = null;
let isScanning = false;

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

  // Check if camera is available
  checkCameraAvailability();
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
  
  videoContainer.classList.remove('active');
  startCameraBtn.style.display = 'block';
  stopCameraBtn.style.display = 'none';
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
  
  console.log('Barcode detected:', barcode, 'Format:', format);
  
  // Validate EAN format (8-14 digits)
  if (!/^\d{8,14}$/.test(barcode)) {
    showStatus('Code-barres invalide détecté', 'error');
    return;
  }
  
  // Stop scanning
  if (isScanning) {
    stopCamera();
  }
  
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
  
  // Auto-hide info messages after 5 seconds
  if (type === 'info') {
    setTimeout(() => {
      if (statusMessage.classList.contains('info')) {
        statusMessage.classList.remove('active');
      }
    }, 5000);
  }
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
