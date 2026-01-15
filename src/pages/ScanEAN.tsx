// src/pages/ScanEAN.tsx
import React, { useState, useCallback, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useEANScanner } from '../hooks/useEANScanner'
import { useEANResolver } from '../hooks/useEANResolver'
import { useScanHistory } from '../hooks/useScanHistory'
import { useScanFlow } from '../context/ScanFlowContext'
import { validateEAN, getAllProducts } from '../services/eanPublicCatalog'
import { runOCR, GENERIC_OCR_ERROR } from '../services/ocrService'
import { extractProductHints, fuzzySearchProducts } from '../services/textProductRecognition'
import ScanCamera from '../components/ScanCamera'
import ScanResultCard from '../components/ScanResultCard'
import ScanErrorState from '../components/ScanErrorState'
import AddToTiPanierButton from '../components/AddToTiPanierButton'
import { ProductTextReviewModal } from '../components/ProductTextReviewModal'
import { GlassCard } from '../components/ui/glass-card'
import type { ScannedProductContext } from '../types/scanFlow'

export default function ScanEAN() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const isUnifiedFlow = searchParams.get('flow') === 'unified'
  const isPhotoMode = searchParams.get('mode') === 'photo'
  
  const [manualEAN, setManualEAN] = useState('')
  const [manualError, setManualError] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [imageUploadStatus, setImageUploadStatus] = useState<string | null>(null)
  const [isProcessingImage, setIsProcessingImage] = useState(false)
  const [textProductSuggestions, setTextProductSuggestions] = useState<Array<{ label: string; score: number }>>([])
  const [showTextProductModal, setShowTextProductModal] = useState(false)

  const scanner = useEANScanner()
  const resolver = useEANResolver()
  const { history, addToHistory, removeFromHistory, clearHistory } = useScanHistory()
  const scanFlow = isUnifiedFlow ? useScanFlow() : null
  
  // Cache product catalog to avoid repeated calls
  const productCatalog = React.useMemo(() => getAllProducts().map(p => ({ label: p.name, ean: p.ean })), [])

  /**
   * Unified EAN handler - Single source of truth
   * Handles EAN from: camera, image upload, manual input
   * Note: Validation errors should be handled by the caller before calling this function
   * 
   * If in unified flow, updates the scan context and redirects to comparator
   */
  const handleEAN = useCallback(async (ean: string) => {
    // Validate EAN (already validated by caller for manual input)
    if (!validateEAN(ean)) {
      return
    }

    // Resolve EAN - fetch product and prices
    await resolver.resolveEAN(ean)
    
    // Add to history if product found
    if (resolver.product) {
      addToHistory({
        ean,
        productName: resolver.product.name,
      })
    }

    // If in unified flow, update scan context and redirect to comparator
    if (isUnifiedFlow && scanFlow && resolver.product) {
      const scannedContext: ScannedProductContext = {
        source: isPhotoMode ? 'photo' : 'ean',
        ean,
        productName: resolver.product.name,
        confidenceScore: isPhotoMode ? 75 : 95, // Photo mode has lower confidence
        timestamp: new Date(),
      }

      scanFlow.updateScannedProduct(scannedContext)
      scanFlow.nextStep() // Move to understanding
      
      // Short delay before moving to comparison (for UX)
      setTimeout(() => {
        scanFlow.nextStep() // Move to comparison (will auto-redirect)
      }, 500)
    }
  }, [resolver, addToHistory, isUnifiedFlow, isPhotoMode, scanFlow])

  // Handle manual EAN search
  const handleManualSearch = async () => {
    setManualError(null)

    if (!manualEAN.trim()) {
      setManualError('Veuillez saisir un code EAN')
      return
    }

    // Validate before calling handleEAN
    if (!validateEAN(manualEAN.trim())) {
      setManualError('Code EAN invalide (vérifiez la longueur et le checksum)')
      return
    }

    await handleEAN(manualEAN.trim())
  }

  // Handle camera detection
  const handleCameraDetection = async (ean: string) => {
    scanner.setDetectedEAN(ean)
    await handleEAN(ean)
  }

  /**
   * Separate image pipeline - independent from camera
   * Includes OCR fallback with unified runOCR API
   */
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImageUploadStatus('🔍 Analyse de l\'image en cours...')
    setIsProcessingImage(true)

    let objectUrl: string | null = null

    try {
      objectUrl = URL.createObjectURL(file)

      // Step 1: Load image properly
      const img = new Image()
      img.src = objectUrl

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('Failed to load image'))
      })

      await img.decode()

      let ean: string | null = null

      // Step 2: Try native BarcodeDetector (if available)
      if ('BarcodeDetector' in window) {
        try {
          const detector = new (window as any).BarcodeDetector({
            formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e']
          })
          const codes = await detector.detect(img)

          if (codes.length > 0) {
            ean = codes[0].rawValue
            console.log('✅ Barcode detected with BarcodeDetector:', ean)
          }
        } catch (err) {
          console.log('BarcodeDetector failed, trying other methods')
        }
      }

      // Step 3: OCR Fallback with unified runOCR API (INDISPENSABLE)
      let ocrText = '';
      if (!ean) {
        setImageUploadStatus('📝 Détection OCR en cours...')
        
        const ocrResult = await runOCR(objectUrl);
        if (!ocrResult.success) {
          const ocrError = ocrResult.error ?? GENERIC_OCR_ERROR;
          throw new Error(ocrError);
        }
        ocrText = ocrResult.rawText;
        console.log('OCR raw text:', ocrText)

        // Look for EAN-13 (13 digits) or EAN-8 (8 digits)
        const match = ocrText.match(/\b\d{13}\b|\b\d{8}\b/)
        if (match) {
          ean = match[0]
          console.log('✅ EAN detected via OCR:', ean)
        }
      }

      // Step 4: Handle result
      if (ean) {
        // SUCCESS CASE - EAN found
        setImageUploadStatus(`✅ Code détecté automatiquement: ${ean}`)
        setTimeout(() => setImageUploadStatus(null), 3000)
        
        try {
          await handleEAN(ean)
        } finally {
          setIsProcessingImage(false)
        }
      } else {
        // FAILURE CASE - No EAN found, try text-based product recognition (PR D)
        setImageUploadStatus('🔍 Code EAN non trouvé, recherche par texte...')
        
        try {
          // Extract product hints from OCR text
          const hints = extractProductHints(ocrText)
          
          // Fuzzy search for suggestions using cached catalog
          const suggestions = fuzzySearchProducts(hints.keywords, productCatalog)
          
          if (suggestions.length > 0) {
            // Show modal for user validation
            setTextProductSuggestions(suggestions)
            setShowTextProductModal(true)
            setImageUploadStatus('✅ Produits suggérés - Veuillez confirmer')
          } else {
            setImageUploadStatus('❌ Aucun code détecté automatiquement. 👉 Vous pouvez saisir le code manuellement.')
          }
        } catch (textError) {
          console.error('Text product recognition error:', textError)
          setImageUploadStatus('❌ Aucun code détecté automatiquement. 👉 Vous pouvez saisir le code manuellement.')
        }
        
        setIsProcessingImage(false)
      }
    } catch (err) {
      console.error('Image processing error:', err)
      setImageUploadStatus('❌ Erreur lors du traitement de l\'image')
      setIsProcessingImage(false)
    } finally {
      // ✅ Nettoyage mémoire garanti
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }

  /**
   * Handle text product confirmation from modal
   * User has validated a suggested product
   */
  const handleTextProductConfirm = async (productLabel: string) => {
    setShowTextProductModal(false)
    setImageUploadStatus(`✅ Recherche de "${productLabel}"...`)
    
    // Find the product by name in cached catalog
    const product = productCatalog.find(p => p.label === productLabel)
    
    if (product && product.ean) {
      // Launch comparator with the confirmed product's EAN
      await handleEAN(product.ean)
      setImageUploadStatus(null)
    } else {
      setImageUploadStatus('❌ Produit non trouvé dans le catalogue')
      setTimeout(() => setImageUploadStatus(null), 3000)
    }
  }

  /**
   * Handle text product modal cancellation
   */
  const handleTextProductCancel = () => {
    setShowTextProductModal(false)
    setTextProductSuggestions([])
    setImageUploadStatus('❌ Recherche annulée - Utilisez la saisie manuelle')
    setTimeout(() => setImageUploadStatus(null), 3000)
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl" role="main">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-4">Scanner EAN</h1>
        
        {/* Avertissement obligatoire */}
        <div className="p-4 bg-blue-500/20 border border-blue-500/50 rounded-lg text-sm text-blue-200 mb-6">
          <strong>ℹ️ Information</strong>
          <p className="mt-2">
            Le scan permet d'identifier un produit à partir de son code EAN.
            Les informations affichées reposent uniquement sur des données observées ou publiques disponibles.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {/* Scan par caméra */}
        <GlassCard title="📷 Scanner avec la caméra">
          <ScanCamera
            videoRef={scanner.videoRef}
            isScanning={scanner.isScanning}
            error={scanner.error}
            onStartScan={scanner.startScanning}
            onStopScan={scanner.stopScanning}
          />
        </GlassCard>

        {/* Import image */}
        <GlassCard title="🖼️ Importer une image">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-white/70 mb-4">
                Importez une photo d'un code-barres pour le scanner automatiquement avec OCR.
              </p>
              <label className="block w-full">
                <div className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium text-center cursor-pointer transition-colors">
                  {isProcessingImage ? '⏳ Traitement...' : '📤 Choisir une image'}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isProcessingImage}
                  className="hidden"
                  aria-label="Importer une image de code-barres"
                />
              </label>
            </div>

            {imageUploadStatus && (
              <div className={`p-3 rounded-lg text-sm ${
                imageUploadStatus.includes('✅') 
                  ? 'bg-green-500/20 border border-green-500/50 text-green-300'
                  : imageUploadStatus.includes('❌')
                  ? 'bg-yellow-500/20 border border-yellow-500/50 text-yellow-300'
                  : 'bg-blue-500/20 border border-blue-500/50 text-blue-300'
              }`}>
                {imageUploadStatus}
              </div>
            )}

            <div className="text-xs text-white/60">
              💡 Si le code n'est pas détecté, utilisez la saisie manuelle
            </div>
          </div>
        </GlassCard>

        {/* Saisie manuelle */}
        <GlassCard title="⌨️ Saisie manuelle">
          <div className="space-y-4">
            <div>
              <label htmlFor="manual-ean" className="block text-sm font-medium text-white/90 mb-2">
                Code EAN (8 ou 13 chiffres)
              </label>
              <input
                id="manual-ean"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={manualEAN}
                onChange={(e) => {
                  setManualEAN(e.target.value.replace(/\D/g, ''))
                  setManualError(null)
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleManualSearch()
                  }
                }}
                placeholder="3017620422003"
                className="w-full px-4 py-3 bg-white/[0.1] border border-white/[0.22] rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Saisir le code EAN manuellement"
                aria-describedby={manualError ? 'manual-error' : undefined}
              />
              {manualError && (
                <p id="manual-error" className="mt-2 text-sm text-red-400">
                  {manualError}
                </p>
              )}
            </div>

            <button
              onClick={handleManualSearch}
              disabled={resolver.loading}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              aria-label="Rechercher le produit"
            >
              {resolver.loading ? '🔍 Recherche...' : '🔍 Rechercher'}
            </button>
          </div>
        </GlassCard>
      </div>

      {/* Résultat */}
      {resolver.product && (
        <div className="mb-8 space-y-4">
          <h2 className="text-2xl font-bold text-white">Résultat</h2>
          <ScanResultCard product={resolver.product} />
          <AddToTiPanierButton product={resolver.product} />
        </div>
      )}

      {resolver.error && !resolver.product && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Résultat</h2>
          <ScanErrorState message={resolver.error} />
        </div>
      )}

      {/* Historique */}
      {history.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">Historique des scans</h2>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="text-sm text-blue-400 hover:text-blue-300"
              aria-expanded={showHistory}
              aria-controls="scan-history"
            >
              {showHistory ? 'Masquer' : 'Afficher'} ({history.length})
            </button>
          </div>

          {showHistory && (
            <GlassCard id="scan-history">
              <div className="space-y-2">
                {history.map((entry) => (
                  <div
                    key={entry.ean}
                    className="flex items-center justify-between p-3 bg-white/[0.05] rounded-lg hover:bg-white/[0.08] transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">
                        {entry.productName || 'Produit inconnu'}
                      </div>
                      <div className="text-xs text-white/50 font-mono">
                        EAN: {entry.ean}
                      </div>
                      <div className="text-xs text-white/40">
                        {new Date(entry.scannedAt).toLocaleString('fr-FR')}
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromHistory(entry.ean)}
                      className="ml-3 p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded transition-colors"
                      aria-label={`Supprimer ${entry.productName || entry.ean} de l'historique`}
                    >
                      🗑️
                    </button>
                  </div>
                ))}

                <button
                  onClick={clearHistory}
                  className="w-full mt-4 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded transition-colors"
                  aria-label="Effacer tout l'historique"
                >
                  Effacer tout l'historique
                </button>
              </div>
            </GlassCard>
          )}
        </div>
      )}

      {/* Text Product Review Modal (PR D) */}
      {showTextProductModal && (
        <ProductTextReviewModal
          suggestions={textProductSuggestions}
          onConfirm={handleTextProductConfirm}
          onCancel={handleTextProductCancel}
        />
      )}
    </main>
  )
}
