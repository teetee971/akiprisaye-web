/**
 * OCR Scanner Component
 *
 * Universal OCR scanner for documents with intelligent parsing.
 * Uses DataUploadZone for file input and displays extracted results.
 *
 * Features:
 * - Multiple document type support
 * - Real-time text extraction
 * - Structured data parsing
 * - Editable results
 * - Multi-language support
 */

import React, { useState, useCallback } from 'react';
import { FileText, Check, AlertCircle, Edit2, Save } from 'lucide-react';
import DataUploadZone from './DataUploadZone';
import { useOCR } from '../../hooks/useOCR';
import type { DocumentType } from '../../services/comparatorOcrService';

export interface OCRScannerProps {
  /** Type of document to scan */
  documentType: DocumentType;
  /** Callback when text is extracted */
  onTextExtracted: (text: string, structured?: unknown) => void;
  /** Expected fields for validation */
  expectedFields?: string[];
  /** OCR language (default: 'fra') */
  language?: string;
  /** Show editable result */
  allowEdit?: boolean;
}

/**
 * OCR Scanner Component
 */
export const OCRScanner: React.FC<OCRScannerProps> = ({
  documentType,
  onTextExtracted,
  expectedFields = [],
  language = 'fra',
  allowEdit = true,
}) => {
  const { processFile, processing, result, error: ocrError, progress } = useOCR();
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState('');

  /**
   * Handle file selection
   */
  const handleFilesSelected = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;

      const file = files[0]; // Take first file only

      try {
        const ocrResult = await processFile(file, documentType, language);
        setEditedText(ocrResult.text);
        onTextExtracted(ocrResult.text, ocrResult.structured);
      } catch (err) {
        console.error('OCR processing error:', err);
      }
    },
    [processFile, documentType, language, onTextExtracted]
  );

  /**
   * Save edited text
   */
  const handleSaveEdit = useCallback(() => {
    setIsEditing(false);
    onTextExtracted(editedText, result?.structured);
  }, [editedText, result, onTextExtracted]);

  /**
   * Get document type label
   */
  const getDocumentTypeLabel = (type: DocumentType): string => {
    const labels: Record<DocumentType, string> = {
      invoice: 'Facture',
      list: 'Liste',
      receipt: 'Ticket de caisse',
      id_card: "Carte d'identité",
      generic: 'Document générique',
    };
    return labels[type];
  };

  return (
    <div className="space-y-4">
      {/* Document Type Info */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <FileText className="w-4 h-4" />
        <span>Type de document : {getDocumentTypeLabel(documentType)}</span>
      </div>

      {/* Upload Zone */}
      {!result && !processing && (
        <DataUploadZone
          acceptedTypes={['image/*', 'application/pdf']}
          maxSizeMB={10}
          onFilesSelected={handleFilesSelected}
          multiple={false}
          processingState="idle"
          privacyMessage="🔒 Le traitement OCR est effectué localement dans votre navigateur. Aucune donnée n'est envoyée à un serveur externe."
        />
      )}

      {/* Processing State */}
      {processing && (
        <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-pulse">
              <FileText className="w-12 h-12 text-blue-400" />
            </div>
            <div className="text-center">
              <p className="text-lg font-medium text-gray-200">Extraction du texte en cours...</p>
              <p className="text-sm text-gray-400 mt-1">Cela peut prendre quelques secondes</p>
              {progress > 0 && (
                <div className="mt-4 w-full max-w-xs">
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{progress}%</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {ocrError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-300">Erreur d'extraction</p>
              <p className="text-xs text-red-200 mt-1">{ocrError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Success State - Extracted Text */}
      {result && !processing && (
        <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-5 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-400" />
              <h3 className="text-lg font-semibold text-gray-100">Texte extrait</h3>
              <span className="text-xs text-gray-400">
                (Confiance : {result.confidence.toFixed(1)}%)
              </span>
            </div>

            {allowEdit && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-300 hover:text-gray-100 transition-colors"
                aria-label="Modifier le texte"
              >
                <Edit2 className="w-4 h-4" />
                Modifier
              </button>
            )}

            {isEditing && (
              <button
                onClick={handleSaveEdit}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                aria-label="Enregistrer les modifications"
              >
                <Save className="w-4 h-4" />
                Enregistrer
              </button>
            )}
          </div>

          {/* Extracted Text */}
          {isEditing ? (
            <textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              className="w-full h-64 bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-gray-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              aria-label="Texte extrait (éditable)"
            />
          ) : (
            <div className="bg-slate-800/50 rounded-lg px-4 py-3 max-h-64 overflow-y-auto">
              <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap">
                {result.text || 'Aucun texte extrait'}
              </pre>
            </div>
          )}

          {/* Structured Data Preview (if available) */}
          {!!result.structured && !isEditing && (
            <div className="pt-4 border-t border-slate-700">
              <h4 className="text-sm font-semibold text-gray-300 mb-2">
                Données structurées détectées
              </h4>
              <div className="bg-slate-800/50 rounded-lg px-4 py-3">
                <pre className="text-xs text-gray-400 overflow-x-auto">
                  {JSON.stringify(result.structured, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Low Confidence Warning */}
          {result.confidence < 70 && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
              <p className="text-xs text-yellow-200">
                ⚠️ La qualité de l'extraction est moyenne. Vérifiez le texte extrait et corrigez si
                nécessaire.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OCRScanner;
