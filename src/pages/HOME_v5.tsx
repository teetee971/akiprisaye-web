/**
 * Home Page v5 - Optimized Structure for Conversion
 * 
 * Complete redesign focused on:
 * - Mobile-first design (80%+ traffic)
 * - Conversion optimization
 * - Social proof immediately visible
 * - Clear user journey
 * - Global territory coverage
 * 
 * Structure (9 sections):
 * 1. Hero Compact (70vh) with global coverage messaging
 * 2. Proof Bar (stats + credibility)
 * 3. Benefits (concrete value proposition)
 * 4. Example Comparison (NEW - real data)
 * 5. Territories Covered (compact)
 * 6. How It Works (simplified)
 * 7. Observatory Credibility (enhanced)
 * 8. Mini FAQ (NEW - accordion)
 * 9. Footer Minimal
 */

import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { getComparisonOfDay, type PriceComparison } from '../data/exampleComparisons';
import '../styles/home-v5.css';
import { safeLocalStorage } from '../utils/safeLocalStorage';

export default function HomeV5() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    scans: 1200,
    products: 5000,
    territories: 12
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const [showMobileCTA, setShowMobileCTA] = useState(false);
  const [displayStats, setDisplayStats] = useState({ scans: 0, products: 0, territories: 0 });
  const [exampleComparison] = useState<PriceComparison>(getComparisonOfDay());
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  
  const statsRef = useRef(null);
  const isStatsInView = useInView(statsRef, { once: true });
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  useEffect(() => {
    // Load real stats from safeLocalStorage
    const savedStats = safeLocalStorage.getItem('platform_stats');
    if (savedStats) {
      setStats(JSON.parse(savedStats));
    }

    // Update cached dimensions on resize
    const handleResize = () => {
      windowHeight = window.innerHeight;
      windowWidth = window.innerWidth;
    };

    // Cache window dimensions
    let windowHeight = window.innerHeight;
    let windowWidth = window.innerWidth;
    let ticking = false;

    // Throttled scroll handler
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (window.scrollY > 100) {
            setShowScrollIndicator(false);
          }
          
          // Show mobile sticky CTA after scrolling past hero
          if (windowWidth <= 768) {
            setShowMobileCTA(window.scrollY > windowHeight * 0.6);
          }
          
          ticking = false;
        });
        
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Animated counter effect with RAF
  useEffect(() => {
    if (isStatsInView && (stats.scans > 0 || stats.products > 0)) {
      const duration = 2000; // 2 seconds
      const startTime = performance.now();
      
      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        
        setDisplayStats({
          scans: Math.floor(stats.scans * easeOutQuart),
          products: Math.floor(stats.products * easeOutQuart),
          territories: Math.floor(stats.territories * easeOutQuart)
        });
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setDisplayStats(stats);
        }
      };
      
      requestAnimationFrame(animate);
    }
  }, [isStatsInView, stats]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/comparateur?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const getTerritoryTitle = () => {
    return 'Comparer les prix dans les territoires ultramarins';
  };

  return (
    <div className="home-v5">
      {/* Skip to main content for accessibility */}
      <a href="#main-content" className="skip-link">
        Aller au contenu principal
      </a>
      
      {/* 🏆 SECTION 1: HERO COMPACT with global coverage (70vh) */}
      <section className="hero-v5" ref={heroRef}>
        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="hero-content"
        >
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="hero-title"
          >
            {getTerritoryTitle()}
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="hero-subtitle"
          >
            Données publiques • Sans publicité • Indépendant
          </motion.p>
          
          {/* Quick Search XXL - Dominant CTA */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            onSubmit={handleSearch}
            className="hero-search-xxl"
          >
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="hero-search-input-xxl"
              aria-label="Rechercher un produit"
            />
            <button type="submit" className="hero-search-btn-xxl" aria-label="Rechercher">
              🔍
            </button>
          </motion.form>
          
          {/* Secondary CTA - Scanner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="hero-secondary-cta"
          >
            <Link to="/scan" className="cta-link-secondary">
              ou scanner un ticket
            </Link>
          </motion.div>
        </motion.div>
        
        {/* Scroll Indicator */}
        {showScrollIndicator && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="scroll-indicator"
            onClick={() => window.scrollTo({ top: window.innerHeight * 0.7, behavior: 'smooth' })}
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="scroll-arrow"
            >
              ↓
            </motion.div>
            <span className="scroll-text">Découvrir</span>
          </motion.div>
        )}
      </section>

      <main id="main-content">

      {/* 🗺️ SECTION 2: TERRITOIRES */}
      <section className="territories-section">
        <div className="territories-header">
          <h2>Territoires</h2>
          <p>Choisissez votre territoire pour accéder au hub local.</p>
        </div>
        <div className="territories-grid">
          <Link className="territory-card" to="/guadeloupe">
            Guadeloupe
          </Link>
          <Link className="territory-card" to="/martinique">
            Martinique
          </Link>
          <Link className="territory-card" to="/guyane">
            Guyane
          </Link>
          <Link className="territory-card" to="/reunion">
            La Réunion
          </Link>
          <Link className="territory-card" to="/mayotte">
            Mayotte
          </Link>
        </div>
      </section>

      {/* 📊 SECTION 3: PROOF BAR - Immediate credibility */}
      <section className="proof-bar">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="proof-content"
        >
          <div className="proof-item">
            <span className="proof-icon">📊</span>
            <span className="proof-text"><strong>{stats.territories}</strong> territoires</span>
          </div>
          <div className="proof-divider">|</div>
          <div className="proof-item">
            <span className="proof-icon">🛒</span>
            <span className="proof-text"><strong>{stats.products.toLocaleString()}+</strong> produits</span>
          </div>
          <div className="proof-divider">|</div>
          <div className="proof-item">
            <span className="proof-icon">🧾</span>
            <span className="proof-text"><strong>{stats.scans.toLocaleString()}+</strong> scans</span>
          </div>
          <div className="proof-divider">|</div>
          <div className="proof-item">
            <span className="proof-icon">🏛️</span>
            <span className="proof-text">Observatoire indépendant</span>
          </div>
        </motion.div>
      </section>

      {/* ✓ SECTION 3: BENEFITS - Concrete value proposition */}
      <section className="benefits">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="section-title"
        >
          Ce que vous gagnez
        </motion.h2>
        <div className="benefits-grid">
          {[
            'Comparez les prix AVANT d\'acheter',
            'Économisez jusqu\'à 30% sur vos courses',
            'Détectez les hausses anormales de prix',
            'Exportez les données pour vos analyses'
          ].map((benefit, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="benefit-item"
            >
              <span className="benefit-check">✓</span>
              <span className="benefit-text">{benefit}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 💰 SECTION 4: EXAMPLE COMPARISON - Real data showcase (NEW) */}
      <section className="example-comparison">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="section-title"
        >
          Exemple de comparaison
        </motion.h2>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="comparison-card"
        >
          <div className="comparison-col">
            <div className="comparison-header">
              <span className="comparison-flag">{exampleComparison.territoryFlag}</span>
              <h3 className="comparison-territory">{exampleComparison.territory}</h3>
            </div>
            <p className="comparison-product">{exampleComparison.product}</p>
            <p className="comparison-price">{exampleComparison.territoryPrice.toFixed(2)} €</p>
            <p className="comparison-delta">+{exampleComparison.deltaPercent}% plus cher</p>
          </div>
          <div className="comparison-divider">
            <span className="comparison-vs">VS</span>
          </div>
          <div className="comparison-col">
            <div className="comparison-header">
              <span className="comparison-flag">🇫🇷</span>
              <h3 className="comparison-territory">Métropole</h3>
            </div>
            <p className="comparison-product">{exampleComparison.product}</p>
            <p className="comparison-price">{exampleComparison.metropolePrice.toFixed(2)} €</p>
            <p className="comparison-reference">Prix de référence</p>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="comparison-cta"
        >
          <Link to="/comparateur" className="btn-comparison">
            Voir plus de comparaisons
          </Link>
        </motion.div>
      </section>

      {/* 🌍 SECTION 5: TERRITORIES - Compact version */}
      <section className="territories-v5">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="section-title"
        >
          12 territoires couverts
        </motion.h2>
        <div className="territories-grid-v5">
          {[
            { code: 'GP', name: 'Guadeloupe', flag: '🇬🇵' },
            { code: 'MQ', name: 'Martinique', flag: '🇲🇶' },
            { code: 'GF', name: 'Guyane', flag: '🇬🇫' },
            { code: 'RE', name: 'Réunion', flag: '🇷🇪' },
            { code: 'YT', name: 'Mayotte', flag: '🇾🇹' },
            { code: 'NC', name: 'Nouvelle-Calédonie', flag: '🇳🇨' },
            { code: 'PF', name: 'Polynésie française', flag: '🇵🇫' },
            { code: 'WF', name: 'Wallis-et-Futuna', flag: '🇼🇫' },
            { code: 'PM', name: 'Saint-Pierre-et-Miquelon', flag: '🇵🇲' },
            { code: 'BL', name: 'Saint-Barthélemy', flag: '🇧🇱' },
            { code: 'MF', name: 'Saint-Martin', flag: '🇲🇫' },
            { code: 'TF', name: 'TAAF', flag: '🇹🇫' }
          ].map((t, i) => (
            <motion.div
              key={t.code}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              viewport={{ once: true }}
              className="territory-item-v5"
              title={t.name}
              aria-label={t.name}
              onClick={() => navigate(`/comparateur?territoire=${t.code}`)}
            >
              <span className="territory-flag-v5">{t.flag}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 🚀 SECTION 6: HOW IT WORKS - Simplified bullets */}
      <section className="how-it-works-v5">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="section-title"
        >
          Simple et rapide
        </motion.h2>
        <motion.ul
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="steps-list-v5"
        >
          {[
            { emoji: '1️⃣', text: 'Cherchez un produit ou scannez un ticket' },
            { emoji: '2️⃣', text: 'Nous comparons les prix pour vous' },
            { emoji: '3️⃣', text: 'Vous décidez où acheter au meilleur prix' }
          ].map((step, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="step-item-v5"
            >
              <span className="step-emoji">{step.emoji}</span>
              <span className="step-text">{step.text}</span>
            </motion.li>
          ))}
        </motion.ul>
      </section>

      {/* 🏛️ SECTION 7: OBSERVATORY - Enhanced credibility */}
      <section className="observatory-v5">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="observatory-content"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            viewport={{ once: true }}
            className="observatory-icon"
          >
            🏛️
          </motion.span>
          <motion.h3
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            viewport={{ once: true }}
            className="observatory-title"
          >
            Observatoire citoyen indépendant
          </motion.h3>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            viewport={{ once: true }}
            className="observatory-badge"
          >
            🏛️ Données certifiées Etalab 2.0
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            viewport={{ once: true }}
            className="observatory-desc"
          >
            Toutes nos données sont ouvertes et vérifiables
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            viewport={{ once: true }}
            className="observatory-actions"
          >
            <Link to="/observatoire" className="btn-observatory">
              Accéder à l'observatoire
            </Link>
            <Link to="/methodologie" className="btn-docs">
              Pack presse
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ❓ SECTION 8: MINI FAQ - Accordion (NEW) */}
      <section className="mini-faq">
        <motion.h3
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="section-title-small"
        >
          Questions fréquentes
        </motion.h3>
        <div className="faq-list">
          {[
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
          ].map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="faq-item"
            >
              <button
                className="faq-question"
                onClick={() => toggleFaq(i)}
                aria-expanded={expandedFaq === i}
              >
                <span className="faq-icon">❓</span>
                <span className="faq-question-text">{faq.question}</span>
                <span className="faq-toggle">{expandedFaq === i ? '−' : '+'}</span>
              </button>
              {expandedFaq === i && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="faq-answer"
                >
                  <span className="faq-check">✓</span>
                  {faq.answer}
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="faq-cta"
        >
          <Link to="/faq" className="btn-faq">
            Toutes les questions
          </Link>
        </motion.div>
      </section>

      {/* 📞 SECTION 9: FOOTER MINIMAL */}
      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="footer-minimal"
      >
        <Link to="/faq">FAQ</Link>
        <span>•</span>
        <Link to="/methodologie">Méthodologie</Link>
        <span>•</span>
        <Link to="/contact">Contact</Link>
        <span>•</span>
        <Link to="/mentions-legales">Mentions légales</Link>
      </motion.footer>
      </main>

      {/* Mobile Sticky CTA */}
      {showMobileCTA && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          className="mobile-sticky-cta"
        >
          <Link to="/comparateur" className="mobile-cta-btn">
            🔍 Rechercher un produit
          </Link>
        </motion.div>
      )}
    </div>
  );
}
