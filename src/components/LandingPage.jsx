import React from 'react';
import { motion } from 'framer-motion';
import { Link as ScrollLink, Element } from 'react-scroll';
import { ChevronDownIcon, MapPinIcon, ChartBarIcon, ShoppingCartIcon, HeartIcon } from '@heroicons/react/24/outline';

const LandingPage = () => {
  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const features = [
    {
      icon: <MapPinIcon className="h-8 w-8" />,
      title: "Carte GPS Interactive",
      description: "Trouvez les meilleures offres près de chez vous avec notre carte intelligente et géolocalisation."
    },
    {
      icon: <ChartBarIcon className="h-8 w-8" />,
      title: "Suivi des Prix",
      description: "Suivez l'évolution des prix en temps réel et recevez des alertes sur vos produits favoris."
    },
    {
      icon: <ShoppingCartIcon className="h-8 w-8" />,
      title: "Comparateur Intelligent",
      description: "Comparez automatiquement les prix entre toutes les enseignes des DROM-COM."
    },
    {
      icon: <HeartIcon className="h-8 w-8" />,
      title: "Liste de Favoris",
      description: "Sauvegardez vos produits préférés et créez des listes de courses optimisées."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <Element name="hero">
        <section className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <motion.div
              initial="initial"
              animate="animate"
              variants={staggerContainer}
              className="space-y-8"
            >
              <motion.h1
                variants={fadeInUp}
                className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight"
              >
                A KI PRI SA YÉ
              </motion.h1>
              
              <motion.p
                variants={fadeInUp}
                className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto"
              >
                Le comparateur de prix intelligent pour les territoires d'outre-mer français
              </motion.p>
              
              <motion.p
                variants={fadeInUp}
                className="text-lg text-gray-500 max-w-2xl mx-auto"
              >
                Comparez les prix, trouvez les meilleures offres et maîtrisez votre budget en Guadeloupe, Martinique, Guyane, Réunion et Mayotte
              </motion.p>
              
              <motion.div
                variants={fadeInUp}
                className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-12"
              >
                <ScrollLink
                  to="features"
                  smooth={true}
                  duration={500}
                  className="px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  Découvrir les fonctionnalités
                </ScrollLink>
                
                <ScrollLink
                  to="demo"
                  smooth={true}
                  duration={500}
                  className="px-8 py-4 border-2 border-blue-600 text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-colors cursor-pointer"
                >
                  Voir la démo
                </ScrollLink>
              </motion.div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
            >
              <ScrollLink to="features" smooth={true} duration={500} className="cursor-pointer">
                <ChevronDownIcon className="h-8 w-8 text-gray-400 animate-bounce" />
              </ScrollLink>
            </motion.div>
          </div>
        </section>
      </Element>

      {/* Features Section */}
      <Element name="features">
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="text-center mb-16"
            >
              <motion.h2
                variants={fadeInUp}
                className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6"
              >
                Pourquoi choisir A KI PRI SA YÉ ?
              </motion.h2>
              
              <motion.p
                variants={fadeInUp}
                className="text-xl text-gray-600 max-w-3xl mx-auto"
              >
                Une solution complète pour comparer les prix et optimiser vos achats dans les DROM-COM
              </motion.p>
            </motion.div>

            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
            >
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow"
                >
                  <div className="text-blue-600 mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      </Element>

      {/* Statistics Section */}
      <Element name="stats">
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-blue-600">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="text-center text-white"
            >
              <motion.h2
                variants={fadeInUp}
                className="text-3xl md:text-4xl font-bold mb-12"
              >
                Des économies réelles pour tous
              </motion.h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <motion.div variants={fadeInUp} className="text-center">
                  <div className="text-4xl md:text-5xl font-bold mb-2">15%</div>
                  <div className="text-xl opacity-90">d'économies moyennes</div>
                </motion.div>
                
                <motion.div variants={fadeInUp} className="text-center">
                  <div className="text-4xl md:text-5xl font-bold mb-2">500+</div>
                  <div className="text-xl opacity-90">produits comparés</div>
                </motion.div>
                
                <motion.div variants={fadeInUp} className="text-center">
                  <div className="text-4xl md:text-5xl font-bold mb-2">5</div>
                  <div className="text-xl opacity-90">territoires couverts</div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>
      </Element>

      {/* Demo Section */}
      <Element name="demo">
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="text-center"
            >
              <motion.h2
                variants={fadeInUp}
                className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-8"
              >
                Prêt à économiser ?
              </motion.h2>
              
              <motion.p
                variants={fadeInUp}
                className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto"
              >
                Commencez dès maintenant à comparer les prix et trouvez les meilleures offres près de chez vous
              </motion.p>
              
              <motion.div
                variants={fadeInUp}
                className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              >
                <ScrollLink
                  to="hero"
                  smooth={true}
                  duration={500}
                  className="px-8 py-4 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors cursor-pointer"
                >
                  Commencer maintenant
                </ScrollLink>
                
                <button className="px-8 py-4 border-2 border-purple-600 text-purple-600 rounded-xl font-semibold hover:bg-purple-50 transition-colors">
                  En savoir plus
                </button>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </Element>
    </div>
  );
};

export default LandingPage;