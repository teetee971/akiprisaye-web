import PropTypes from 'prop-types';
import { categoryConfigs } from '../types/news';

/**
 * CivicNewsCard - Professional civic news card with glassmorphism design
 * Displays verified news with mandatory source attribution
 */
export default function CivicNewsCard({
  title,
  summary,
  category,
  territory,
  publishedAt,
  sourceName,
  sourceUrl,
  sourceLogo
}) {
  const config = categoryConfigs[category];

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <article
      className="relative bg-white/[0.05] backdrop-blur-[14px] border border-white/[0.12] rounded-xl overflow-hidden hover:bg-white/[0.08] hover:border-white/[0.18] transition-all duration-300 shadow-lg hover:shadow-xl"
    >
      {/* Category Badge */}
      <div className="flex items-center gap-3 p-4 pb-3">
        <span
          className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-md ${config.bgColor} ${config.borderColor} ${config.color} border uppercase tracking-wide`}
        >
          {config.label}
        </span>
        <span className="text-gray-500 text-sm">|</span>
        <span className="text-gray-300 text-sm font-medium">{territory}</span>
      </div>

      {/* Content */}
      <div className="px-4 pb-4">
        <h3 className="text-xl font-bold text-white mb-3 leading-snug">
          {title}
        </h3>
        <p className="text-gray-300 text-base leading-relaxed mb-4">
          {summary}
        </p>

        {/* Divider */}
        <div className="border-t border-white/[0.12] my-4"></div>

        {/* Source Information */}
        <div className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-gray-500 text-xs font-semibold uppercase tracking-wide min-w-[60px]">Source</span>
              <span className="text-blue-400 font-semibold text-sm">{sourceName}</span>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-gray-500 text-xs font-semibold uppercase tracking-wide min-w-[60px]">Date</span>
              <time dateTime={publishedAt} className="text-gray-300 text-sm">{formatDate(publishedAt)}</time>
            </div>
          </div>

          {/* Source Link */}
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 hover:border-blue-500/60 rounded-lg transition-all duration-200"
          >
            <span>Consulter la source officielle</span>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </a>
        </div>
      </div>

      {/* Civic Disclaimer */}
      <div className="bg-blue-500/5 border-t border-blue-500/20 px-4 py-3">
        <p className="text-xs text-gray-400 leading-relaxed">
          <span className="font-semibold text-blue-400">Information officielle:</span> Cette actualité provient d&apos;une source publique vérifiable.
          A KI PRI SA YÉ ne modifie pas les données et n&apos;effectue aucune interprétation commerciale.
        </p>
      </div>
    </article>
  );
}

CivicNewsCard.propTypes = {
  title: PropTypes.string.isRequired,
  summary: PropTypes.string.isRequired,
  category: PropTypes.oneOf(['PRIX', 'POLITIQUE', 'ALERTE', 'INNOVATION']).isRequired,
  territory: PropTypes.string.isRequired,
  publishedAt: PropTypes.string.isRequired,
  sourceName: PropTypes.string.isRequired,
  sourceUrl: PropTypes.string.isRequired,
  sourceLogo: PropTypes.string
};
