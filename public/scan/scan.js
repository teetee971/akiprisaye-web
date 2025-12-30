const video = document.getElementById('camera');
const canvas = document.getElementById('capture');
const result = document.getElementById('result');

navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
  .then(stream => video.srcObject = stream)
  .catch(err => result.textContent = 'Erreur caméra : ' + err);

document.getElementById('btn-scan').onclick = async () => {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0);

  const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));

  const worker = new Worker('./ocr.worker.js');
  worker.postMessage(blob);

  worker.onmessage = e => {
    if (e.data.error) {
      result.textContent = '❌ OCR : ' + e.data.error;
    } else {
      result.textContent = '✅ Texte détecté:\n' + e.data.text;
    }
  };
};
