/* eslint-disable no-undef */
/* eslint-disable no-restricted-globals */

/**
 * OCR Web Worker
 * Utilise Tesseract.js via importScripts
 * Conçu pour fonctionner dans un Web Worker (pas navigateur classique)
 */

// Chargement de Tesseract.js
importScripts('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js');

self.onmessage = async (event) => {
  const { image } = event.data;

  if (!image) {
    self.postMessage({
      success: false,
      error: 'Aucune image fournie pour OCR',
    });
    return;
  }

  try {
    const result = await Tesseract.recognize(image, 'fra', {
      logger: () => {}, // silencieux
    });

    self.postMessage({
      success: true,
      text: result.data.text || '',
    });
  } catch (error) {
    self.postMessage({
      success: false,
      error: error.message || 'Erreur OCR inconnue',
    });
  }
};
