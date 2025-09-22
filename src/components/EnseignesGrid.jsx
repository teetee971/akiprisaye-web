import React from 'react';

// Import des images depuis le dossier assets
import applicationImg from '../assets/images/enseignes/Application_A_KI_PRI_SA_YÉ.png';
import budgetImg from '../assets/images/enseignes/Gérez Votre Budget Facilement.png';
import carteImg from '../assets/images/enseignes/Carte des Territoires d\'Outre-Mer.png';
import budgetKiPriImg from '../assets/images/enseignes/Maîtrisez votre budget avec Ki Pri.png';
import palmaresImg from '../assets/images/enseignes/Palmarès_Classement_des_Meilleures_Enseignes.png';
import lutteImg from '../assets/images/enseignes/Lutte_contre_la_vie_chère.png';
import publiciteImg from '../assets/images/enseignes/Publicité_Moderne_et_Culturelle.png';
import lancementImg from '../assets/images/enseignes/Lancement_de_l_appli_A_KI_PRI_SA_YÉ.png';

const EnseignesGrid = () => {
  const enseignes = [
    {
      id: 1,
      title: 'Application A KI PRI SA YÉ',
      description: 'Découvrez notre application de comparaison de prix intelligente',
      image: applicationImg,
      category: 'Application'
    },
    {
      id: 2,
      title: 'Gérez Votre Budget Facilement',
      description: 'Outils de gestion budgétaire adaptés aux territoires d\'outre-mer',
      image: budgetImg,
      category: 'Budget'
    },
    {
      id: 3,
      title: 'Carte des Territoires d\'Outre-Mer',
      description: 'Visualisation interactive des prix par territoire',
      image: carteImg,
      category: 'Géographie'
    },
    {
      id: 4,
      title: 'Maîtrisez votre budget avec Ki Pri',
      description: 'Conseils et astuces pour optimiser vos dépenses',
      image: budgetKiPriImg,
      category: 'Conseils'
    },
    {
      id: 5,
      title: 'Palmarès des Meilleures Enseignes',
      description: 'Classement et évaluation des commerces locaux',
      image: palmaresImg,
      category: 'Classement'
    },
    {
      id: 6,
      title: 'Lutte contre la vie chère',
      description: 'Initiatives et solutions pour réduire le coût de la vie',
      image: lutteImg,
      category: 'Initiative'
    },
    {
      id: 7,
      title: 'Publicité Moderne et Culturelle',
      description: 'Campagnes de sensibilisation adaptées aux cultures locales',
      image: publiciteImg,
      category: 'Communication'
    },
    {
      id: 8,
      title: 'Lancement de l\'appli A KI PRI SA YÉ',
      description: 'Événement de lancement et présentation officielle',
      image: lancementImg,
      category: 'Événement'
    }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto p-6 bg-neutral-900 rounded-2xl shadow-2xl">
      {/* Titre centralisé */}
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-white mb-4">
          Nos Enseignes & Campagnes
        </h2>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
          Découvrez nos initiatives et campagnes pour lutter contre la vie chère 
          dans les territoires d'outre-mer
        </p>
      </div>

      {/* Grille responsive : 2 colonnes mobile, 4 desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {enseignes.map((enseigne) => (
          <div
            key={enseigne.id}
            className="group relative bg-neutral-800 rounded-xl overflow-hidden shadow-2xl 
                       transform transition-all duration-300 hover:scale-105 hover:shadow-3xl
                       border border-neutral-700 hover:border-neutral-600"
          >
            {/* Image avec effet overlay */}
            <div className="relative aspect-[4/3] overflow-hidden">
              <img
                src={enseigne.image}
                alt={enseigne.title}
                className="w-full h-full object-cover transition-transform duration-300 
                          group-hover:scale-110"
                loading="lazy"
              />
              
              {/* Overlay gradient sur hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent 
                             opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              </div>

              {/* Badge catégorie */}
              <div className="absolute top-3 left-3 bg-blue-600/90 text-white text-xs 
                             px-2 py-1 rounded-full font-medium backdrop-blur-sm">
                {enseigne.category}
              </div>
            </div>

            {/* Contenu texte */}
            <div className="p-4">
              <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 
                            group-hover:text-blue-300 transition-colors duration-200">
                {enseigne.title}
              </h3>
              <p className="text-sm text-gray-400 line-clamp-3 leading-relaxed">
                {enseigne.description}
              </p>
            </div>

            {/* Effet de brillance sur hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent 
                           -translate-x-full group-hover:translate-x-full transition-transform duration-700">
            </div>
          </div>
        ))}
      </div>

      {/* Section d'action en bas */}
      <div className="mt-12 text-center">
        <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-xl p-6 
                       border border-blue-800/30 backdrop-blur-sm">
          <h3 className="text-2xl font-bold text-white mb-3">
            🚀 Rejoignez notre mission
          </h3>
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
            Ensemble, luttons contre la vie chère et créons un avenir plus équitable 
            pour tous les territoires d'outre-mer.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium 
                              rounded-lg transition-colors duration-200 shadow-lg">
              📱 Télécharger l'app
            </button>
            <button className="px-6 py-3 border border-gray-500 hover:border-gray-400 text-gray-300 
                              hover:text-white font-medium rounded-lg transition-colors duration-200">
              📊 Voir les statistiques
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnseignesGrid;