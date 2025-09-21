import React from "react";

export default function Hero() {
  return (
    <section
      id="application"
      className="relative flex flex-col items-center justify-center text-center px-4 py-16 bg-gradient-to-b from-gray-900 to-gray-800 text-white"
    >
      <h2 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
        Gérez Votre Budget Facilement
      </h2>
      <p className="max-w-2xl text-base md:text-lg text-gray-300 mb-6">
        A KI PRI SA YÉ vous aide à comparer les prix en DOM-TOM et à lutter
        contre la vie chère.
      </p>
      <a
        href="#budget"
        className="px-6 py-3 bg-yellow-500 text-gray-900 font-semibold rounded-lg shadow hover:bg-yellow-400 transition"
      >
        Découvrir l'application
      </a>
    </section>
  );
}