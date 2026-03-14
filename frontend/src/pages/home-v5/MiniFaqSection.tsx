import { Link } from 'react-router-dom';
import { getFeaturedFAQ } from '../../data/faq';

type MiniFaqSectionProps = {
  expandedFaq: number | null;
  onToggleFaq: (index: number) => void;
};

const FAQ_ITEMS = getFeaturedFAQ();

export default function MiniFaqSection({ expandedFaq, onToggleFaq }: MiniFaqSectionProps) {
  return (
    <section className="mini-faq fade-in section-reveal">
      <h3 className="section-title-small slide-up">Questions fréquentes</h3>
      <div className="faq-list">
        {FAQ_ITEMS.map((faq, index) => (
          <div key={faq.id} className="faq-item slide-up">
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
