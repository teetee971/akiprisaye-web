/**
 * CommerceSocial — Partagez vos listes et recommandations
 * Route : /commerce-social
 */

import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Share2, MessageCircle, Users, Star, ShoppingCart, Lock } from 'lucide-react';
import { HeroImage } from '../components/ui/HeroImage';
import { PAGE_HERO_IMAGES } from '../config/imageAssets';

const FEATURES = [
  {
    icon: Share2,
    title: 'Partage de listes',
    desc: 'Partagez votre liste de courses avec votre famille ou vos amis en un lien.',
    available: false,
  },
  {
    icon: Star,
    title: 'Recommandations produits',
    desc: 'Notez et recommandez des produits à votre réseau citoyen.',
    available: false,
  },
  {
    icon: MessageCircle,
    title: 'Messagerie citoyenne',
    desc: 'Discutez directement avec d\'autres utilisateurs via la messagerie intégrée.',
    available: true,
    route: '/messagerie',
  },
  {
    icon: Users,
    title: 'Groupes de parole',
    desc: 'Rejoignez ou créez des groupes thématiques par territoire ou catégorie.',
    available: true,
    route: '/groupes-parole',
  },
  {
    icon: ShoppingCart,
    title: 'Listes collaboratives',
    desc: 'Créez des listes partagées modifiables par plusieurs personnes.',
    available: false,
  },
];

export default function CommerceSocial() {
  return (
    <>
      <Helmet>
        <title>Commerce social — A KI PRI SA YÉ</title>
        <meta
          name="description"
          content="Partagez vos listes de courses et recommandations avec votre réseau — A KI PRI SA YÉ"
        />
        <link rel="canonical" href="https://teetee971.github.io/akiprisaye-web/commerce-social" />
      </Helmet>

      <div className="min-h-screen bg-gray-50">
        <div className="px-4 pt-4 max-w-3xl mx-auto">
          <HeroImage
            src={PAGE_HERO_IMAGES.commerceSocial}
            alt="Commerce social entre citoyens"
            gradient="from-slate-950 to-pink-900"
            height="h-40 sm:h-52"
          >
            <div className="flex items-center gap-2 mb-1">
              <Share2 className="w-5 h-5 text-pink-300 drop-shadow" />
              <span className="text-xs font-semibold uppercase tracking-widest text-pink-300">
                Commerce social
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white drop-shadow">
              🤝 Commerce social
            </h1>
            <p className="text-pink-100 text-sm mt-1 drop-shadow">
              Partagez listes, recommandations et bons plans avec votre réseau
            </p>
          </HeroImage>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-6 pb-12 space-y-6">

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc, available, route }) => (
              <div
                key={title}
                className={`bg-white border rounded-xl p-5 ${available ? 'border-gray-200' : 'border-dashed border-gray-300 opacity-70'}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg flex-shrink-0 ${available ? 'bg-pink-50' : 'bg-gray-50'}`}>
                    <Icon className={`w-5 h-5 ${available ? 'text-pink-600' : 'text-gray-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900 text-sm">{title}</p>
                      {available ? (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                          Disponible
                        </span>
                      ) : (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                          <Lock className="w-3 h-3" /> V3
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{desc}</p>
                    {available && route && (
                      <Link
                        to={route}
                        className="text-xs text-pink-600 hover:text-pink-800 font-medium mt-2 inline-block"
                      >
                        Accéder →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-pink-50 border border-pink-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-pink-800 mb-1">🚀 Fonctionnalités à venir en V3</p>
            <p className="text-sm text-pink-700">
              Le partage de listes collaboratives, les recommandations produits entre citoyens
              et les profils publics sont prévus dans la prochaine phase de développement.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
