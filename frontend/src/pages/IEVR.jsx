/**
 * IEVR Page - Indice d'Écart de Vie Réelle
 *
 * Affiche l'Indice d'Écart de Vie Réelle (IEVR) pour les territoires DOM-COM.
 * Indicateur synthétique mesurant l'écart du coût de la vie par rapport
 * à la France métropolitaine.
 */

import { Helmet } from 'react-helmet-async';
import { IEVR } from '../components/IEVR';

export default function IEVRPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
      <Helmet>
        <title>Indice IEVR — A KI PRI SA YÉ</title>
        <meta
          name="description"
          content="Indice d'Écart de Vie Réelle (IEVR) — Mesurez l'écart du coût de la vie dans les territoires ultramarins par rapport à la France métropolitaine."
        />
        <link rel="canonical" href="https://teetee971.github.io/akiprisaye-web/ievr" />
        <link
          rel="alternate"
          hrefLang="fr"
          href="https://teetee971.github.io/akiprisaye-web/ievr"
        />
        <link
          rel="alternate"
          hrefLang="x-default"
          href="https://teetee971.github.io/akiprisaye-web/ievr"
        />
      </Helmet>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <IEVR />
      </div>
    </div>
  );
}
