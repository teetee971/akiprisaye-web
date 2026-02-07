import React from 'react';
import { Link } from 'react-router-dom';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassCard } from '@/components/ui/glass-card';
import { CivicButton } from '@/components/ui/CivicButton';
import { DataBadge } from '@/components/ui/DataBadge';

const accessLevels = [
  {
    id: 'PUBLIC',
    title: 'Accès Public',
    price: 'Gratuit',
    subtitle: 'Accès citoyen de base',
    icon: '●',
    description: 'Consultation libre des données publiques observées',
    tagline: '🟢 Toujours accessible sans inscription',
    features: [
      'Comparateur citoyen DOM · ROM · COM',
      'Prix observés, datés et sourcés',
      'Historique simple',
      'Lecture seule',
      'Sans publicité',
    ],
    limits: [],
    notIncluded: [],
  },
  {
    id: 'EXTENDED',
    title: 'Accès Étendu Citoyen',
    price: '2,50 € / mois',
    subtitle: 'Contribution volontaire au maintien du service',
    icon: '◐',
    description: 'Soutenir un service civique indépendant',
    popular: true,
    tagline: 'Cet accès soutient un service civique indépendant, sans publicité ni exploitation commerciale des données.',
    features: [
      'Tout l\'accès public',
      'Alertes locales de variation de prix',
      'Historique étendu (12 mois)',
      'Suivi de produits / territoires',
      'Comparaisons temporelles simples',
    ],
    limits: [],
    notIncluded: [
      'Export de données',
      'API',
      'Recommandations',
      'Notations propriétaires',
    ],
  },
  {
    id: 'ANALYSIS',
    title: 'Accès Analyse Territoriale',
    price: '12 € / mois',
    subtitle: 'Accès aux outils d\'analyse pour l\'observation territoriale',
    icon: '◑',
    description: 'Pour la presse, chercheurs, associations',
    tagline: 'Ce niveau est clé pour la presse, chercheurs, associations.',
    features: [
      'Tout l\'accès étendu',
      'Comparaisons multi-territoires',
      'Séries temporelles longues',
      'Agrégation par domaine (alimentation, énergie, mobilité…)',
      'Exports CSV limités',
      'Méthodologie détaillée',
    ],
    conditions: [
      'Usage non commercial',
      'Redistribution interdite',
      'Citation obligatoire des sources',
    ],
    limits: [],
    notIncluded: [],
  },
  {
    id: 'INSTITUTIONAL',
    title: 'Licence Institutionnelle',
    price: 'Convention annuelle',
    priceDetail: 'Tarification non affichée',
    subtitle: 'Accès contractuel aux données publiques consolidées',
    icon: '○',
    description: 'Pour secteur public, recherche et institutions',
    tagline: 'Cadre officiel, défendable juridiquement.',
    features: [
      'Tous les domaines agrégés',
      'Export open-data avancé (CSV / JSON)',
      'Séries consolidées multi-services',
      'Accès indices globaux',
      'Documentation technique',
      'Support méthodologique',
      'Compatibilité INSEE / Eurostat',
    ],
    guarantees: [
      'Données observées uniquement',
      'Auditabilité complète',
      'Transparence méthodologique',
      'Aucun tracking individuel',
    ],
    limits: [],
    notIncluded: [],
  },
];

const modules = [
  {
    name: 'Alertes prix locales',
    access: 'Étendu',
    description: 'Notifications automatiques sur les variations de prix',
  },
  {
    name: 'Historique long',
    access: 'Étendu',
    description: 'Accès aux données historiques sur 12 mois',
  },
  {
    name: 'Comparaison multi-domaines',
    access: 'Analyse',
    description: 'Comparer les données entre différents secteurs',
  },
  {
    name: 'Cartographie interactive',
    access: 'Analyse',
    description: 'Visualisation cartographique avancée',
  },
  {
    name: 'Export open-data',
    access: 'Analyse / Institution',
    description: 'Export CSV/JSON des données observées',
  },
  {
    name: 'API publique',
    access: 'Institution',
    description: 'Accès API pour intégrations institutionnelles',
  },
  {
    name: 'Indices globaux',
    access: 'Institution',
    description: 'Accès aux indices consolidés',
  },
];

const contributionIndicators = [
  {
    title: 'Soutien actif',
    description: 'Contribution financière au maintien du service',
  },
  {
    title: 'Utilisateur observateur',
    description: 'Usage régulier des outils de consultation',
  },
  {
    title: 'Analyste territorial',
    description: 'Utilisation des outils d\'analyse avancés',
  },
];

