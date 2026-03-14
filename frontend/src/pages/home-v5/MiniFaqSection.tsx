import { Link } from 'react-router-dom';

type MiniFaqSectionProps = {
  expandedFaq: number | null;
  onToggleFaq: (index: number) => void;
};

const FAQ_ITEMS = [
  {
    question: 'C\'est vraiment gratuit?',
    answer: 'L\'accès public est gratuit et sans publicité. Des fonctions avancées (scan illimité, alertes personnalisées) sont disponibles en option payante.'
  },
  {
    question: 'Que faites-vous de mes données?',
    answer: 'Vos recherches restent locales sur votre appareil. Si vous créez un compte, seul votre email est enregistré — aucune donnée personnelle n\'est revendue.'
  },
  {
    question: 'Comment garantir la fiabilité?',
    answer: 'Données INSEE, OPMR et DGCCRF — sources officielles certifiées Etalab 2.0, toutes datées et auditables.'
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
