import { useState } from 'react';
import Tesseract from 'tesseract.js';

export default function ScanOCR() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState('🧾 Aucun texte reconnu pour le moment...');
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(URL.createObjectURL(file));
    setLoading(true);
    setResult('⏳ Analyse OCR en cours...');

    try {
      const { data: { text } } = await Tesseract.recognize(file, 'fra', {
        logger: m => console.log(m),
      });

      setResult('🧾 Résultat OCR :\n' + text);

      // Exemple d’analyse IA simplifiée
      if (text.includes('125g') && text.includes('110g')) {
        setResult(prev => prev + '\n⚠️ Shrinkflation détectée : Contenance réduite détectée.');
      }

    } catch (err) {
      setResult('❌ Erreur OCR : ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h2>📸 Scan OCR Réel du Ticket</h2>
      <input type="file" accept="image/*" onChange={handleUpload} />
      {loading && <p>⏳ Traitement en cours...</p>}
      {image && <img src={image} alt="Aperçu" style={{ marginTop: '1rem', maxWidth: '100%' }} />}
      <pre style={{ background: '#f4f4f4', padding: '1rem', marginTop: '1rem' }}>{result}</pre>
    </div>
  );
}
