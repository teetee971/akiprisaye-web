const HOW_IT_WORKS_STEPS = [
  {
    num: '1',
    emoji: '🔍',
    title: 'Cherchez ou scannez',
    text: 'Cherchez un produit par son nom, son code EAN, ou scannez directement un ticket de caisse.',
    imgUrl: 'https://images.unsplash.com/photo-1516594915697-87eb3b1c14ea?auto=format&fit=crop&w=600&q=80',
    imgAlt: 'Scanner un code-barres en supermarché',
  },
  {
    num: '2',
    emoji: '📊',
    title: 'Comparez instantanément',
    text: 'Nous agrégeons les prix de plusieurs enseignes et territoires pour vous donner une vue complète.',
    imgUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=600&q=80',
    imgAlt: 'Graphique de comparaison de prix',
  },
  {
    num: '3',
    emoji: '💰',
    title: 'Décidez et économisez',
    text: 'Choisissez où acheter au meilleur prix et économisez jusqu\'à 30 % sur votre panier mensuel.',
    imgUrl: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&w=600&q=80',
    imgAlt: 'Courses au supermarché, caddie plein',
  },
];

export default function HowItWorksSection() {
  return (
    <section className="how-it-works-v5 fade-in section-reveal">
      <h2 className="section-title slide-up">Simple et rapide</h2>
      <div className="steps-visual-grid">
        {HOW_IT_WORKS_STEPS.map((step) => (
          <div key={step.num} className="step-visual-card slide-up">
            <div className="step-visual-img-wrap">
              <img
                src={step.imgUrl}
                alt={step.imgAlt}
                className="step-visual-img"
                loading="lazy"
                width="300"
                height="140"
              />
              <div className="step-visual-img-overlay" />
              <span className="step-visual-num">{step.num}</span>
            </div>
            <div className="step-visual-body">
              <span className="step-visual-icon">{step.emoji}</span>
              <p className="step-visual-title">{step.title}</p>
              <p className="step-visual-text">{step.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
