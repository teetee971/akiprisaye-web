import OcrScanner from "../components/OcrScanner";

export default function OcrPage() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Analyse de ticket / facture</h1>
      <p>Importe une photo pour extraire le texte.</p>
      <OcrScanner />
    </main>
  );
}