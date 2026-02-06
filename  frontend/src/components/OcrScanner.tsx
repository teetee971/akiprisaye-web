import React, { useEffect, useState } from "react";
import { recognizeImage } from "../../ocr/loadTesseract";

/**
 * OCRScanner
 * - Scan OCR local (Tesseract.js) loaded on demand
 * - Gestion progrès
 * - Gestion erreurs
 * - Nettoyage mémoire (blob URL)
 * - Styles inline sûrs (aucun CSS externe requis)
 */
const OCRScanner: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [text, setText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  /* Nettoyage mémoire de l’URL blob */
  useEffect(() => {
    return () => {
      if (image) {
        URL.revokeObjectURL(image);
      }
    };
  }, [image]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Format de fichier non supporté (image uniquement)");
      return;
    }

    setImage(URL.createObjectURL(file));
    setText("");
    setProgress(0);
    setError(null);
  };

  const runOcr = async () => {
    if (!image || loading) return;

    setLoading(true);
    setProgress(0);
    setError(null);

    try {
      // Lazy-load tesseract and its assets only when needed
      const result = await recognizeImage(image, "fra", (m) => {
        if (m.status === "recognizing text" && typeof m.progress === "number") {
          setProgress(Math.round(m.progress * 100));
        }
      });

      // recognizeImage retourne l'objet 'data' de Tesseract (data.text)
      const extractedText = result && (result as any).text ? (result as any).text.trim() : "";
      setText(extractedText);
    } catch (err) {
      console.error("[OCR]", err);
      setError("Erreur lors de l’analyse OCR");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={styles.main}>
      <h1 style={styles.title}>Analyse de ticket / facture</h1>

      <p style={styles.subtitle}>Prenez une photo ou importez une image pour extraire le texte.</p>

      <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} style={styles.input} />

      {image && <img src={image} alt="Aperçu du ticket" style={styles.preview} />}

      {image && (
        <button
          onClick={runOcr}
          disabled={loading}
          style={{
            ...styles.button,
            opacity: loading ? 0.7 : 1,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Analyse en cours…" : "Lancer l’OCR"}
        </button>
      )}

      {loading && <p style={styles.progress}>Analyse : {progress} %</p>}

      {error && <p style={styles.error}>{error}</p>}

      {text && (
        <section style={styles.result}>
          <h2 style={styles.resultTitle}>Texte extrait</h2>
          <pre style={styles.pre}>{text}</pre>
        </section>
      )}
    </main>
  );
};

export default OCRScanner;

/* ===================== */
/* Styles inline sûrs    */
/* ===================== */

const styles: Record<string, React.CSSProperties> = {
  main: {
    padding: 24,
    maxWidth: 720,
    margin: "0 auto",
    color: "#f1f5f9",
  },
  title: {
    fontSize: "1.6rem",
    marginBottom: 8,
  },
  subtitle: {
    opacity: 0.85,
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  preview: {
    width: "100%",
    maxHeight: 320,
    objectFit: "contain",
    borderRadius: 8,
    marginBottom: 16,
    background: "#020617",
  },
  button: {
    padding: "10px 16px",
    borderRadius: 8,
    border: "none",
    background: "#22c55e",
    color: "#022c22",
    fontWeight: 600,
    cursor: "pointer",
    marginBottom: 12,
  },
  progress: {
    fontSize: "0.9rem",
    opacity: 0.9,
  },
  error: {
    color: "#f87171",
    marginTop: 12,
  },
  result: {
    marginTop: 24,
    background: "#020617",
    padding: 16,
    borderRadius: 8,
  },
  resultTitle: {
    marginBottom: 8,
  },
  pre: {
    whiteSpace: "pre-wrap",
    fontSize: "0.85rem",
    lineHeight: 1.4,
  },
};