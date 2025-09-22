import { useState } from 'react'
import Tesseract from 'tesseract.js'
import { saveTicketLines } from '../services/logic.js'
import { ticketParser } from '../services/ocrParser.js'

export default function OCR(){
  const [file, setFile] = useState(null)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [parsedData, setParsedData] = useState(null)
  const [progress, setProgress] = useState(0)

  const run = async () => {
    if(!file) return
    setLoading(true); setText(''); setSaved(false); setParsedData(null); setProgress(0)
    
    try {
      // Enhanced OCR with progress tracking
      const { data } = await Tesseract.recognize(file, 'fra+eng', {
        logger: m => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100))
          }
        }
      })
      
      const rawText = data.text
      setText(rawText)
      
      // Parse the ticket with enhanced parser
      const parsed = ticketParser.parseTicketText(rawText)
      setParsedData(parsed)
      
      // Save both raw lines and parsed data
      const lines = rawText.split('\n').map(l=>l.trim()).filter(Boolean)
      await saveTicketLines(lines)
      await saveTicketParsed(parsed)
      
      setSaved(true)
    } catch (error) {
      console.error('OCR Error:', error)
      setText('Erreur lors de l\'analyse du ticket. Veuillez réessayer.')
    } finally {
      setLoading(false)
      setProgress(0)
    }
  }

  const saveTicketParsed = async (parsedData) => {
    // Save parsed ticket data to Firestore
    const { db } = await import('../lib/firebase')
    const { collection, doc, setDoc } = await import('firebase/firestore')
    
    const id = String(Date.now())
    await setDoc(doc(collection(db, 'tickets_parsed'), id), {
      id,
      ...parsedData,
      parsedAt: new Date().toISOString()
    })
  }

  return (
    <div className="card p-6">
      <h2 className="text-2xl font-semibold">🧾 Scanner un ticket (OCR Amélioré)</h2>
      
      <div className="mt-4 grid gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Sélectionner une image de ticket
          </label>
          <input 
            type="file" 
            accept="image/*" 
            onChange={e=>setFile(e.target.files?.[0])}
            className="file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-white/10 file:text-white hover:file:bg-white/20 w-full" 
          />
        </div>

        <button 
          onClick={run} 
          disabled={!file||loading} 
          className="link-btn w-full sm:w-auto"
        >
          {loading ? `Analyse en cours... ${progress}%` : '📸 Analyser le ticket'}
        </button>

        {loading && (
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
              style={{width: `${progress}%`}}
            ></div>
          </div>
        )}

        {saved && (
          <div className="bg-green-900/50 border border-green-500 text-green-400 p-3 rounded-lg">
            ✅ Ticket importé et analysé avec succès !
          </div>
        )}

        {parsedData && (
          <div className="grid gap-4 mt-4">
            <div className="card p-4 bg-blue-900/20 border-blue-500">
              <h3 className="text-lg font-semibold mb-3">📊 Analyse du ticket</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div><strong>Magasin:</strong> {parsedData.store}</div>
                <div><strong>Date:</strong> {parsedData.date}</div>
                <div><strong>Articles:</strong> {parsedData.products.length}</div>
                <div><strong>Total:</strong> {parsedData.total ? `${parsedData.total.toFixed(2)}€` : 'Non détecté'}</div>
                <div><strong>Produits locaux:</strong> {parsedData.products.filter(p => p.isLocal).length}</div>
                <div>
                  <strong>Confiance:</strong> 
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${
                    parsedData.confidence >= 80 ? 'bg-green-600' : 
                    parsedData.confidence >= 60 ? 'bg-yellow-600' : 'bg-red-600'
                  }`}>
                    {parsedData.confidence}%
                  </span>
                </div>
              </div>
            </div>

            {parsedData.products.length > 0 && (
              <div className="card p-4">
                <h4 className="font-semibold mb-3">🛒 Produits détectés</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {parsedData.products.map((product, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm bg-gray-800/50 p-2 rounded">
                      <span className="flex items-center gap-2">
                        {product.isLocal && <span className="text-green-400">🌴</span>}
                        {product.name}
                        <span className="text-xs text-gray-400">({product.category})</span>
                      </span>
                      <span className="font-mono">{product.price.toFixed(2)}€</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2">
            Texte OCR brut
          </label>
          <textarea 
            className="card p-3 h-64 w-full font-mono text-sm" 
            value={text} 
            readOnly 
            placeholder="Le texte extrait apparaîtra ici..." 
          />
        </div>
      </div>
    </div>
  )
}