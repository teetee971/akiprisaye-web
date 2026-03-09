/**
 * VideoVieChere — Section vidéo "La vie chère outre-mer expliquée"
 *
 * Affiche 2 vidéos emblématiques sur la problématique de la vie chère
 * dans les territoires ultramarins français :
 *   1. Analyse — L'ingénieur Iconoclaste : Vie Chère en Martinique (octroi de mer, héritage colonial)
 *   2. Décryptage — Séphora Dreams : Antilles françaises, comprendre la vie chère
 *
 * Implémentation "lite embed" :
 *   - Aucun script YouTube chargé tant que l'utilisateur ne clique pas
 *   - Poster image Unsplash affichée initialement (performance)
 *   - Intersection Observer : préchargement du composant uniquement
 *     quand la section est visible (pas de fetch au chargement initial)
 *
 * Crédits vidéo : YouTube — L'ingénieur Iconoclaste / Séphora Dreams
 * Crédits photos : Unsplash License
 */

import { useState, useRef, useEffect } from 'react';

interface VideoCard {
  id: string;             // YouTube video ID
  title: string;
  description: string;
  source: string;         // e.g. "France Outre-mer La 1ère"
  duration: string;       // e.g. "3 min 42"
  posterUrl: string;      // Unsplash fallback poster
  posterAlt: string;
  tag: string;            // e.g. "🎙️ Reportage"
}

const VIDEO_CARDS: VideoCard[] = [
  {
    id: '6lL4FwZrmgQ',
    title: 'Vie Chère en Martinique : Octroi de Mer, Chlordécone et Héritage Colonial',
    description:
      "Analyse des causes structurelles de la vie chère en Martinique : octroi de mer, " +
      "héritage colonial, monopoles de distribution et dépendance aux importations.",
    source: "L'ingénieur Iconoclaste",
    duration: '21 min',
    posterUrl:
      'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=700&q=80',
    posterAlt: 'Rayon supermarché avec étiquettes de prix',
    tag: '🎙️ Reportage',
  },
  {
    id: 'MoLHPFC6VGY',
    title: 'Antilles françaises : comprendre la vie chère — Békés, marges et octroi de mer',
    description:
      "Décryptage des mécanismes qui renchérissent les prix aux Antilles : Békés, marges " +
      "de distribution, octroi de mer et coûts de transport expliqués.",
    source: 'Séphora Dreams',
    duration: '18 min',
    posterUrl:
      'https://images.unsplash.com/photo-1607082348351-cef5cd02c7b0?auto=format&fit=crop&w=700&q=80',
    posterAlt: "Graphiques d'analyse de prix et données statistiques",
    tag: '📈 Analyse',
  },
];

function LiteYouTubeEmbed({ videoId, posterUrl, posterAlt, title }: {
  videoId: string;
  posterUrl: string;
  posterAlt: string;
  title: string;
}) {
  const [playing, setPlaying] = useState(false);

  const src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;

  return (
    <div className="video-embed-wrap" aria-label={`Vidéo : ${title}`}>
      {playing ? (
        <iframe
          className="video-embed-iframe"
          src={src}
          title={title}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      ) : (
        <button
          className="video-embed-poster"
          onClick={() => setPlaying(true)}
          aria-label={`Lire la vidéo : ${title}`}
        >
          <img
            src={posterUrl}
            alt={posterAlt}
            className="video-embed-poster-img"
            loading="lazy"
            width="700"
            height="394"
          />
          <div className="video-embed-overlay" aria-hidden="true" />
          <div className="video-embed-play" aria-hidden="true">
            <svg viewBox="0 0 68 48" width="68" height="48" aria-hidden="true">
              <path
                d="M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.13 34 0 34 0S12.21.13 6.9 1.55c-2.93.78-4.63 3.26-5.42 6.19C.06 13.05 0 24 0 24s.06 10.95 1.48 16.26c.78 2.93 2.49 5.41 5.42 6.19C12.21 47.87 34 48 34 48s21.79-.13 27.1-1.55c2.93-.78 4.64-3.26 5.42-6.19C67.94 34.95 68 24 68 24s-.06-10.95-1.48-16.26z"
                fill="#f00"
              />
              <path d="M45 24 27 14v20" fill="#fff" />
            </svg>
          </div>
          <div className="video-embed-yt-badge" aria-hidden="true">
            <svg viewBox="0 0 90 20" width="68" height="15" aria-hidden="true">
              <text x="0" y="15" fontSize="13" fill="#fff" fontFamily="Arial, sans-serif">
                YouTube
              </text>
            </svg>
          </div>
        </button>
      )}
    </div>
  );
}

export default function VideoVieChere() {
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="video-vie-chere-section section-reveal"
      aria-labelledby="video-viechere-heading"
    >
      <div className="video-viechere-header">
        <span className="video-viechere-eyebrow fade-in">🎬 Contexte</span>
        <h2 id="video-viechere-heading" className="section-title slide-up">
          La vie chère outre-mer en vidéo
        </h2>
        <p className="video-viechere-sub slide-up">
          Reportages et analyses pour comprendre pourquoi les prix sont systématiquement
          plus élevés dans les territoires ultramarins français.
        </p>
      </div>

      <div className="video-viechere-grid fade-in">
        {VIDEO_CARDS.map((card) => (
          <article key={card.id} className="video-card">
            <div className="video-card-tag">{card.tag}</div>
            {visible && (
              <LiteYouTubeEmbed
                videoId={card.id}
                posterUrl={card.posterUrl}
                posterAlt={card.posterAlt}
                title={card.title}
              />
            )}
            {!visible && (
              <div className="video-embed-skeleton" aria-hidden="true" />
            )}
            <div className="video-card-body">
              <h3 className="video-card-title">{card.title}</h3>
              <p className="video-card-desc">{card.description}</p>
              <div className="video-card-meta">
                <span className="video-card-source">{card.source}</span>
                <span className="video-card-duration">⏱ {card.duration}</span>
              </div>
            </div>
          </article>
        ))}
      </div>

      <p className="video-viechere-disclaimer">
        Les vidéos sont hébergées sur YouTube. Leur lecture envoie des données à Google.
        Aucun cookie de suivi n'est chargé avant que vous cliquiez sur lecture
        (domaine <em>youtube-nocookie.com</em>).
      </p>
    </section>
  );
}
