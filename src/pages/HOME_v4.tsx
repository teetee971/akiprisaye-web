/**
 * Home Page v4.1 - Modern & Minimalist (Enhanced)
 * 
 * Complete redesign following Apple/Airbnb minimalist principles
 * - Clean hero with single CTA
 * - 3 simple steps
 * - Generous spacing
 * - Smooth animations
 * - Mobile-first responsive
 * - Enhanced UX features
 */

import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { safeLocalStorage } from '../utils/safeLocalStorage';

export default function HomeV4() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    scans: 0,
    products: 0,
    territories: 12
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const [showMobileCTA, setShowMobileCTA] = useState(false);
  const [displayStats, setDisplayStats] = useState({ scans: 0, products: 0, territories: 0 });
  
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
            setShowMobileCTA(window.scrollY > windowHeight * 0.8);
          }
          
          ticking = false;
        });
        
        ticking = true;
      }
    };

    // Update cached dimensions on resize
    const handleResize = () => {
      windowHeight = window.innerHeight;
      windowWidth = window.innerWidth;
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

  return (
    <div className="home-v4">
      {/* Skip to main content for accessibility */}
      <a href="#main-content" className="skip-link">
        Aller au contenu principal
      </a>
      
      {/* 🏆 HERO SECTION WITH PARALLAX */}
      <section className="hero" ref={heroRef}>
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
            Comprendre et comparer les prix<br />
            des territoires d'outre-mer
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="hero-subtitle"
          >
            Données publiques • Sans publicité • Indépendant
          </motion.p>
          
          {/* Quick Search Preview */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            onSubmit={handleSearch}
            className="hero-search"
          >
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="hero-search-input"
              aria-label="Rechercher un produit"
            />
            <button type="submit" className="hero-search-btn" aria-label="Rechercher">
              🔍
            </button>
          </motion.form>
          
          {/* CTA BUTTONS */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="hero-cta-group"
          >
            <Link 
              to="/comparateur" 
              className="cta-primary"
            >
              🔍 Rechercher un produit
            </Link>
            
            <Link 
              to="/scan" 
              className="cta-secondary"
            >
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
            onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
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

      {/* 📊 3 ÉTAPES SIMPLES */}
      <section className="steps">
        <div className="steps-grid">
          {[
            { icon: '🧾', title: 'Scanner', desc: 'Ticket ou code-barres', link: '/scan' },
            { icon: '💡', title: 'Comprendre', desc: 'Infos et équivalences', link: '/comprendre-prix' },
            { icon: '⚖️', title: 'Comparer', desc: 'Entre enseignes', link: '/comparateur' }
          ].map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
            >
              <Link to={step.link} className="step-card">
                <div className="step-icon">{step.icon}</div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-desc">{step.desc}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 🌍 TERRITOIRES WITH ENHANCED HOVER */}
      <section className="territories">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="section-title"
        >
          12 territoires d'outre-mer
        </motion.h2>
        <div className="territories-grid">
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
              transition={{ delay: i * 0.05 }}
              viewport={{ once: true }}
              className="territory-item"
              title={t.name}
              aria-label={t.name}
            >
              <span className="territory-flag">{t.flag}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 🎯 FONCTIONNALITÉS CLÉS */}
      <section className="features">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="section-title"
        >
          Ce que vous pouvez faire
        </motion.h2>
        <motion.ul
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="features-list"
        >
          {[
            'Comparer les prix entre enseignes',
            'Suivre l\'évolution des prix',
            'Localiser les magasins sur carte',
            'Exporter les données ouvertes'
          ].map((feature, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
            >
              ✓ {feature}
            </motion.li>
          ))}
        </motion.ul>
      </section>

      {/* 📈 COMPTEURS PUBLICS WITH COUNT-UP ANIMATION */}
      {(stats.scans > 0 || stats.products > 0) && (
        <section className="stats" ref={statsRef}>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="section-title"
          >
            Plateforme citoyenne
          </motion.h2>
          <div className="stats-grid">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              viewport={{ once: true }}
              className="stat-item"
            >
              <div className="stat-value">{displayStats.scans.toLocaleString()}</div>
              <div className="stat-label">Scans</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              viewport={{ once: true }}
              className="stat-item"
            >
              <div className="stat-value">{displayStats.products.toLocaleString()}</div>
              <div className="stat-label">Produits</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              viewport={{ once: true }}
              className="stat-item"
            >
              <div className="stat-value">{displayStats.territories}</div>
              <div className="stat-label">Territoires</div>
            </motion.div>
          </div>
        </section>
      )}

      {/* 🏛️ OBSERVATOIRE WITH STAGGER ANIMATION */}
      <section className="observatory">
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
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            viewport={{ once: true }}
            className="observatory-desc"
          >
            Toutes nos données sont ouvertes et vérifiables<br />
            Licence Etalab 2.0
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
              Documentation
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* 📞 FOOTER MINIMAL WITH STAGGER */}
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
