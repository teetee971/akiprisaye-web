 
import { useState, useRef } from 'react';

/**
 * Upload Preuve Component
 * Handles photo upload with size validation (max 5MB)
 * Stores data locally (base64 or blob URL)
 * @param {Function} onUpload - Callback when photo is uploaded
 * @param {Object} currentProof - Current proof data
 */
export function UploadPreuve({ onUpload, currentProof = null }) {
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    
    if (!file) {
      return;
    }

    // Reset error
    setError(null);

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Format non supporté. Utilisez JPG, PNG ou WEBP.');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError('Fichier trop volumineux. Maximum 5 Mo.');
      return;
    }

    try {
      setUploading(true);

      // Create preview
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const base64Data = e.target?.result;
        setPreview(base64Data);
        
        // Pass data to parent
        onUpload({
          name: file.name,
          size: file.size,
          type: file.type,
          data: base64Data, // Store as base64
          uploadedAt: new Date().toISOString(),
        });
        
        setUploading(false);
      };

      reader.onerror = () => {
        setError('Erreur lors de la lecture du fichier.');
        setUploading(false);
      };

      reader.readAsDataURL(file);
    } catch (err) {
      setError('Erreur lors du traitement du fichier.');
      setUploading(false);
      console.error('Upload error:', err);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setError(null);
    onUpload(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Photo du produit ou ticket (facultatif)
      </label>

      {!preview && !currentProof && (
        <div
          onClick={handleClick}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {uploading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-3"></div>
              <p className="text-sm text-gray-600">Traitement en cours...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <svg
                className="w-12 h-12 text-gray-400 mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-sm font-medium text-gray-900 mb-1">
                📷 Ajouter une photo
              </p>
              <p className="text-xs text-gray-500">
                JPG, PNG ou WEBP • Max 5 Mo
              </p>
            </div>
          )}
        </div>
      )}

      {(preview || currentProof) && (
        <div className="relative border border-gray-300 rounded-lg p-4 bg-gray-50">
          <div className="flex items-start space-x-4">
            {/* Preview Image */}
            <div className="flex-shrink-0">
              <img
                src={preview || currentProof?.data}
                alt="Aperçu"
                className="w-24 h-24 object-cover rounded-lg border border-gray-200"
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {currentProof?.name || 'Photo ajoutée'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {currentProof?.size 
                  ? `${(currentProof.size / 1024).toFixed(1)} Ko`
                  : 'Taille inconnue'}
              </p>
              <div className="mt-2 flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleClick}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Remplacer
                </button>
                <span className="text-gray-300">•</span>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="text-xs text-red-600 hover:text-red-700 font-medium"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-800">
            ⚠️ {error}
          </p>
        </div>
      )}

      <p className="text-xs text-gray-500">
        <strong>Note :</strong> La photo est facultative mais renforce la crédibilité de votre observation.
        Elle est stockée localement et ne sera pas publiée sans vérification.
      </p>
    </div>
  );
}