export default function PricingDetailed() {
  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8">
      <GlassContainer className="max-w-7xl mx-auto p-8">
        {/* Hero - Positionnement Global */}
        <div className="mb-12 p-8 bg-blue-900/20 border border-blue-500/30 rounded-xl text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Niveaux d'accès au service
          </h1>
          <div className="space-y-4 text-gray-200 text-lg max-w-3xl mx-auto">
            <p>
              <strong className="text-blue-300">A KI PRI SA YÉ</strong> est un observatoire public indépendant.
            </p>
            <p className="text-xl font-semibold text-green-300">
              L'accès aux données essentielles est libre.
            </p>
            <p className="text-base text-gray-300">
              Certains niveaux d'accès permettent de soutenir le service et d'accéder à des outils d'analyse avancés, 
              <strong className="text-blue-300"> sans jamais altérer les données observées</strong>.
            </p>
          </div>
        </div>

        {/* Access Levels Cards */}
        <div className="grid gap-6 md:grid-cols-2 mb-12">
          {accessLevels.map((level) => (
            <GlassCard
              key={level.id}
              className={`flex flex-col ${
                level.popular
                  ? 'border-2 border-blue-500 shadow-xl shadow-blue-500/20'
                  : ''
              }`}
            >
              {level.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-600 rounded-full text-sm font-bold text-white">
                  POPULAIRE
                </div>
              )}

              <div className="flex-1 space-y-4">
                {/* Header */}
                <div className="flex items-start gap-3">
                  <span className="text-2xl opacity-70">{level.icon}</span>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-white mb-1">{level.title}</h2>
                    <p className="text-sm text-gray-400 italic">{level.subtitle}</p>
                  </div>
                </div>

                {/* Price */}
                <div>
                  <p className="text-2xl font-bold text-blue-400">{level.price}</p>
                  {level.priceDetail && (
                    <p className="text-xs text-gray-500 mt-1">{level.priceDetail}</p>
                  )}
                  <p className="text-sm text-gray-400 mt-2">{level.description}</p>
                </div>

                {/* Tagline */}
                {level.tagline && (
                  <div className="p-3 bg-blue-900/20 border border-blue-600/30 rounded-lg">
                    <p className="text-xs text-blue-200">{level.tagline}</p>
                  </div>
                )}

                {/* Features */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Fonctionnalités
                  </h3>
                  <ul className="space-y-1.5">
                    {level.features.map((feature, idx) => (
                      <li key={idx} className="text-sm text-gray-300 flex items-start">
                        <span className="text-green-400 mr-2 flex-shrink-0">✓</span>
                        <span className="opacity-90">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Conditions (for Analysis) */}
                {level.conditions && level.conditions.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      Conditions d'usage
                    </h3>
                    <ul className="space-y-1.5">
                      {level.conditions.map((condition, idx) => (
                        <li key={idx} className="text-sm text-yellow-300 flex items-start">
                          <span className="text-yellow-400 mr-2 flex-shrink-0">⚠</span>
                          <span className="opacity-80">{condition}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Guarantees (for Institution) */}
                {level.guarantees && level.guarantees.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      Garanties
                    </h3>
                    <ul className="space-y-1.5">
                      {level.guarantees.map((guarantee, idx) => (
                        <li key={idx} className="text-sm text-blue-300 flex items-start">
                          <span className="text-blue-400 mr-2 flex-shrink-0">🔒</span>
                          <span className="opacity-80">{guarantee}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Not Included */}
                {level.notIncluded && level.notIncluded.length > 0 && (
                  <div className="p-3 bg-gray-800/30 border border-gray-600/30 rounded-lg">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      N'inclut pas
                    </h3>
                    <ul className="space-y-1">
                      {level.notIncluded.map((item, idx) => (
                        <li key={idx} className="text-xs text-gray-400">
                          • {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Data Badge */}
                <div className="pt-2">
                  <DataBadge source="INSEE • OPMR • DGCCRF • data.gouv.fr" />
                  <p className="text-xs text-gray-500 mt-2">
                    Données observées • Transparence garantie • Sans publicité
                  </p>
                </div>
              </div>

              {/* CTA */}
              <div className="mt-6">
                <CivicButton
                  variant="primary"
                  className="w-full"
                  onClick={() => {
                    if (level.id === 'PUBLIC') {
                      window.location.href = '/';
                    } else if (level.id === 'INSTITUTIONAL') {
                      window.location.href = '/contact?subject=licence-institutionnelle';
                    } else {
                      window.location.href = `/subscribe?level=${level.id}`;
                    }
                  }}
                >
                  {level.id === 'INSTITUTIONAL'
                    ? 'Demander une convention'
                    : level.id === 'PUBLIC'
                    ? 'Accéder gratuitement'
                    : 'Choisir cet accès'}
                </CivicButton>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Advanced Modules Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-4 text-center">Modules techniques disponibles</h2>
          <p className="text-center text-gray-400 mb-2 text-sm">
            Pas de vente à l'unité, uniquement déblocage par niveau
          </p>
          <p className="text-center text-gray-500 text-xs mb-8">
            Aucun module ne modifie les données affichées • Aucun module n'influence les prix observés
          </p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {modules.map((module, idx) => (
              <GlassCard key={idx} className="bg-gray-800/20 border-gray-600/30">
                <h3 className="font-semibold text-base text-white mb-2">{module.name}</h3>
                <p className="text-xs text-blue-300 mb-2 font-mono">Accès : {module.access}</p>
                <p className="text-xs text-gray-400">{module.description}</p>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* Contribution System - Ultra Sobre */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-4 text-center">
            Indications de contribution
          </h2>
          <p className="text-center text-gray-400 text-sm mb-2">
            Reconnaissance sobre de la contribution citoyenne
          </p>
          <p className="text-center text-gray-500 text-xs mb-8">
            📌 Non public • Non comparatif • Non cumulatif
          </p>
          
          <div className="grid gap-6 md:grid-cols-3 mb-6">
            {contributionIndicators.map((indicator, idx) => (
              <GlassCard key={idx} className="bg-slate-800/30 text-center border-slate-600/30">
                <h3 className="font-semibold text-base text-gray-200 mb-2">{indicator.title}</h3>
                <p className="text-sm text-gray-400">{indicator.description}</p>
              </GlassCard>
            ))}
          </div>

          <div className="p-4 bg-slate-800/50 border border-slate-600/30 rounded-lg">
            <p className="text-gray-300 text-sm text-center">
              Ces indications servent uniquement à contextualiser l'accès aux fonctionnalités.<br/>
              <span className="text-gray-400 text-xs">Elles ne constituent ni un classement, ni une distinction publique.</span>
            </p>
          </div>
        </div>

        {/* Transparency Section */}
        <GlassCard className="mb-12 bg-blue-900/10 border-blue-500/30">
          <h2 className="text-2xl font-bold text-white mb-4">Transparence totale</h2>
          <div className="space-y-3 text-gray-300">
            <p>
              <strong className="text-blue-300">Vous ne payez pas la donnée</strong>, vous payez le service :
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-sm">
              <li>Agrégation et mise à jour des sources publiques</li>
              <li>Calculs d'optimisation et d'analyse</li>
              <li>Infrastructure et hébergement sécurisé</li>
              <li>Support technique et maintenance</li>
              <li>Développement de nouvelles fonctionnalités</li>
            </ul>
            <div className="mt-6 p-4 bg-slate-800/50 rounded-lg">
              <p className="text-sm text-gray-300 font-semibold">
                ✓ Aucune marque • Aucun sponsor • Aucune donnée vendue • Résiliation en 1 clic
              </p>
            </div>
          </div>
        </GlassCard>

        {/* FAQ */}
        <div>
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Questions fréquentes</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <GlassCard>
              <h3 className="font-bold text-lg text-white mb-2">
                Pourquoi payer si les données sont publiques ?
              </h3>
              <p className="text-gray-300 text-sm">
                Les données brutes sont gratuites et le restent. Vous payez pour leur agrégation, 
                leur mise en forme accessible, leur maintenance et les outils d'analyse qui permettent 
                de les exploiter efficacement.
              </p>
            </GlassCard>

            <GlassCard>
              <h3 className="font-bold text-lg text-white mb-2">
                L'accès public est-il vraiment gratuit ?
              </h3>
              <p className="text-gray-300 text-sm">
                Oui, absolument. Le comparateur de prix, la consultation par territoire, l'historique 
                simple et les sources sont accessibles gratuitement à tous, sans publicité ni limitation temporelle.
              </p>
            </GlassCard>

            <GlassCard>
              <h3 className="font-bold text-lg text-white mb-2">
                Comment annuler mon abonnement ?
              </h3>
              <p className="text-gray-300 text-sm">
                En 1 clic depuis votre compte. Aucune justification requise. Aucune relance commerciale. 
                Votre accès reste actif jusqu'à la fin de la période payée.
              </p>
            </GlassCard>

            <GlassCard>
              <h3 className="font-bold text-lg text-white mb-2">
                Mes données personnelles sont-elles stockées ?
              </h3>
              <p className="text-gray-300 text-sm">
                Non. Tout est en local (localStorage/IndexedDB). Seuls email et plan d'abonnement 
                sont enregistrés pour la facturation. Aucun tracking utilisateur.
              </p>
            </GlassCard>

            <GlassCard>
              <h3 className="font-bold text-lg text-white mb-2">
                Quelle est la différence avec un service commercial ?
              </h3>
              <p className="text-gray-300 text-sm">
                Nous sommes un service civique numérique : pas de publicité, pas de revente de données, 
                pas de partenariats commerciaux. Les prix affichés sont neutres et vérifiables.
              </p>
            </GlassCard>

            <GlassCard>
              <h3 className="font-bold text-lg text-white mb-2">
                Comment sont vérifiées les données ?
              </h3>
              <p className="text-gray-300 text-sm">
                Toutes nos données proviennent de sources officielles (INSEE, OPMR, DGCCRF, data.gouv.fr). 
                La méthodologie est publique et auditable.
              </p>
            </GlassCard>
          </div>
        </div>
      </GlassContainer>
    </div>
  );
}
