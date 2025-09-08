import { Sparkles } from "lucide-react";
export default function Accueil(){
  return (
    <section className="prose max-w-none">
      <h1>Bienvenue <span aria-hidden>👋</span></h1>
      <p>Suivez les prix, maîtrisez votre budget, et luttez contre la vie chère en temps réel.</p>
      <p className="card">Astuce: Ajoutez vos produits favoris pour recevoir les variations de prix rapidement.</p>
      <p className="inline-flex items-center gap-2 text-emerald-700"><Sparkles size={18}/> Prêt(e) ? Parcourez les produits !</p>
    </section>
  );
}
