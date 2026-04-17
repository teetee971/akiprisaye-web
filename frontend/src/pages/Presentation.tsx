import React from 'react';
import AkiLogo from '../components/brand/AkiLogo';
import ImageGallery from '../components/showcase/ImageGallery';
import { PlayCircle } from 'lucide-react';
export default function Presentation() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8">
      <div className="max-w-5xl mx-auto text-center">
        <AkiLogo />
        <h1 className="text-4xl font-black text-white mt-10 tracking-tight">
          L'IA au service de la Souveraineté
        </h1>
        <button
          type="button"
          aria-label="Lire la vidéo de présentation"
          className="w-full my-12 aspect-video bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-center group cursor-pointer shadow-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <PlayCircle
            size={80}
            className="text-blue-500 group-hover:scale-110 transition-transform"
            aria-hidden="true"
          />
        </button>
        <ImageGallery />
      </div>
    </div>
  );
}
