import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, storage } from '../firebase';
import { collection, addDoc, onSnapshot, orderBy, query } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Tesseract from 'tesseract.js';

export default function Admin() {
  const { logout, currentUser } = useAuth();
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState('');
  const [extractedProducts, setExtractedProducts] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  // Listen to tickets collection
  useEffect(() => {
    const q = query(collection(db, 'tickets'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ticketsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTickets(ticketsData);
    }, (error) => {
      console.error('Error fetching tickets:', error);
      setError('Erreur lors du chargement des tickets: ' + error.message);
    });

    return () => unsubscribe();
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Check file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(selectedFile.type)) {
        setError('Format de fichier non supporté. Utilisez JPG, PNG ou PDF.');
        return;
      }
      
      // Check file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('Fichier trop volumineux. Taille maximum: 10MB.');
        return;
      }
      
      setFile(selectedFile);
      setError('');
      setOcrResult('');
      setExtractedProducts([]);
    }
  };

  const extractProductsFromText = (text) => {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    const products = [];
    
    // Improved regex patterns to extract products and prices
    const pricePatterns = [
      /(\d+[,.]?\d*)\s*€/g,        // 1.50€ or 1,50€
      /€\s*(\d+[,.]?\d*)/g,        // €1.50 or €1,50
      /(\d+[,.]?\d*)\s*EUR/gi,     // 1.50 EUR
    ];
    
    lines.forEach(line => {
      let foundPrice = null;
      let priceMatch = null;
      
      // Try each price pattern
      for (const pattern of pricePatterns) {
        const matches = Array.from(line.matchAll(pattern));
        if (matches.length > 0) {
          priceMatch = matches[0];
          foundPrice = priceMatch[1].replace(',', '.');
          break;
        }
      }
      
      if (foundPrice && parseFloat(foundPrice) > 0) {
        // Extract product name (text before the price)
        const productName = line.replace(priceMatch[0], '').trim();
        
        // Filter out lines that are too short or contain mostly numbers
        if (productName.length > 2 && !/^\d+[\s\d]*$/.test(productName)) {
          products.push({
            name: productName,
            price: parseFloat(foundPrice),
            rawLine: line
          });
        }
      }
    });
    
    return products;
  };

  const processFile = async () => {
    if (!file) return;
    
    setProcessing(true);
    setError('');
    setUploadProgress(0);
    
    try {
      // Upload file to Firebase Storage
      setUploadProgress(25);
      const storageRef = ref(storage, `tickets/${Date.now()}-${file.name}`);
      const uploadResult = await uploadBytes(storageRef, file);
      const fileUrl = await getDownloadURL(uploadResult.ref);
      setUploadProgress(50);

      // Process with OCR if it's an image
      if (file.type.startsWith('image/')) {
        setUploadProgress(60);
        const { data: { text } } = await Tesseract.recognize(file, 'fra', {
          logger: m => {
            if (m.status === 'recognizing text') {
              setUploadProgress(60 + (m.progress * 30)); // 60% to 90%
            }
          }
        });
        
        setOcrResult(text);
        
        // Extract products and prices
        const products = extractProductsFromText(text);
        setExtractedProducts(products);
        setUploadProgress(95);
        
        // Save to Firestore
        await addDoc(collection(db, 'tickets'), {
          fileName: file.name,
          fileUrl: fileUrl,
          ocrText: text,
          extractedProducts: products,
          createdAt: new Date(),
          createdBy: currentUser.uid,
          createdByEmail: currentUser.email,
          fileType: 'image',
          status: 'processed'
        });
        
      } else {
        // For PDF files, just store the file info
        await addDoc(collection(db, 'tickets'), {
          fileName: file.name,
          fileUrl: fileUrl,
          fileType: 'pdf',
          createdAt: new Date(),
          createdBy: currentUser.uid,
          createdByEmail: currentUser.email,
          status: 'pending_manual_review'
        });
      }
      
      setUploadProgress(100);
      setFile(null);
      document.getElementById('file-input').value = '';
      
    } catch (error) {
      setError('Erreur lors du traitement: ' + error.message);
      console.error('Processing error:', error);
    }
    
    setProcessing(false);
    setUploadProgress(0);
  };

  const handleLogout = () => {
    logout();
  };

  const resetForm = () => {
    setFile(null);
    setOcrResult('');
    setExtractedProducts([]);
    setError('');
    setUploadProgress(0);
    document.getElementById('file-input').value = '';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Administration</h1>
              <p className="text-sm text-gray-600">A KI PRI SA YÉ - Interface Admin</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {currentUser?.email}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* Upload section */}
          <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  📄 Upload et analyse de tickets
                </h3>
                <button
                  onClick={resetForm}
                  className="text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  Réinitialiser
                </button>
              </div>
              
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Sélectionner un ticket (JPG, PNG, PDF) - Max 10MB
                  </label>
                  <input
                    id="file-input"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    disabled={processing}
                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 disabled:opacity-50"
                  />
                </div>
                
                {file && (
                  <div className="bg-blue-50 p-4 rounded">
                    <p className="text-sm text-blue-700">
                      Fichier sélectionné: <strong>{file.name}</strong>
                    </p>
                    <p className="text-xs text-blue-600">
                      Taille: {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                )}
                
                {processing && uploadProgress > 0 && (
                  <div className="bg-blue-50 p-4 rounded">
                    <div className="flex justify-between text-sm text-blue-700 mb-2">
                      <span>Progression</span>
                      <span>{Math.round(uploadProgress)}%</span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                
                <button
                  onClick={processFile}
                  disabled={!file || processing}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-medium"
                >
                  {processing ? '🔄 Traitement en cours...' : '🚀 Analyser le ticket'}
                </button>
              </div>

              {/* OCR Results */}
              {ocrResult && (
                <div className="mt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-2">Texte extrait:</h4>
                  <div className="bg-gray-100 p-4 rounded text-sm whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {ocrResult}
                  </div>
                </div>
              )}

              {/* Extracted Products */}
              {extractedProducts.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-2">
                    Produits détectés ({extractedProducts.length}):
                  </h4>
                  <div className="bg-green-50 p-4 rounded space-y-2">
                    {extractedProducts.map((product, index) => (
                      <div key={index} className="text-sm py-1 border-b border-green-200 last:border-b-0">
                        <span className="font-medium">{product.name}</span> - 
                        <span className="text-green-600 ml-1 font-semibold">{product.price}€</span>
                        <div className="text-xs text-gray-500 mt-1">
                          Ligne originale: "{product.rawLine}"
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tickets history */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                📋 Historique des tickets analysés ({tickets.length})
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Liste des tickets traités par OCR
              </p>
            </div>
            <ul className="divide-y divide-gray-200">
              {tickets.length === 0 ? (
                <li className="px-4 py-4 text-center text-gray-500">
                  Aucun ticket analysé pour le moment
                </li>
              ) : (
                tickets.map((ticket) => (
                  <li key={ticket.id} className="px-4 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <span className="text-2xl">
                            {ticket.fileType === 'pdf' ? '📄' : '🖼️'}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {ticket.fileName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {ticket.createdAt?.toDate?.()?.toLocaleString('fr-FR') || 'Date inconnue'}
                          </div>
                          <div className="text-sm text-gray-500">
                            Par: {ticket.createdByEmail}
                          </div>
                          {ticket.extractedProducts && (
                            <div className="text-sm text-emerald-600">
                              {ticket.extractedProducts.length} produits détectés
                            </div>
                          )}
                          {ticket.status && (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              ticket.status === 'processed' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {ticket.status}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {ticket.fileUrl && (
                          <a
                            href={ticket.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-600 hover:text-emerald-500 text-sm"
                          >
                            Voir fichier
                          </a>
                        )}
                      </div>
                    </div>
                    {ticket.extractedProducts && ticket.extractedProducts.length > 0 && (
                      <div className="mt-2 ml-12">
                        <details className="text-sm">
                          <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                            Voir les produits détectés
                          </summary>
                          <div className="mt-2 bg-gray-50 p-2 rounded space-y-1">
                            {ticket.extractedProducts.map((product, index) => (
                              <div key={index} className="py-1">
                                <span className="font-medium">{product.name}</span> - 
                                <span className="text-emerald-600 ml-1">{product.price}€</span>
                              </div>
                            ))}
                          </div>
                        </details>
                      </div>
                    )}
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}