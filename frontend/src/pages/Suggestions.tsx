import React from 'react';
import { Lightbulb, Bug, HelpCircle, Database, Sparkles } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import TicketForm from '../components/TicketForm';
import type { TicketType } from '../types/ticket';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';

/**
 * Page de soumission de suggestions et demandes
 *
 * Permet aux utilisateurs de:
 * - Soumettre des suggestions d'amélioration
 * - Signaler des bugs
 * - Demander de nouvelles fonctionnalités
 * - Poser des questions
 * - Signaler des erreurs de données
 */
export default function Suggestions() {
  const location = useLocation();
  const [selectedType, setSelectedType] = React.useState<TicketType | null>(null);

  const ticketTypes = [
    {
      type: 'suggestion' as TicketType,
      icon: Lightbulb,
      title: 'Suggestion',
      description: 'Proposez une amélioration',
      color: 'yellow',
    },
    {
      type: 'feature_request' as TicketType,
      icon: Sparkles,
      title: 'Nouvelle fonctionnalité',
      description: 'Demandez une nouvelle feature',
      color: 'purple',
    },
    {
      type: 'bug_report' as TicketType,
      icon: Bug,
      title: 'Problème technique',
      description: 'Signalez un bug',
      color: 'red',
    },
    {
      type: 'data_quality' as TicketType,
      icon: Database,
      title: 'Erreur de données',
      description: 'Signalez une donnée incorrecte',
      color: 'orange',
    },
    {
      type: 'question' as TicketType,
      icon: HelpCircle,
      title: 'Question',
      description: 'Posez une question',
      color: 'blue',
    },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      yellow: 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30 hover:border-yellow-500/50',
      purple: 'from-purple-500/20 to-purple-600/20 border-purple-500/30 hover:border-purple-500/50',
      red: 'from-red-500/20 to-red-600/20 border-red-500/30 hover:border-red-500/50',
      orange: 'from-orange-500/20 to-orange-600/20 border-orange-500/30 hover:border-orange-500/50',
      blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/30 hover:border-blue-500/50',
    };
    return colors[color] || colors.blue;
  };

  const getIconColor = (color: string) => {
    const colors: Record<string, string> = {
      yellow: 'text-yellow-400',
      purple: 'text-purple-400',
      red: 'text-red-400',
      orange: 'text-orange-400',
      blue: 'text-blue-400',
    };
    return colors[color] || colors.blue;
  };

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const requestedType = params.get('type');
    const allowedTypes: TicketType[] = [
      'suggestion',
      'feature_request',
      'bug_report',
      'data_quality',
      'question',
    ];
    if (requestedType && allowedTypes.includes(requestedType as TicketType)) {
      setSelectedType(requestedType as TicketType);
    }
  }, [location.search]);

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="px-4 pt-4 max-w-7xl mx-auto">
        <HeroImage
          src={PAGE_HERO_IMAGES.suggestions}
          alt="Suggestions"
          gradient="from-slate-950 to-yellow-900"
          height="h-40 sm:h-52"
        >
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>
            💡 Suggestions
          </h1>
          <p
            style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)' }}
          >
            Proposez vos idées pour améliorer la plateforme
          </p>
        </HeroImage>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="space-y-6">
          {!selectedType ? (
            <>
              {/* Introduction */}
              <section className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-5">
                <h2 className="text-lg font-semibold text-gray-100 mb-3">
                  Comment pouvons-nous vous aider ?
                </h2>
                <p className="text-sm text-gray-400 mb-4">
                  Sélectionnez le type de demande qui correspond le mieux à votre besoin. Toutes les
                  demandes sont suivies et traitées dans les meilleurs délais.
                </p>
              </section>

              {/* Type selection cards */}
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {ticketTypes.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.type}
                      onClick={() => setSelectedType(item.type)}
                      className={`
                        flex flex-col items-start p-6 rounded-xl border
                        bg-gradient-to-br ${getColorClasses(item.color)}
                        transition-all duration-200 hover:scale-105
                        focus:outline-none focus:ring-2 focus:ring-blue-500
                      `}
                    >
                      <Icon className={`w-10 h-10 ${getIconColor(item.color)} mb-4`} />
                      <h3 className="text-lg font-semibold text-gray-100 mb-2">{item.title}</h3>
                      <p className="text-sm text-gray-400 text-left">{item.description}</p>
                    </button>
                  );
                })}
              </section>

              {/* Benefits */}
              <section className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-5">
                <h3 className="text-base font-semibold text-blue-300 mb-3">
                  Pourquoi soumettre une demande ?
                </h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">✓</span>
                    <span>Vos suggestions façonnent l'évolution de la plateforme</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">✓</span>
                    <span>Suivi transparent avec numéro de ticket</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">✓</span>
                    <span>Réponse et traitement garantis</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">✓</span>
                    <span>Confidentialité respectée (RGPD)</span>
                  </li>
                </ul>
              </section>
            </>
          ) : (
            <>
              {/* Back button */}
              <button
                onClick={() => setSelectedType(null)}
                className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-2"
              >
                ← Retour au choix du type
              </button>

              {/* Ticket form */}
              <section className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-5">
                <h2 className="text-lg font-semibold text-gray-100 mb-4">Nouvelle demande</h2>
                <TicketForm
                  defaultType={selectedType}
                  onSuccess={(ticketNumber) => {
                    // Rediriger vers la page de suivi après succès
                    setTimeout(() => {
                      setSelectedType(null);
                    }, 3000);
                  }}
                  onCancel={() => setSelectedType(null)}
                />
              </section>
            </>
          )}

          {/* FAQ / Info section */}
          <section className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-700/50 p-5">
            <h3 className="text-base font-semibold text-gray-100 mb-3">Questions fréquentes</h3>
            <div className="space-y-3 text-sm text-gray-400">
              <details className="group">
                <summary className="cursor-pointer text-gray-300 hover:text-gray-100 font-medium">
                  Combien de temps pour une réponse ?
                </summary>
                <p className="mt-2 pl-4 text-gray-400">
                  Nous traitons toutes les demandes sous 48-72h ouvrées. Les demandes urgentes (bugs
                  critiques) sont prioritaires.
                </p>
              </details>

              <details className="group">
                <summary className="cursor-pointer text-gray-300 hover:text-gray-100 font-medium">
                  Puis-je suivre ma demande ?
                </summary>
                <p className="mt-2 pl-4 text-gray-400">
                  Oui ! Notez votre numéro de ticket et accédez à la section "Mes demandes" pour
                  suivre l'avancement.
                </p>
              </details>

              <details className="group">
                <summary className="cursor-pointer text-gray-300 hover:text-gray-100 font-medium">
                  L'email est-il obligatoire ?
                </summary>
                <p className="mt-2 pl-4 text-gray-400">
                  Non, l'email est optionnel. Il permet uniquement de vous notifier de l'avancement
                  de votre demande. Nous respectons le RGPD.
                </p>
              </details>

              <details className="group">
                <summary className="cursor-pointer text-gray-300 hover:text-gray-100 font-medium">
                  Que faire en cas de bug critique ?
                </summary>
                <p className="mt-2 pl-4 text-gray-400">
                  Utilisez le type "Problème technique" et décrivez précisément le problème, les
                  étapes pour le reproduire, et votre navigateur/appareil.
                </p>
              </details>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
