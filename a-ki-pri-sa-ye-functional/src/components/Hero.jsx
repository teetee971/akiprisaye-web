import { HiArrowNarrowRight } from "react-icons/hi";

// Illustration SVG adaptée dark mode
const DomTomIllustration = () => (
  <svg width="220" height="160" viewBox="0 0 220 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="w-44 md:w-56 h-auto">
    <ellipse cx="110" cy="80" rx="100" ry="60" fill="#FBBF24" opacity="0.15"/>
    <circle cx="70" cy="70" r="30" fill="#F59E42" opacity="0.35"/>
    <circle cx="150" cy="90" r="24" fill="#FBBF24" opacity="0.4"/>
    <circle cx="110" cy="120" r="18" fill="#F59E42" opacity="0.25"/>
    <text x="45" y="90" fontSize="22" fill="#FBBF24" fontWeight="bold">DOM-TOM</text>
  </svg>
);

export default function Hero() {
  return (
    <section
      id="application"
      className="relative flex flex-col-reverse md:flex-row items-center justify-center text-center md:text-left px-6 py-20 min-h-[80vh] bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 text-white overflow-hidden"
      aria-labelledby="hero-title"
    >
      {/* Effet radial lumineux en arrière-plan */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute left-1/2 top-1/2 w-[650px] h-[650px] 
          bg-gradient-radial from-yellow-500/25 to-transparent rounded-full blur-3xl 
          -translate-x-1/2 -translate-y-1/2 animate-pulse"
        />
      </div>

      {/* Container Text + CTA */}
      <div className="relative z-10 max-w-xl w-full flex flex-col items-center md:items-start bg-gray-900/80 backdrop-blur-lg rounded-xl shadow-2xl border border-yellow-700 px-6 py-12 mb-10 md:mb-0 md:mr-8">
        {/* Badge d'accroche */}
        <span className="inline-block px-3 py-1 text-xs font-semibold bg-yellow-500 text-gray-900 rounded-full mb-4 shadow-md animate-bounce">
          Nouveau ! Spécial DOM-TOM
        </span>
        {/* Statistique clé */}
        <span className="inline-block mb-4 px-4 py-2 text-yellow-400 bg-gray-800/60 rounded-xl font-bold text-lg shadow-md">
          +10 000 utilisateurs satisfaits
        </span>
        {/* Titre */}
        <h1
          id="hero-title"
          className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight tracking-tight font-serif"
        >
          Gérez Votre <span className="text-yellow-400">Budget</span> <span className="text-orange-400 font-bold">Facilement</span>
        </h1>
        {/* Sous-titre */}
        <h2 className="text-lg md:text-xl text-yellow-100 mb-2 font-medium font-sans drop-shadow">
          Comparer les prix en DOM-TOM, luttez contre la vie chère.
        </h2>
        {/* Description */}
        <p className="max-w-lg text-base md:text-lg text-gray-300 mb-8 font-light">
          A KI PRI SA YÉ vous accompagne pour faire les meilleurs choix et économiser chaque jour. Découvrez une expérience unique, pensée pour vous.
        </p>
        {/* CTA principal */}
        <a
          href="#budget"
          aria-label="Découvrir l'application"
          className="inline-flex items-center gap-3 px-8 py-4 bg-yellow-400 text-gray-900 font-bold text-lg rounded-xl shadow-lg hover:bg-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition transform hover:scale-105 active:scale-95"
        >
          Découvrir l'application
          <HiArrowNarrowRight className="w-6 h-6" aria-hidden="true" />
        </a>
        {/* CTA secondaire */}
        <a
          href="#contact"
          aria-label="Contactez-nous"
          className="mt-4 inline-block text-sm text-yellow-400 underline hover:text-yellow-300 transition"
        >
          En savoir plus
        </a>
        {/* Témoignage utilisateur */}
        <div className="mt-8 text-center flex flex-col items-center">
          <img
            src="https://randomuser.me/api/portraits/women/44.jpg"
            alt="Jeanne, Guadeloupe"
            className="w-12 h-12 rounded-full mb-2 border-2 border-yellow-400"
          />
          <blockquote className="text-yellow-100 italic max-w-md">
            "Grâce à cette application, j'ai économisé chaque mois !"
          </blockquote>
          <span className="text-sm text-gray-400 mt-2">— Jeanne, Guadeloupe</span>
        </div>
      </div>

      {/* Illustration SVG ou image à droite (desktop) ou en haut (mobile) */}
      <div className="relative z-10 flex-shrink-0 mb-8 md:mb-0 md:ml-8">
        <DomTomIllustration />
      </div>
    </section>
  );
}