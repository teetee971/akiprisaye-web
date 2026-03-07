 
/**
 * Lutte contre la Vie Chère - Complete Page
 * Comprehensive information about fighting high prices in French overseas territories
 */

import { 
  TrendingDown, 
  Users, 
  FileText, 
  Mail, 
  Phone, 
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  BarChart3
} from 'lucide-react';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';
import { LUTTE_VIE_CHERE_STATS } from '../data/lutteVieChereStats';

export function LutteVieChere() {
  const stats = LUTTE_VIE_CHERE_STATS;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Hero Section — real Unsplash photo with gradient fallback */}
      <div className="container mx-auto px-4 pt-6 pb-2">
        <HeroImage
          src={PAGE_HERO_IMAGES.lutteVieChere}
          alt="Solidarité citoyenne — lutte contre la vie chère"
          gradient="from-blue-900 to-purple-950"
          height="h-52 sm:h-72"
        >
          <h1 className="text-3xl md:text-5xl font-bold text-white drop-shadow-lg">
            Lutte contre la Vie Chère
          </h1>
          <p className="text-lg md:text-xl text-slate-200 drop-shadow max-w-3xl">
            Ensemble, agissons pour des prix justes dans les territoires d'Outre-mer
          </p>
          <div className="flex flex-wrap gap-3 mt-2">
            <a
              href="#signaler"
              className="px-5 py-2 bg-white text-blue-700 rounded-lg font-semibold hover:bg-slate-100 transition-colors text-sm"
            >
              Signaler un prix abusif
            </a>
            <a
              href="#ressources"
              className="px-5 py-2 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition-colors text-sm"
            >
              Accéder aux ressources
            </a>
          </div>
        </HeroImage>
      </div>

      {/* Statistics Section */}
      <div className="container mx-auto px-4 -mt-8">
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
          Dernière mise à jour : {stats.updatedAt}
        </p>
        <div className="grid md:grid-cols-4 gap-4 mb-12">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="w-8 h-8 text-orange-500" />
              <div className="text-3xl font-bold text-slate-900 dark:text-white">
                {stats.totalReports.toLocaleString()}
              </div>
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Signalements effectués
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div className="text-3xl font-bold text-slate-900 dark:text-white">
                {stats.activeActions}
              </div>
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Actions en cours
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <TrendingDown className="w-8 h-8 text-blue-500" />
              <div className="text-3xl font-bold text-slate-900 dark:text-white">
                {stats.averageSavings}€
              </div>
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Économies moyennes/mois
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-8 h-8 text-purple-500" />
              <div className="text-3xl font-bold text-slate-900 dark:text-white">
                {stats.participatingUsers.toLocaleString()}
              </div>
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Citoyens engagés
            </div>
          </div>
        </div>

        {/* Mission Section */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-8 mb-12 shadow-lg">
          <h2 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white">
            Notre Mission
          </h2>
          <div className="prose dark:prose-invert max-w-none">
            <p className="text-lg text-slate-700 dark:text-slate-300 mb-4">
              La vie chère dans les territoires d'Outre-mer est une réalité qui affecte 
              quotidiennement des millions de citoyens. <strong>A KI PRI SA YÉ</strong> s'engage 
              activement dans la lutte pour des prix justes et transparents.
            </p>
            <p className="text-slate-700 dark:text-slate-300 mb-4">
              Notre plateforme permet de :
            </p>
            <ul className="space-y-2 text-slate-700 dark:text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                <span>Comparer les prix en temps réel entre les territoires et la métropole</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                <span>Signaler les prix anormalement élevés aux autorités compétentes</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                <span>Suivre l'évolution des prix et détecter les hausses injustifiées</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                <span>Informer et sensibiliser les consommateurs</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Active Actions Section */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-8 mb-12 shadow-lg">
          <h2 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white flex items-center gap-3">
            <BarChart3 className="w-8 h-8" />
            Actions en Cours
          </h2>
          <div className="space-y-4">
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500 rounded-lg">
              <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-2">
                Hausse injustifiée - Produits de base (Guadeloupe)
              </h3>
              <p className="text-sm text-orange-800 dark:text-orange-200 mb-2">
                Augmentation de 15% sur plusieurs produits alimentaires de base détectée.
                Signalement transmis à la DGCCRF.
              </p>
              <div className="text-xs text-orange-700 dark:text-orange-300">
                Status: En cours d'enquête • Mis à jour il y a 2 jours
              </div>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-lg">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Observatoire des prix - Nouvelle campagne (La Réunion)
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                Lancement d'une collecte participative de données sur les produits frais locaux.
              </p>
              <div className="text-xs text-blue-700 dark:text-blue-300">
                Status: Collecte en cours • 247 contributions reçues
              </div>
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded-lg">
              <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                Baisse confirmée - Distribution (Martinique)
              </h3>
              <p className="text-sm text-green-800 dark:text-green-200 mb-2">
                Suite aux signalements, une enseigne a revu ses tarifs à la baisse sur 50+ produits.
              </p>
              <div className="text-xs text-green-700 dark:text-green-300">
                Status: Résolu • Impact: -3.2% en moyenne
              </div>
            </div>
          </div>
        </div>

        {/* Contact Institutions */}
        <div id="ressources" className="bg-white dark:bg-slate-800 rounded-xl p-8 mb-12 shadow-lg">
          <h2 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white">
            Contacter les Institutions
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <h3 className="font-semibold text-lg mb-3 text-slate-900 dark:text-white">
                DGCCRF - Direction Générale de la Concurrence
              </h3>
              <div className="space-y-2">
                <a 
                  href="https://signal.conso.gouv.fr/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  Signaler en ligne (SignalConso)
                </a>
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <Phone className="w-4 h-4" />
                  <span>39 39 (Service gratuit + prix d'appel)</span>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <h3 className="font-semibold text-lg mb-3 text-slate-900 dark:text-white">
                Associations de Consommateurs
              </h3>
              <div className="space-y-2">
                <a 
                  href="https://www.ufc-quechoisir.fr/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  UFC-Que Choisir
                </a>
                <a 
                  href="https://www.famillesrurales.org/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  Familles Rurales
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Resources Section */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-8 mb-12 shadow-lg">
          <h2 className="text-3xl font-bold mb-6 text-slate-900 dark:text-white flex items-center gap-3">
            <FileText className="w-8 h-8" />
            Ressources Citoyennes
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <a 
              href="/methodologie"
              className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
            >
              <h4 className="font-semibold mb-2 text-slate-900 dark:text-white">
                Guide du Consommateur
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Vos droits et recours en cas de prix abusifs
              </p>
            </a>

            <a 
              href="/observatoire"
              className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
            >
              <h4 className="font-semibold mb-2 text-slate-900 dark:text-white">
                Observatoire des Prix
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Données officielles et analyses territoriales
              </p>
            </a>

            <a 
              href="/faq"
              className="p-4 bg-slate-50 dark:bg-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
            >
              <h4 className="font-semibold mb-2 text-slate-900 dark:text-white">
                Questions Fréquentes
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Réponses aux questions les plus courantes
              </p>
            </a>
          </div>
        </div>

        {/* CTA Section */}
        <div id="signaler" className="bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-xl p-8 mb-12 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Vous constatez un prix abusif ?
          </h2>
          <p className="text-lg mb-6 opacity-90">
            Signalez-le en quelques clics et contribuez à la lutte collective
          </p>
          <a
            href="/signalement"
            className="inline-block px-8 py-4 bg-white text-orange-600 rounded-lg font-semibold hover:bg-slate-100 transition-colors"
          >
            Faire un signalement
          </a>
        </div>
      </div>
    </div>
  );
}
