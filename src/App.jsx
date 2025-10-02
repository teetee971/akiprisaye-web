import React, { useEffect, useState } from 'react'
import Navbar from './components/Navbar'
import Carousel from './components/Carousel'
import Produits from './pages/Produits'
import Apropos from './pages/Apropos'

export default function App() {
  const [page, setPage] = useState('home')

  const renderPage = () => {
    switch (page) {
      case 'produits':
        return <Produits />
      case 'apropos':
        return <Apropos />
      default:
        return <Carousel />
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar setPage={setPage} />
      <div className="p-4">{renderPage()}</div>
    </div>
  )
}
