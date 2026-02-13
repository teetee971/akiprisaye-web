const HOW_IT_WORKS_STEPS = [
  { emoji: '1️⃣', text: 'Cherchez un produit ou scannez un ticket' },
  { emoji: '2️⃣', text: 'Nous comparons les prix pour vous' },
  { emoji: '3️⃣', text: 'Vous décidez où acheter au meilleur prix' }
];

export default function HowItWorksSection() {
  return (
    <section className="how-it-works-v5 fade-in section-reveal">
      <h2 className="section-title slide-up">Simple et rapide</h2>
      <ul className="steps-list-v5">
        {HOW_IT_WORKS_STEPS.map((step) => (
          <li key={step.text} className="step-item-v5 slide-up">
            <span className="step-emoji">{step.emoji}</span>
            <span className="step-text">{step.text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
