 
/**
 * CsvUploader Component
 * Drag & drop file upload component for CSV files
 */
import { useState, useRef, useCallback } from 'react';
import { Upload, FileSpreadsheet, X } from 'lucide-react';
import Papa from 'papaparse';
import { cn } from '@/lib/utils';

export interface CsvUploaderProps {
  onFileLoaded: (data: any[], file: File) => void;
  onError: (error: string) => void;
  acceptedTypes?: string[];
  maxSize?: number; // in MB
}

export function CsvUploader({
  onFileLoaded,
  onError,
  acceptedTypes = ['.csv', '.xlsx'],
  maxSize = 10,
}: CsvUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    // Check file type
    const fileName = file.name.toLowerCase();
    const hasValidExtension = acceptedTypes.some(ext => fileName.endsWith(ext));
    
    if (!hasValidExtension) {
      return `Type de fichier non supporté. Formats acceptés: ${acceptedTypes.join(', ')}`;
    }

    // Check file size
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSize) {
      return `Fichier trop volumineux. Taille maximale: ${maxSize}MB`;
    }

    return null;
  }, [acceptedTypes, maxSize]);

  const parseFile = useCallback(async (file: File) => {
    setIsLoading(true);
    
    try {
      if (file.name.toLowerCase().endsWith('.csv')) {
        // Parse CSV using PapaParse
        Papa.parse(file, {
          complete: (results) => {
            setIsLoading(false);
            if (results.errors.length > 0) {
              onError(`Erreur de parsing: ${results.errors[0].message}`);
              return;
            }
            
            if (!results.data || results.data.length === 0) {
              onError('Fichier CSV vide');
              return;
            }

            onFileLoaded(results.data, file);
          },
          error: (error) => {
            setIsLoading(false);
            onError(`Erreur de parsing: ${error.message}`);
          },
          header: true,
          skipEmptyLines: true,
          transformHeader: (header) => header.trim(),
        });
      } else if (file.name.toLowerCase().endsWith('.xlsx')) {
        // For now, show message that XLSX needs to be converted
        setIsLoading(false);
        onError('Les fichiers Excel (.xlsx) doivent être convertis en CSV. Veuillez sauvegarder votre fichier au format CSV.');
      }
    } catch (error) {
      setIsLoading(false);
      onError(error instanceof Error ? error.message : 'Erreur lors de la lecture du fichier');
    }
  }, [onFileLoaded, onError]);

  const handleFileSelect = useCallback((file: File | null) => {
    if (!file) return;

    const error = validateFile(file);
    if (error) {
      onError(error);
      return;
    }

    setSelectedFile(file);
    parseFile(file);
  }, [validateFile, parseFile, onError]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer',
          'bg-white/70 backdrop-blur-sm',
          isDragging
            ? 'border-blue-400 bg-blue-500/10'
            : 'border-slate-300 hover:border-slate-400 hover:bg-white',
          isLoading && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={isLoading}
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className={cn(
            'p-4 rounded-full transition-colors',
            isDragging ? 'bg-blue-500/20' : 'bg-slate-100'
          )}>
            <Upload className={cn(
              'w-12 h-12 transition-colors',
              isDragging ? 'text-blue-500' : 'text-slate-500'
            )} />
          </div>

          <div className="text-center">
            <p className="mb-1 text-lg font-medium text-slate-900">
              {isDragging ? 'Déposez le fichier ici' : 'Glissez-déposez votre fichier'}
            </p>
            <p className="text-sm text-slate-600">
              ou cliquez pour parcourir
            </p>
          </div>

          <div className="text-center text-xs text-slate-500">
            <p>Formats acceptés: {acceptedTypes.join(', ')}</p>
            <p>Taille maximale: {maxSize}MB</p>
          </div>
        </div>

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-xl">
            <div className="flex items-center space-x-2 text-white">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Lecture du fichier...</span>
            </div>
          </div>
        )}
      </div>

      {/* Selected File Info */}
      {selectedFile && !isLoading && (
        <div className="flex items-center justify-between rounded-lg border border-slate-300 bg-white p-4 backdrop-blur-sm">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <FileSpreadsheet className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">{selectedFile.name}</p>
              <p className="text-xs text-slate-600">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          <button
            onClick={handleRemoveFile}
            className="rounded-lg p-2 transition-colors hover:bg-slate-100"
            aria-label="Supprimer le fichier"
          >
            <X className="h-5 w-5 text-slate-500 hover:text-slate-900" />
          </button>
        </div>
      )}
    </div>
  );
}
