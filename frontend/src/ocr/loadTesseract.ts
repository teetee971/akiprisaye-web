// Utilitaire pour charger Tesseract à la demande (lazy-load)
// - importe dynamiquement tesseract.js
// - crée et initialise le worker en pointant sur les assets statiques (/ocr, /tesseract)
// - expose une fonction `recognizeImage` simple à utiliser depuis ton UI

type ProgressCallback = (m: { status?: string; progress?: number }) => void;

export async function createTesseractWorker({ workerPath = '/tesseract/worker.min.js', corePath = '/ocr/tesseract-core.wasm', langPath = '/ocr' } = {}) {
  // import dynamique : ne sera pas inclus dans le bundle initial
  const { createWorker } = await import('tesseract.js');

  const worker = createWorker({
    workerPath,
    corePath,
    langPath,
    // optional: set cachePath or gzip if needed
  });

  return worker;
}

/**
 * Recognize an image with tesseract, loading only when needed.
 * @param imageUrl URL or HTMLElement (file/blob converted to URL)
 * @param lang language code, e.g. 'eng' or 'fra'
 * @param onProgress optional callback (status/progress)
 */
export async function recognizeImage(imageUrl: string | Blob | HTMLImageElement, lang = 'eng', onProgress?: ProgressCallback) {
  const { createWorker } = await import('tesseract.js');

  const worker = createWorker({
    workerPath: '/tesseract/worker.min.js',
    corePath: '/ocr/tesseract-core.wasm',
    langPath: '/ocr'
  });

  try {
    await worker.load();
    await worker.loadLanguage(lang);
    await worker.initialize(lang);

    if (onProgress) {
      await worker.setParameters({ tessedit_pageseg_mode: '1' }).catch(()=>{});
    }

    const { data } = await worker.recognize(imageUrl, lang, {
      // forward progress events to callback
      logger: onProgress ? ((m: any) => onProgress(m)) : undefined
    });

    await worker.terminate();
    return data;
  } catch (err) {
    try { await worker.terminate(); } catch (_) {}
    throw err;
  }
}