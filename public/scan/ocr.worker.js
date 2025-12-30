importScripts('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js');

self.onmessage = async e => {
  try {
    const { data: { text } } = await Tesseract.recognize(
      e.data,
      'fra',
      { logger: () => {} }
    );
    self.postMessage({ text });
  } catch (err) {
    self.postMessage({ error: err.message });
  }
};
