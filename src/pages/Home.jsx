
import { useState } from 'react';

export default function Home() {
  const [lang, setLang] = useState('fr');

  const content = {
    fr: {
      title: 'Bienvenue sur A KI PRI SA YÉ',
      description: 'L’application citoyenne pour lutter contre la vie chère dans les Outre-mer.',
      chat: 'Accéder au Chat IA Local',
      ocr: 'Scanner un ticket (OCR)',
      budget: 'Comparer les prix ou créer un panier malin',
    },
    gp: {
      title: 'Byenveni asi A KI PRI SA YÉ',
      description: 'On aplikasyon pou palé kont lavi chè an péyi nou.',
      chat: 'Alé an Chat IA Lokal',
      ocr: 'Skannyé on tiké (OCR)',
      budget: 'Konparé pri oben fè on pani ékonomik',
    },
    es: {
      title: 'Bienvenido a A KI PRI SA YÉ',
      description: 'La app ciudadana para luchar contra el alto costo de vida en los territorios de ultramar.',
      chat: 'Acceder al Chat IA Local',
      ocr: 'Escanear un ticket (OCR)',
      budget: 'Comparar precios o crear una cesta inteligente',
    },
  };

  const t = content[lang];

  return (
    <div className="min-h-screen bg-[#121212] text-white p-8 font-sans">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{t.title}</h1>
        <select
          className="bg-[#1e1e1e] text-white border border-gray-700 p-2 rounded"
          value={lang}
          onChange={(e) => setLang(e.target.value)}
        >
          <option value="fr">🇫🇷 Français</option>
          <option value="gp">🇬🇵 Kréyol</option>
          <option value="es">🇪🇸 Español</option>
        </select>
      </div>

      <p className="mb-8 text-gray-300">{t.description}</p>

      <div className="grid gap-6 md:grid-cols-3">
        <a href="/chat" className="bg-[#1e1e1e] hover:bg-[#2a2a2a] p-6 rounded-xl border border-gray-700 transition">
          <h2 className="text-xl font-semibold mb-2">🧠 {t.chat}</h2>
          <p className="text-sm text-gray-400">Posez vos questions en créole, français ou espagnol</p>
        </a>

        <a href="/scan" className="bg-[#1e1e1e] hover:bg-[#2a2a2a] p-6 rounded-xl border border-gray-700 transition">
          <h2 className="text-xl font-semibold mb-2">📷 {t.ocr}</h2>
          <p className="text-sm text-gray-400">Reconnaissance automatique des prix sur ticket</p>
        </a>

        <a href="/budget" className="bg-[#1e1e1e] hover:bg-[#2a2a2a] p-6 rounded-xl border border-gray-700 transition">
          <h2 className="text-xl font-semibold mb-2">💸 {t.budget}</h2>
          <p className="text-sm text-gray-400">Comparez les prix locaux en un clic</p>
        </a>
      </div>
    </div>
  );
}
