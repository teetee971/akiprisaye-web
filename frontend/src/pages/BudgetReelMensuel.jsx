/**
 * BudgetReelMensuel Page
 *
 * Calcule et affiche le budget réel mensuel selon le profil et le territoire.
 * Utilise budget_reference.json et iev_r_reference.json pour les calculs.
 */

import { Helmet } from 'react-helmet-async';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';
import { BudgetReelMensuel } from '../modules/BudgetReelMensuel';

export default function BudgetReelMensuelPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
      <Helmet>
        <title>Budget Réel Mensuel — A KI PRI SA YÉ</title>
        <meta
          name="description"
          content="Calculez votre budget réel mensuel selon votre profil et votre territoire — Guadeloupe, Martinique, Guyane, La Réunion, Mayotte."
        />
        <link
          rel="canonical"
          href="https://teetee971.github.io/akiprisaye-web/budget-reel-mensuel"
        />
        <link
          rel="alternate"
          hrefLang="fr"
          href="https://teetee971.github.io/akiprisaye-web/budget-reel-mensuel"
        />
        <link
          rel="alternate"
          hrefLang="x-default"
          href="https://teetee971.github.io/akiprisaye-web/budget-reel-mensuel"
        />
      </Helmet>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <HeroImage
          src={PAGE_HERO_IMAGES.budgetReel}
          alt="Budget réel mensuel"
          gradient="from-slate-950 to-emerald-900"
          height="h-40 sm:h-52"
        >
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>
            💰 Budget réel mensuel
          </h1>
          <p
            style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)' }}
          >
            Calculez vos charges selon votre situation et votre territoire
          </p>
        </HeroImage>
        <div className="mt-6">
          <BudgetReelMensuel />
        </div>
      </div>
    </div>
  );
}
