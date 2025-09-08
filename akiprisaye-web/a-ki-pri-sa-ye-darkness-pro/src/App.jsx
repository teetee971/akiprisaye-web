import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './Layout.jsx'
import Home from './pages/Home.jsx'
import Chat from './pages/Chat.jsx'
import OCR from './pages/OCR.jsx'
import Comparateur from './pages/Comparateur.jsx'
import { dict } from './i18n.js'

export default function App(){
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'fr')
  const t = dict[lang]

  useEffect(()=>{ localStorage.setItem('lang', lang) }, [lang])

  return (
    <BrowserRouter>
      <Layout>
        <div className="flex justify-end">
          <select value={lang} onChange={(e)=>setLang(e.target.value)} className="card bg-white/10 text-white px-3 py-2 rounded-xl border-white/10">
            <option value="fr">FR Français</option>
            <option value="ht">HT Kreyòl</option>
            <option value="es">ES Español</option>
          </select>
        </div>
        <Routes>
          <Route path="/" element={<Home lang={lang} />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/ocr" element={<OCR />} />
          <Route path="/comparateur" element={<Comparateur />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
