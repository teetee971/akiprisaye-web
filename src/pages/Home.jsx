import React from "react";
import Carrousel from "../components/Carrousel";

export default function Home() {
  return (
    <div>
      <Carrousel />
      <div className="p-6 text-center">
        <h2 className="text-3xl font-bold">Bienvenue sur A KI PRI SA YÉ</h2>
        <p className="mt-4">Votre comparateur de prix intelligent et immersif.</p>
      </div>
    </div>
  );
}