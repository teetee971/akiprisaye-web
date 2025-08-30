import Tesseract from 'tesseract.js';
import { useState } from 'react';

export default function TicketScanOCR() {
  const [result, setResult] = useState("");

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    Tesseract.recognize(
      file,
      'fra',
      { logger: m => console.log(m) }
    ).then(({ data: { text } }) => {
      setResult(text);
    });
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial' }}>
      <h2>📸 Scan OCR Réel du Ticket</h2>
      <input type="file" onChange={handleFileUpload} />
      <pre style={{ background: '#f4f4f4', padding: '1rem', marginTop: '1rem' }}>
        {result || "🔍 Aucun texte reconnu pour le moment..."}
      </pre>
    </div>
  );
}
