import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './Layout.jsx'
import Home from './pages/Home.jsx'
import Chat from './pages/Chat.jsx'
import OCR from './pages/OCR.jsx'
import Comparateur from './pages/Comparateur.jsx'
import Import from './pages/Import.jsx'

export default function App(){
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home/>} />
          <Route path="/chat" element={<Chat/>} />
          <Route path="/ocr" element={<OCR/>} />
          <Route path="/comparateur" element={<Comparateur/>} />
          <Route path="/import" element={<Import/>} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}