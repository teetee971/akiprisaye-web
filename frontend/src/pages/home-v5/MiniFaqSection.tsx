import { Link } from 'react-router-dom';

type MiniFaqSectionProps = {
  expandedFaq: number | null;
  onToggleFaq: (index: number) => void;
};

const FAQ_ITEMS = [
  {
    question: 'C\'est vraiment gratuit?',
    answer: 'Oui, 100% gratuit et sans publicité'
  },
  {
    question: 'Que faites-vous de mes données?',
    answer: 'Aucune collecte. Données anonymes uniquement.'
  },
  {
    question: 'Comment garantir la fiabilité?',
    answer: 'Sources publiques vérifiables (Etalab 2.0)'
  }
];

export default function MiniFaqSection({ expandedFaq, onToggleFaq }: MiniFaqSectionProps) {
  return (
    <section className="mini-faq fade-in section-reveal">
      <h3 className="section-title-small slide-up">Questions fréquentes</h3>
      <div className="faq-list">
        {FAQ_ITEMS.map((faq, index) => (
          <div key={faq.question} className="faq-item slide-up">
            <button
              className="faq-question"
              onClick={() => onToggleFaq(index)}
              aria-expanded={expandedFaq === index}
            >
              <span className="faq-icon">❓</span>
              <span className="faq-question-text">{faq.question}</span>
              <span className="faq-toggle">{expandedFaq === index ? '−' : '+'}</span>
            </button>
            {expandedFaq === index && (
              <div className="faq-answer faq-open">
                <span className="faq-check">✓</span>
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="faq-cta slide-up">
        <Link to="/faq" className="btn-faq">
          Toutes les questions
        </Link>
      </div>
    </section>
  );
}
