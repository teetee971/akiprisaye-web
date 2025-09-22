import React from 'react';

// Import images
import applicationImage from '../assets/images/enseignes/Application_A_KI_PRI_SA_YÉ.png';
import budgetImage from '../assets/images/enseignes/Gérez_Votre_Budget_Facilement.png';
import carteImage from '../assets/images/enseignes/Carte_des_Territoires_dOutre-Mer.png';
import maitriseBudgetImage from '../assets/images/enseignes/Maîtrisez_votre_budget_avec_Ki_Pri.png';
import palmaresImage from '../assets/images/enseignes/Palmarès_Classement_des_Meilleures_Enseignes.png';
import lutteVieChereImage from '../assets/images/enseignes/Lutte_contre_la_vie_chère.png';
import publiciteCulturelleImage from '../assets/images/enseignes/Publicité_Moderne_et_Culturelle.png';
import lancementAppliImage from '../assets/images/enseignes/Lancement_de_l_appli_A_KI_PRI_SA_YÉ.png';

export default function EnseignesGrid() {
  const enseignes = [
    {
      id: 1,
      title: "Application A KI PRI SA YÉ",
      image: applicationImage,
      description: "L'application officielle de comparaison de prix"
    },
    {
      id: 2,
      title: "Gérez Votre Budget Facilement",
      image: budgetImage,
      description: "Outils intelligents pour la gestion budgétaire"
    },
    {
      id: 3,
      title: "Carte des Territoires d'Outre-Mer",
      image: carteImage,
      description: "Visualisation interactive des DROM-COM"
    },
    {
      id: 4,
      title: "Maîtrisez votre budget avec Ki Pri",
      image: maitriseBudgetImage,
      description: "Conseils personnalisés pour optimiser vos dépenses"
    },
    {
      id: 5,
      title: "Palmarès des Meilleures Enseignes",
      image: palmaresImage,
      description: "Classement basé sur la satisfaction client"
    },
    {
      id: 6,
      title: "Lutte contre la vie chère",
      image: lutteVieChereImage,
      description: "Initiative pour un pouvoir d'achat équitable"
    },
    {
      id: 7,
      title: "Publicité Moderne et Culturelle",
      image: publiciteCulturelleImage,
      description: "Campagne respectueuse de l'identité locale"
    },
    {
      id: 8,
      title: "Lancement de l'appli A KI PRI SA YÉ",
      image: lancementAppliImage,
      description: "Événement officiel de mise en service"
    }
  ];

  return (
    <div className="bg-neutral-900 py-16 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Titre centralisé */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">
            Nos Enseignes & Campagnes
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Découvrez notre écosystème d'enseignes partenaires et nos campagnes innovantes 
            pour une consommation responsable dans les territoires d'Outre-Mer.
          </p>
        </div>

        {/* Grille responsive */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {enseignes.map((enseigne) => (
            <div
              key={enseigne.id}
              className="bg-neutral-800 rounded-xl overflow-hidden shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:bg-neutral-700 group cursor-pointer"
            >
              {/* Container d'image avec aspect ratio fixe */}
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={enseigne.image}
                  alt={enseigne.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  loading="lazy"
                />
              </div>
              
              {/* Contenu textuel */}
              <div className="p-4">
                <h3 className="text-white font-semibold text-sm mb-2 line-clamp-2 leading-5">
                  {enseigne.title}
                </h3>
                <p className="text-gray-400 text-xs line-clamp-2 leading-4">
                  {enseigne.description}
                </p>
              </div>

              {/* Effet de survol subtil */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
          ))}
        </div>

        {/* Message d'encouragement */}
        <div className="text-center mt-12">
          <p className="text-gray-400 text-sm">
            Plus d'enseignes et de campagnes à venir. Restez connectés !
          </p>
        </div>
      </div>
    </div>
  );
}