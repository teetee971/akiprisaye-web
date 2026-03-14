const HOW_IT_WORKS_STEPS = [
  {
    num: '1',
    emoji: '🔍',
    title: 'Cherchez ou scannez',
    text: 'Cherchez un produit par son nom, son code-barre (EAN), ou scannez directement un ticket de caisse.',
    imgUrl: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=600&q=80',
    imgAlt: 'Personne qui scanne un code-barres avec son téléphone dans un supermarché des Antilles',
  },
  {
    num: '2',
    emoji: '📊',
    title: 'Comparez instantanément',
    text: 'Nous agrégeons les prix de plusieurs enseignes et territoires pour vous donner une vue complète.',
    imgUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80',
    imgAlt: 'Graphique de comparaison de prix sur écran — données observatoire',
  },
  {
    num: '3',
    emoji: '💰',
    title: 'Décidez et économisez',
    text: 'Choisissez où acheter au meilleur prix et économisez jusqu\'à 30 % sur votre panier mensuel.',
    imgUrl: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&w=600&q=80',
    imgAlt: 'Caddie de courses plein dans un supermarché — économies réalisées',
  },
  {
    num: '4',
    emoji: '🚨',
    title: 'Signalez un abus',
    text: 'Vous constatez une hausse anormale ? Signalez-la en 10 secondes. Votre contribution enrichit l\'observatoire.',
    imgUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=600&q=80',
    imgAlt: 'Citoyen signalant une anomalie de prix avec son téléphone',
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
