import React from "react";

export default function Apropos() {
  const lang = navigator.language.startsWith("en") ? "en" : "fr";
  return (
    <section id="apropos" className="p-6">
      {lang === "fr" ? (
        <div>
          <h2 className="text-2xl mb-2">À propos</h2>
          <p>A KI PRI SA YÉ est une plateforme qui aide les consommateurs à comparer les prix et à mieux gérer leur budget, avec une approche moderne et transparente.</p>
        </div>
      ) : (
        <div>
          <h2 className="text-2xl mb-2">About</h2>
          <p>A KI PRI SA YÉ is a platform that helps consumers compare prices and manage their budget more effectively, with a modern and transparent approach.</p>
        </div>
      )}
    </section>
  );
}