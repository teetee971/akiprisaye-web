import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GlassContainer } from '@/components/ui/GlassContainer';
import { GlassCard } from '@/components/ui/glass-card';
import { CivicButton } from '@/components/ui/CivicButton';
import { DataBadge } from '@/components/ui/DataBadge';
import GratificationDisplay from '@/components/GratificationDisplay';

const accessLevels = [
  {
    id: 'PUBLIC',
    title: '📖 Gratuit',
    price: '0 €',
    subtitle: 'Accès libre aux comparaisons',
    features: ['Scan EAN illimité', 'Comparaisons basiques', 'Lecture seule', 'Sans publicité'],
    note: 'Inscription optionnelle pour alertes, panier et historique.',
  },
  {
    id: 'CITIZEN',
    title: '🧑 Citoyen',
    price: '3,99 € / mois',
    subtitle: 'Outil citoyen complet',
    features: [
      'Scan EAN illimité',
      'OCR ingrédients (texte brut)',
      'Fiche produit enrichie',
      'Alertes prix locales',
      'Historique personnel',
      'Signalement citoyen',
    ],
    note: "Valeur immédiate. Le scan n'est jamais bloqué.",
  },
  {
    id: 'PROFESSIONAL',
    title: '🧑‍💼 Professionnel',
    price: '19 € / mois',
    subtitle: 'Outil de travail',
    features: [
      'Comparaisons temporelles multi-marques',
      'Historique long (12-36 mois)',
      'Export CSV / JSON',
      'Agrégation territoriale',
      'Recherche EAN + historique',
    ],
    note: "Pour artisans, associations, journalistes. Outil d'observation, pas de conseil.",
  },
  {
    id: 'INSTITUTIONAL',
    title: '🏛️ Institution',
    price: 'Sur devis',
    subtitle: 'Licence annuelle',
    features: [
      'Données publiques agrégées',
      'Auditabilité complète',
      'Accès open-data structuré',
      'Comparaisons territoriales/internationales',
      'Observatoire officiel',
    ],
    note: 'Conforme INSEE / Eurostat / collectivités. Clause de non-interprétation politique.',
  },
];

export default function PricingDetailed() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-8">
      <GlassContainer className="max-w-7xl mx-auto p-8">
        {/* Hero - Positionnement */}
        <div className="mb-12 p-8 bg-blue-900/20 border border-blue-500/30 rounded-xl text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Niveaux d'accès au service
          </h1>
          <div className="space-y-4 text-gray-200 text-lg max-w-3xl mx-auto">
            <p>
              <strong className="text-blue-300">A KI PRI SA YÉ</strong> — Observatoire citoyen des
              prix et du coût de la vie
            </p>
            <p className="text-xl font-semibold text-green-300">DOM · ROM · COM</p>
          </div>
        </div>

        {/* Pourquoi un abonnement? - Section d'explication */}
        <div className="mb-12 p-8 bg-green-900/20 border border-green-500/30 rounded-xl">
          <h2 className="text-2xl font-bold text-white mb-4 text-center">
            Pourquoi un abonnement ?
          </h2>
          <p className="text-gray-200 text-base max-w-3xl mx-auto text-center leading-relaxed">
            A KI PRI SA YÉ est un outil citoyen, indépendant et sans publicité. L'abonnement permet
            de maintenir des données fiables, auditées, mises à jour, sans revente ni influence
            commerciale.
          </p>
          <div className="mt-6 flex justify-center gap-4 flex-wrap">
            <span className="px-4 py-2 bg-red-900/30 border border-red-500/30 rounded-lg text-red-200 text-sm">
              ❌ Pas de publicité
            </span>
            <span className="px-4 py-2 bg-red-900/30 border border-red-500/30 rounded-lg text-red-200 text-sm">
              ❌ Pas de vente de données
            </span>
            <span className="px-4 py-2 bg-green-900/30 border border-green-500/30 rounded-lg text-green-200 text-sm">
              ✅ Accès libre aux comparaisons
            </span>
            <span className="px-4 py-2 bg-green-900/30 border border-green-500/30 rounded-lg text-green-200 text-sm">
              ✅ Transparence totale
            </span>
          </div>
        </div>

        {/* Access Levels Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12">
          {accessLevels.map((level) => (
            <GlassCard key={level.id} className="flex flex-col">
              <div className="flex-1 space-y-4">
                {/* Header */}
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">{level.title}</h2>
                  <p className="text-sm text-gray-400 italic">{level.subtitle}</p>
                </div>

                {/* Price */}
                <div>
                  <p className="text-2xl font-bold text-blue-400">{level.price}</p>
                </div>

                {/* Features */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Inclus
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

                {/* Note */}
                {level.note && (
                  <div className="p-3 bg-blue-900/20 border border-blue-600/30 rounded-lg">
                    <p className="text-xs text-blue-200">{level.note}</p>
                  </div>
                )}

                {/* Data Badge */}
                <div className="pt-2">
                  <DataBadge source="INSEE • OPMR • DGCCRF • data.gouv.fr" />
                </div>
              </div>

              {/* CTA */}
              <div className="mt-6">
                <CivicButton
                  variant="primary"
                  className="w-full"
                  onClick={() => {
                    if (level.id === 'INSTITUTIONAL') {
                      navigate('/contact?subject=licence-institutionnelle');
                    } else {
                      navigate(`/subscribe?level=${level.id}`);
                    }
                  }}
                >
                  {level.id === 'INSTITUTIONAL' ? 'Demander une convention' : 'Choisir cet accès'}
                </CivicButton>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Gratification System - Visual with Counters */}
        <div className="mb-12">
          <GratificationDisplay accessLevel="CITIZEN" showStats={true} />
        </div>

        {/* FAQ - Limited to 5 */}
        <div>
          <h2 className="text-3xl font-bold text-white mb-8 text-center">FAQ Abonnements</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <GlassCard>
              <h3 className="font-bold text-lg text-white mb-2">
                Quand l'inscription est-elle nécessaire ?
              </h3>
              <p className="text-gray-300 text-sm">
                L'inscription est nécessaire pour les alertes prix, le panier et l'historique. Les
                comparaisons et recherches restent accessibles librement.
              </p>
            </GlassCard>

            <GlassCard>
              <h3 className="font-bold text-lg text-white mb-2">
                Mes données personnelles sont-elles exploitées ?
              </h3>
              <p className="text-gray-300 text-sm">
                Non. Aucune donnée n'est revendue, utilisée à des fins publicitaires ou
                commerciales.
              </p>
            </GlassCard>

            <GlassCard>
              <h3 className="font-bold text-lg text-white mb-2">
                Puis-je accéder gratuitement aux données ?
              </h3>
              <p className="text-gray-300 text-sm">
                Oui. L'inscription est gratuite et permet l'accès aux données publiques.
              </p>
            </GlassCard>

            <GlassCard>
              <h3 className="font-bold text-lg text-white mb-2">
                Pourquoi certains accès sont payants ?
              </h3>
              <p className="text-gray-300 text-sm">
                Les contributions financent l'infrastructure, la maintenance et l'ouverture des
                données à long terme.
              </p>
            </GlassCard>

            <GlassCard className="md:col-span-2">
              <h3 className="font-bold text-lg text-white mb-2">
                Les institutions ont-elles accès à des données différentes ?
              </h3>
              <p className="text-gray-300 text-sm">
                Non. Les données sont identiques. Les licences donnent accès à des formats, outils
                et exports supplémentaires, jamais à des données exclusives.
              </p>
            </GlassCard>
          </div>
        </div>
      </GlassContainer>
    </div>
  );
}
