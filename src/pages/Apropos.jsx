import React, { useEffect, useState } from 'react'

export default function Apropos() {
  const [lang, setLang] = useState('fr')

  useEffect(() => {
    const userLang = navigator.language.startsWith('fr') ? 'fr' : 'en'
    setLang(userLang)
  }, [])

  return (
    <div className="prose prose-invert max-w-3xl">
      {lang === 'fr' ? (
        <div>
          <h2>À propos de A KI PRI SA YÉ</h2>
          <p>
            A KI PRI SA YÉ est une application professionnelle conçue pour aider
            les consommateurs à comparer les prix, suivre leur budget et lutter
            contre la vie chère dans les territoires d’outre-mer. Elle propose
            une interface moderne et immersive, des données fiables et une
            navigation simple.
          </p>
        </div>
      ) : (
        <div>
          <h2>About A KI PRI SA YÉ</h2>
          <p>
            A KI PRI SA YÉ is a professional application designed to help
            consumers compare prices, manage their budget, and fight against the
            high cost of living in overseas territories. It offers a modern,
            immersive interface, reliable data, and easy navigation.
          </p>
        </div>
      )}
    </div>
  )
}
