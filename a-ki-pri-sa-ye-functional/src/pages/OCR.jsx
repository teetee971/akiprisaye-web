import { useState } from 'react'
import Tesseract from 'tesseract.js'
import { saveTicketLines } from '../services/logic.js'

export default function OCR(){
  const [file, setFile] = useState(null)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  const run = async () => {
    if(!file) return
    setLoading(true); setText(''); setSaved(false)
    const { data } = await Tesseract.recognize(file, 'fra+eng')
    const lines = data.text.split('\n').map(l=>l.trim()).filter(Boolean)
    setText(lines.join('\n'))
    await saveTicketLines(lines)
    setSaved(true)
    setLoading(false)
  }

  return (
    <div className="card p-6">
      <h2 className="text-2xl font-semibold">Scanner un ticket (OCR)</h2>
      <div className="mt-4 grid gap-3">
        <input type="file" accept="image/*" onChange={e=>setFile(e.target.files?.[0])}
          className="file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-white/10 file:text-white hover:file:bg-white/20" />
        <button onClick={run} disabled={!file||loading} className="link-btn w-full sm:w-auto">{loading?'Analyse…':'Analyser le ticket'}</button>
        {saved && <div className="text-green-400">Ticket importé ✔</div>}
        <textarea className="card p-3 h-64" value={text} readOnly placeholder="Texte OCR…" />
      </div>
    </div>
  )
}