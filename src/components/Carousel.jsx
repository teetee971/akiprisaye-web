import React from 'react'

export default function Carousel() {
  const images = [
    '/Application.png',
    '/Carte.png',
    '/Budget.png',
    '/Classement.png',
    '/VieChere.png'
  ]

  return (
    <div className="w-full flex overflow-x-auto space-x-4 p-4 snap-x snap-mandatory">
      {images.map((src, i) => (
        <img key={i} src={src} alt="slide" className="h-64 rounded-xl shadow-lg snap-center" />
      ))}
    </div>
  )
}
