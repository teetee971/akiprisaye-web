/**
 * ConseilBudgetDuJour – Astuce économie locale quotidienne
 *
 * Affiche un conseil pratique adapté aux DOM qui change chaque jour.
 * Aide les utilisateurs à mieux gérer leur budget au quotidien.
 */

import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Lightbulb } from 'lucide-react';

interface Conseil {
  texte: string;
  emoji: string;
  lien?: { to: string; label: string };
  categorie: 'alimentation' | 'transport' | 'economie' | 'local' | 'entraide' | 'numerique';
}

const CONSEILS: Conseil[] = [
  { emoji: '🛒', categorie: 'alimentation', texte: "Comparez les prix avant de faire vos courses : un même produit peut varier de 15 à 30 % entre enseignes.", lien: { to: '/comparateur', label: 'Comparer les prix' } },
  { emoji: '📅', categorie: 'alimentation', texte: "Faites votre liste de courses à l'avance et achetez en une seule fois pour éviter les achats impulsifs et économiser sur l'essence." },
  { emoji: '🌿', categorie: 'local', texte: "Les fruits et légumes locaux sont souvent 2 à 3 fois moins chers que les produits importés. Privilégiez le marché du samedi matin.", lien: { to: '/solidarite', label: 'Économie locale' } },
  { emoji: '📱', categorie: 'numerique', texte: "Scannez vos tickets de caisse pour suivre l'évolution de vos dépenses et repérer les produits dont le prix a augmenté.", lien: { to: '/scanner', label: 'Scanner un ticket' } },
  { emoji: '🔔', categorie: 'economie', texte: "Créez une alerte prix sur vos produits du quotidien. Vous serez notifié dès qu'ils passent en promotion.", lien: { to: '/alertes-prix', label: 'Créer une alerte' } },
  { emoji: '🤝', categorie: 'entraide', texte: "Organisez des achats groupés avec vos voisins pour bénéficier de tarifs préférentiels et partager les frais de livraison.", lien: { to: '/solidarite', label: "Réseau d'entraide" } },
  { emoji: '🥚', categorie: 'alimentation', texte: "Les marques de distributeur (MDD) coûtent en moyenne 30 % moins cher que les grandes marques, pour une qualité souvent équivalente." },
  { emoji: '🏋️', categorie: 'local', texte: "Empruntez du matériel de sport ou de bricolage plutôt que d'acheter. Économisez et réduisez les déchets.", lien: { to: '/solidarite', label: 'Prêt de matériel' } },
  { emoji: '⚖️', categorie: 'alimentation', texte: "Vérifiez le prix au kilo affiché en rayons. Un grand format est souvent moins cher à l'unité, mais pas toujours !" },
  { emoji: '💡', categorie: 'economie', texte: "Consultez l'observatoire des prix pour suivre l'inflation sur votre territoire et anticiper vos achats.", lien: { to: '/tableau-inflation', label: "Voir l'inflation" } },
  { emoji: '🐟', categorie: 'local', texte: "Le poisson local péché du jour est souvent plus frais et moins cher que les surgelés importés. Renseignez-vous auprès des pêcheurs locaux." },
  { emoji: '🌾', categorie: 'local', texte: "Les producteurs locaux peuvent vous vendre directement. Cherchez les AMAP ou groupements de producteurs de votre île." },
  { emoji: '🧾', categorie: 'economie', texte: "Gardez vos tickets de caisse et comparez vos dépenses mois après mois. Identifier une hausse de 5 % peut vous faire économiser 200 €/an." },
  { emoji: '♻️', categorie: 'economie', texte: "Les promotions de fin de semaine sur les produits frais permettent d'économiser jusqu'à 40 % sur la viande et le poisson." },
  { emoji: '🚗', categorie: 'transport', texte: "Comparez le prix du carburant entre les stations avant de faire le plein. Les stations-service offrent parfois des réductions fidélité.", lien: { to: '/comparateur', label: 'Comparateurs' } },
  { emoji: '📦', categorie: 'alimentation', texte: "Achetez certains produits secs (riz, pâtes, légumineuses) en grande quantité. Le prix au kilo baisse fortement à partir de 5 kg." },
  { emoji: '🔍', categorie: 'numerique', texte: "Avant tout achat important, consultez l'historique des prix. Un produit à prix cassé n'est pas toujours une vraie promo !", lien: { to: '/historique-prix', label: 'Historique des prix' } },
  { emoji: '🌴', categorie: 'local', texte: "Faites pousser quelques herbes aromatiques sur votre balcon (ciboulette, persil, thym). Un plant à 2 € vous évitera des achats pendant des mois." },
  { emoji: '🍌', categorie: 'local', texte: "La banane locale est l'un des aliments les plus nutritifs et économiques des Antilles. Elle peut remplacer bien des snacks industriels hors de prix." },
  { emoji: '📊', categorie: 'economie', texte: "Signalez un prix abusif ou une variation anormale. Vos données citoyennes aident à surveiller le marché et protéger les consommateurs.", lien: { to: '/signalement', label: 'Signaler un abus' } },
];

export default function ConseilBudgetDuJour() {
  // Sélection déterministe du conseil selon le jour de l'année
  const conseil = useMemo<Conseil>(() => {
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000,
    );
    return CONSEILS[dayOfYear % CONSEILS.length];
  }, []);

  return (
    <section
      className="rounded-2xl border border-amber-700/30 bg-amber-900/10 p-4"
      aria-label="Conseil budget du jour"
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 text-2xl">{conseil.emoji}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-semibold text-amber-300 uppercase tracking-wide">
              Conseil du jour
            </span>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed">{conseil.texte}</p>
          {conseil.lien && (
            <Link
              to={conseil.lien.to}
              className="inline-flex items-center gap-1 mt-2 text-xs text-amber-400 hover:text-amber-300 font-medium transition-colors"
            >
              {conseil.lien.label} →
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
