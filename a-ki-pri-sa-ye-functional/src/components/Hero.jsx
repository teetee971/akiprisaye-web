import { HiArrowNarrowRight } from "react-icons/hi";

// Illustration SVG adaptée dark mode avec meilleure accessibilité
const DomTomIllustration = () => (
  <svg 
    width="220" 
    height="160" 
    viewBox="0 0 220 160" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className="w-44 md:w-56 lg:w-64 h-auto drop-shadow-2xl"
    role="img"
    aria-label="Illustration représentant les territoires DOM-TOM avec des cercles colorés"
  >
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
      id="hero"
      className="relative flex flex-col-reverse md:flex-row items-center justify-center text-center md:text-left px-6 py-16 lg:py-20 min-h-[85vh] bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 text-white overflow-hidden"
      aria-labelledby="hero-title"
      role="banner"
    >
      {/* Effet radial lumineux multiples en arrière-plan */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Gradient principal */}
        <div className="absolute left-1/2 top-1/2 w-[800px] h-[800px] 
          bg-gradient-radial-at-c from-yellow-500/30 via-yellow-400/10 to-transparent rounded-full blur-3xl 
          -translate-x-1/2 -translate-y-1/2 animate-pulse-slow"
        />
        {/* Gradient secondaire pour plus de profondeur */}
        <div className="absolute left-1/3 top-1/3 w-[600px] h-[600px] 
          bg-gradient-radial-at-c from-orange-500/20 via-orange-400/5 to-transparent rounded-full blur-2xl 
          -translate-x-1/2 -translate-y-1/2 animate-pulse"
        />
        {/* Effet de brillance subtil */}
        <div className="absolute right-1/4 bottom-1/4 w-[400px] h-[400px] 
          bg-gradient-radial-at-c from-amber-400/15 to-transparent rounded-full blur-xl 
          animate-pulse-slow"
        />
      </div>

      {/* Container Text + CTA avec glassmorphism amélioré */}
      <div className="relative z-10 max-w-2xl w-full flex flex-col items-center md:items-start 
        bg-gray-900/70 backdrop-blur-xl rounded-2xl shadow-glass border border-white/10
        px-8 py-16 mb-12 md:mb-0 md:mr-8
        before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-white/5 before:to-transparent before:pointer-events-none
        hover:shadow-glass hover:bg-gray-900/75 transition-all duration-500"
      >
        {/* Badge d'accroche amélioré */}
        <div className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold 
          bg-gradient-to-r from-yellow-500 to-orange-500 text-gray-900 rounded-full mb-6 
          shadow-glow animate-bounce-slow
          hover:shadow-glow-lg transition-all duration-300"
          role="banner"
          aria-label="Nouveau service spécial DOM-TOM"
        >
          <span className="animate-pulse">✨</span>
          Nouveau ! Spécial DOM-TOM
        </div>

        {/* Statistique clé avec glassmorphism */}
        <div className="inline-flex items-center gap-2 mb-8 px-6 py-3 
          text-yellow-400 bg-gray-800/40 backdrop-blur-sm rounded-2xl font-bold text-lg 
          shadow-glass-inset border border-yellow-400/20
          hover:bg-gray-800/60 transition-all duration-300"
          role="complementary"
          aria-label="Statistique d'utilisation"
        >
          <span className="text-2xl">🎉</span>
          +10 000 utilisateurs satisfaits
        </div>

        {/* Titre principal avec gradient de texte */}
        <h1
          id="hero-title"
          className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight tracking-tight font-serif
          bg-gradient-to-br from-white via-yellow-100 to-yellow-400 bg-clip-text text-transparent
          drop-shadow-lg"
        >
          Gérez Votre{" "}
          <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent animate-glow">
            Budget
          </span>{" "}
          <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent font-bold">
            Facilement
          </span>
        </h1>

        {/* Sous-titre amélioré */}
        <h2 className="text-xl md:text-2xl text-yellow-100 mb-4 font-medium font-sans 
          drop-shadow-md leading-relaxed">
          Comparer les prix en DOM-TOM, luttez contre la vie chère.
        </h2>

        {/* Description améliorée */}
        <p className="max-w-2xl text-lg md:text-xl text-gray-200 mb-10 font-light leading-relaxed
          drop-shadow-sm">
          A KI PRI SA YÉ vous accompagne pour faire les meilleurs choix et économiser chaque jour. 
          Découvrez une expérience unique, pensée pour vous.
        </p>

        {/* CTA principal avec animations améliorées */}
        <a
          href="#budget"
          aria-label="Découvrir l'application A KI PRI SA YÉ pour économiser sur vos achats"
          className="group inline-flex items-center gap-4 px-10 py-5 
          bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 
          text-gray-900 font-bold text-xl rounded-2xl shadow-glow 
          hover:shadow-glow-lg focus:outline-none focus:ring-4 focus:ring-yellow-500/50 
          transition-all duration-300 transform hover:scale-105 active:scale-95
          border-2 border-yellow-300/50 hover:border-yellow-200"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              window.location.href = '#budget';
            }
          }}
        >
          <span>Découvrir l'application</span>
          <HiArrowNarrowRight 
            className="w-7 h-7 group-hover:translate-x-1 transition-transform duration-300" 
            aria-hidden="true" 
          />
        </a>

        {/* CTA secondaire amélioré */}
        <a
          href="#contact"
          aria-label="En savoir plus sur nos services et nous contacter"
          className="mt-6 inline-block text-lg text-yellow-300 underline decoration-2 underline-offset-4
          hover:text-yellow-200 hover:decoration-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-gray-900
          transition-all duration-300 rounded px-2 py-1"
          role="button"
          tabIndex={0}
        >
          En savoir plus
        </a>

        {/* Témoignage utilisateur avec glassmorphism */}
        <div className="mt-12 text-center flex flex-col items-center 
          bg-gray-800/30 backdrop-blur-sm rounded-xl px-6 py-6 
          border border-white/5 shadow-glass-inset
          hover:bg-gray-800/40 transition-all duration-300"
          role="complementary"
          aria-labelledby="testimonial-author"
        >
          <img
            src="https://randomuser.me/api/portraits/women/44.jpg"
            alt="Portrait de Jeanne, utilisatrice satisfaite de Guadeloupe"
            className="w-16 h-16 rounded-full mb-4 border-3 border-yellow-400 shadow-glow
            hover:border-yellow-300 transition-all duration-300"
            loading="lazy"
            decoding="async"
          />
          <blockquote className="text-yellow-100 italic max-w-md text-lg leading-relaxed mb-3">
            "Grâce à cette application, j'ai économisé chaque mois !"
          </blockquote>
          <cite 
            id="testimonial-author"
            className="text-base text-gray-300 font-medium not-italic"
          >
            — Jeanne, Guadeloupe
          </cite>
        </div>
      </div>

      {/* Illustration SVG améliorée */}
      <div className="relative z-10 flex-shrink-0 mb-12 md:mb-0 md:ml-8
        hover:scale-105 transition-transform duration-500">
        <DomTomIllustration />
      </div>

      {/* Indicateur de scroll avec animation */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10
        animate-bounce text-yellow-400 hover:text-yellow-300 transition-colors duration-300"
        role="button"
        aria-label="Faire défiler vers le bas pour voir plus de contenu"
        tabIndex={0}
        onClick={() => window.scrollBy({ top: window.innerHeight, behavior: 'smooth' })}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            window.scrollBy({ top: window.innerHeight, behavior: 'smooth' });
          }
        }}
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  );
}