/**
 * Page d'évaluation cosmétique
 * Module basé sur les données officielles uniquement
 * (CosIng, ANSES, ECHA, Règlement CE 1223/2009)
 */

import { Helmet } from 'react-helmet-async';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';
import CosmeticEvaluation from '../components/CosmeticEvaluation';

export default function EvaluationCosmetiquePage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Helmet>
        <title>Évaluation Cosmétique — A KI PRI SA YÉ</title>
        <meta
          name="description"
          content="Évaluez la sécurité des produits cosmétiques vendus dans les DOM à partir des sources officielles (CosIng, ANSES, ECHA, Règlement CE 1223/2009)."
        />
        <link
          rel="canonical"
          href="https://teetee971.github.io/akiprisaye-web/evaluation-cosmetique"
        />
        <link
          rel="alternate"
          hrefLang="fr"
          href="https://teetee971.github.io/akiprisaye-web/evaluation-cosmetique"
        />
        <link
          rel="alternate"
          hrefLang="x-default"
          href="https://teetee971.github.io/akiprisaye-web/evaluation-cosmetique"
        />
      </Helmet>
      <HeroImage
        src={PAGE_HERO_IMAGES.evaluationCosmetique}
        alt="Évaluation cosmétique"
        gradient="from-slate-950 to-pink-900"
        height="h-40 sm:h-52"
      >
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>
          💄 Évaluation cosmétique
        </h1>
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)' }}>
          Analysez les produits cosmétiques vendus dans les DOM
        </p>
      </HeroImage>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CosmeticEvaluation />
      </div>
    </div>
  );
}
