import React, { useEffect, useState } from 'react'

const images = [
  '/Application.png',
  '/Carte.png',
  '/Budget.png',
  '/VieChere.png',
  '/Classement.png'
]

export default function Carousel() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent(prev => (prev + 1) % images.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="w-full h-64 md:h-96 overflow-hidden relative">
      {images.map((img, idx) => (
        <img key={idx} src={img} alt="slide" 
          className={`absolute w-full h-full object-cover transition-opacity duration-1000 ${idx === current ? 'opacity-100' : 'opacity-0'}`} />
      ))}
    </div>
  )
}
