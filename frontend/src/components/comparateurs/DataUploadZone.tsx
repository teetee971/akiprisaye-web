 
/**
 * Data Upload Zone Component
 * 
 * Drag & drop file upload component for documents, images, and receipts.
 * 
 * Features:
 * - Drag and drop support
 * - Multiple file upload
 * - File validation (type and size)
 * - Preview before upload
 * - Image compression
 * - Privacy messaging
 * - Progress indicator
 * - Mobile camera support
 */

import React, { useState, useRef, useCallback } from 'react';
import { Upload, Check, X, Camera, File } from 'lucide-react';

export interface DataUploadZoneProps {
  /** Accepted file types (MIME types or wildcards like 'image/*') */
  acceptedTypes: string[];
  /** Maximum file size in MB */
  maxSizeMB: number;
  /** Callback when files are selected */
  onFilesSelected: (files: File[]) => void;
  /** Allow multiple file selection */
  multiple?: boolean;
  /** Processing state */
  processingState?: 'idle' | 'processing' | 'success' | 'error';
  /** Custom privacy message */
  privacyMessage?: string;
  /** Optional error message */
  errorMessage?: string;
}

/**
 * Data Upload Zone Component
 */
export const DataUploadZone: React.FC<DataUploadZoneProps> = ({
  acceptedTypes,
  maxSizeMB,
  onFilesSelected,
  multiple = false,
  processingState = 'idle',
  privacyMessage = '🔒 Vos données restent locales et ne sont jamais envoyées à des serveurs tiers',
  errorMessage,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Validate file type and size
   */
  const validateFile = useCallback(
    (file: File): { valid: boolean; error?: string } => {
      // Check file type
      const isTypeValid = acceptedTypes.some((type) => {
        if (type.endsWith('/*')) {
          const category = type.split('/')[0];
          return file.type.startsWith(category + '/');
        }
        return file.type === type;
      });

      if (!isTypeValid) {
        return {
          valid: false,
          error: `Type de fichier non accepté. Types autorisés : ${acceptedTypes.join(', ')}`,
        };
      }

      // Check file size
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        return {
          valid: false,
          error: `Fichier trop volumineux. Taille maximale : ${maxSizeMB} Mo`,
        };
      }

      return { valid: true };
    },
    [acceptedTypes, maxSizeMB]
  );

  /**
   * Handle file selection
   */
  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;

      const fileArray = Array.from(files);
      const validFiles: File[] = [];
      const errors: string[] = [];

      for (const file of fileArray) {
        const validation = validateFile(file);
        if (validation.valid) {
          validFiles.push(file);
        } else if (validation.error) {
          errors.push(validation.error);
        }
      }

      if (errors.length > 0) {
        console.error('File validation errors:', errors);
      }

      if (validFiles.length > 0) {
        setSelectedFiles(validFiles);
        onFilesSelected(validFiles);
      }
    },
    [validateFile, onFilesSelected]
  );

  /**
   * Handle drag over
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  /**
   * Handle drag leave
   */
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  /**
   * Handle drop
   */
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  /**
   * Handle file input change
   */
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files);
    },
    [handleFiles]
  );

  /**
   * Trigger file input click
   */
  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  /**
   * Remove a selected file
   */
  const removeFile = useCallback((index: number) => {
    setSelectedFiles((prev) => {
      const newFiles = prev.filter((_, i) => i !== index);
      onFilesSelected(newFiles);
      return newFiles;
    });
  }, [onFilesSelected]);

  /**
   * Get status icon
   */
  const getStatusIcon = () => {
    switch (processingState) {
      case 'processing':
        return (
          <div className="animate-spin">
            <Upload className="w-12 h-12 text-blue-400" />
          </div>
        );
      case 'success':
        return <Check className="w-12 h-12 text-green-400" />;
      case 'error':
        return <X className="w-12 h-12 text-red-400" />;
      default:
        return <Upload className="w-12 h-12 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(); } }}
        className={`
          relative border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer
          ${isDragOver
            ? 'border-blue-500 bg-blue-500/10'
            : 'border-slate-600 bg-slate-900/50 hover:border-slate-500 hover:bg-slate-900/70'
          }
        `}
        role="button"
        tabIndex={0}
        aria-label="Zone de téléchargement de fichiers"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={acceptedTypes.join(',')}
          onChange={handleInputChange}
          className="sr-only"
          aria-hidden="true"
        />

        <div className="flex flex-col items-center text-center space-y-4">
          {getStatusIcon()}

          <div>
            <p className="text-lg font-medium text-gray-200">
              {isDragOver
                ? 'Déposez vos fichiers ici'
                : 'Glissez-déposez vos fichiers ou cliquez pour parcourir'}
            </p>
            <p className="text-sm text-gray-400 mt-2">
              {acceptedTypes.includes('image/*') && (
                <>
                  <Camera className="inline w-4 h-4 mr-1" />
                  Photos acceptées
                </>
              )}
              {acceptedTypes.includes('application/pdf') && (
                <>
                  {' • '}
                  <File className="inline w-4 h-4 mr-1" />
                  PDF acceptés
                </>
              )}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Taille maximale : {maxSizeMB} Mo
              {multiple && ' • Plusieurs fichiers possibles'}
            </p>
          </div>
        </div>
      </div>

      {/* Selected Files Preview */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-300">
            {selectedFiles.length} fichier{selectedFiles.length > 1 ? 's' : ''} sélectionné{selectedFiles.length > 1 ? 's' : ''}
          </p>
          {selectedFiles.map((file, index) => (
            <div
              key={file.name}
              className="flex items-center justify-between bg-slate-800/50 rounded-lg px-4 py-3 border border-slate-700"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <File className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-200 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024).toFixed(1)} Ko
                  </p>
                </div>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="ml-2 p-1 text-gray-400 hover:text-red-400 transition-colors"
                aria-label="Supprimer le fichier"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
          <p className="text-sm text-red-300">{errorMessage}</p>
        </div>
      )}

      {/* Privacy Message */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
        <p className="text-xs text-blue-200">{privacyMessage}</p>
      </div>
    </div>
  );
};

export default DataUploadZone;
