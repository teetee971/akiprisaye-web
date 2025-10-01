import React, { useState, useEffect } from 'react'
import img1 from '../assets/app.png'
import img2 from '../assets/carte.png'
import img3 from '../assets/budget.png'
import img4 from '../assets/vie_chere.png'
import img5 from '../assets/classement.png'

const images = [img1, img2, img3, img4, img5]

export default function Carousel() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="w-full max-w-2xl">
      <img src={images[index]} alt="Slide" className="rounded-2xl shadow-lg" />
    </div>
  )
}