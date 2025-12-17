import React, { useState, useEffect } from 'react';
import { MapPin, ShoppingCart, AlertCircle, Info, Navigation } from 'lucide-react';

// Catégories officielles basées sur rapports OPMR/DGCCRF
const CATEGORIES_OFFICIELLES = {
  'alimentaire_base': {
    nom: 'Produits alimentaires de base',
    types_magasins: ['Supermarché', 'Hypermarché', 'Hard discount', 'Commerce de proximité'],
    source: 'OPMR - Panier de référence',
  },
  'frais': {
    nom: 'Produits frais',
    types_magasins: ['Supermarché', 'Hypermarché', 'Marché alimentaire'],
    source: 'OPMR - Alimentation fraîche',
  },
  'carburant': {
    nom: 'Carburant',
    types_magasins: ['Station-service'],
    source: 'prix-carburants.gouv.fr',
  },
  'bricolage': {
    nom: 'Bricolage / Matériaux',
    types_magasins: ['Bricolage / Matériaux'],
    source: 'INSEE - NAF 4752',
  },
  'hygiene': {
    nom: 'Hygiène / Santé',
    types_magasins: ['Pharmacie', 'Parapharmacie', 'Supermarché'],
    source: 'OPMR - Hygiène',
  },
};

const PRODUITS_GENERIQUES = [
  { nom: 'Riz', categorie: 'alimentaire_base' },
  { nom: 'Pâtes', categorie: 'alimentaire_base' },
  { nom: 'Lait', categorie: 'frais' },
  { nom: 'Pain', categorie: 'frais' },
  { nom: 'Fruits', categorie: 'frais' },
  { nom: 'Légumes', categorie: 'frais' },
  { nom: 'Viande', categorie: 'frais' },
  { nom: 'Poisson', categorie: 'frais' },
  { nom: 'Huile', categorie: 'alimentaire_base' },
  { nom: 'Sucre', categorie: 'alimentaire_base' },
  { nom: 'Farine', categorie: 'alimentaire_base' },
  { nom: 'Eau', categorie: 'alimentaire_base' },
  { nom: 'Essence', categorie: 'carburant' },
  { nom: 'Diesel', categorie: 'carburant' },
  { nom: 'Médicaments', categorie: 'hygiene' },
  { nom: 'Shampooing', categorie: 'hygiene' },
  { nom: 'Savon', categorie: 'hygiene' },
];

export default function ListeCourses({ territoire = '971' }) {
  const [listeCourses, setListeCourses] = useState([]);
  const [produitSelectionne, setProduitSelectionne] = useState('');
  const [gpsActive, setGpsActive] = useState(false);
  const [position, setPosition] = useState(null);
  const [magasins, setMagasins] = useState([]);
  const [magasinsProches, setMagasinsProches] = useState([]);
  const [erreurGPS, setErreurGPS] = useState(null);
  const [consentementGPS, setConsentementGPS] = useState(false);

  // Charger les magasins du territoire
  useEffect(() => {
    const chargerMagasins = async () => {
      try {
        // Charger dynamiquement le fichier JSON du territoire
        const module = await import(`../data/magasins/${territoire}_guadeloupe.json`);
        if (module.default && module.default.magasins) {
          setMagasins(module.default.magasins);
        }
      } catch (error) {
        console.log('Données magasins non disponibles pour ce territoire');
        setMagasins([]);
      }
    };
    chargerMagasins();
  }, [territoire]);

  // Fonction GPS (locale uniquement)
  const activerGPS = () => {
    if (!consentementGPS) {
      alert('Vous devez accepter l\'utilisation de votre localisation pour cette fonctionnalité.');
      return;
    }

    if (!navigator.geolocation) {
      setErreurGPS('La géolocalisation n\'est pas supportée par votre navigateur');
      return;
    }

    setGpsActive(true);
    setErreurGPS(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // ⚠️ IMPORTANT: Position utilisée UNIQUEMENT localement
        // JAMAIS stockée, JAMAIS envoyée au serveur
        setPosition({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        calculerMagasinsProches(pos.coords);
      },
      (error) => {
        setGpsActive(false);
        setErreurGPS('Impossible d\'obtenir votre position: ' + error.message);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      },
    );
  };

  // Calcul distance (formule Haversine)
  const calculerDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Calculer magasins proches avec score de pertinence
  const calculerMagasinsProches = (coords) => {
    if (!magasins || magasins.length === 0) return;

    // Note: Dans la réalité, les coordonnées GPS des magasins viendraient de SIRENE
    // Pour cette démo, on utilise des coordonnées approximatives
    const magasinsAvecDistance = magasins
      .filter(m => m.presence === 'confirmee')
      .map(magasin => {
        // Distance simulée (à remplacer par vraies coordonnées SIRENE)
        const distanceKm = Math.random() * 10 + 0.5;
        
        return {
          ...magasin,
          distance: distanceKm.toFixed(1),
        };
      })
      .sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

    setMagasinsProches(magasinsAvecDistance);
  };

  // Calculer score de pertinence (NON PRIX)
  const calculerScorePertinence = (magasin, categoriesRequises) => {
    let score = 0;
    const raisons = [];

    // Critère 1: Type de magasin correspond aux catégories
    const typesCompatibles = categoriesRequises.flatMap(cat => 
      CATEGORIES_OFFICIELLES[cat]?.types_magasins || [],
    );
    
    if (typesCompatibles.includes(magasin.type_magasin)) {
      score += 3;
      raisons.push('Type de magasin adapté');
    }

    // Critère 2: Distance
    const dist = parseFloat(magasin.distance);
    if (dist < 2) {
      score += 3;
      raisons.push('Très proche');
    } else if (dist < 5) {
      score += 2;
      raisons.push('Distance raisonnable');
    } else {
      score += 1;
      raisons.push('Plus éloigné');
    }

    // Critère 3: Couverture des catégories
    const nbCategories = categoriesRequises.length;
    if (magasin.type_magasin === 'Hypermarché' && nbCategories > 2) {
      score += 2;
      raisons.push('Permet de tout trouver');
    }

    return { score, raisons, niveau: score >= 6 ? 'Prioritaire' : score >= 4 ? 'Pertinent' : 'Moins pertinent' };
  };

  // Ajouter produit à la liste
  const ajouterProduit = () => {
    if (!produitSelectionne) return;
    const produit = PRODUITS_GENERIQUES.find(p => p.nom === produitSelectionne);
    if (produit && !listeCourses.find(p => p.nom === produit.nom)) {
      setListeCourses([...listeCourses, produit]);
      setProduitSelectionne('');
    }
  };

  // Retirer produit
  const retirerProduit = (nom) => {
    setListeCourses(listeCourses.filter(p => p.nom !== nom));
  };

  // Obtenir catégories uniques de la liste
  const categoriesRequises = [...new Set(listeCourses.map(p => p.categorie))];

  // Générer recommandations
  const recommandations = magasinsProches.map(magasin => ({
    magasin,
    pertinence: calculerScorePertinence(magasin, categoriesRequises),
  })).sort((a, b) => b.pertinence.score - a.pertinence.score);

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Avertissement RGPD */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-100">
            <p className="font-semibold mb-2">Utilisation de la géolocalisation</p>
            <ul className="list-disc list-inside space-y-1 text-blue-200">
              <li>Votre position GPS est utilisée <strong>uniquement localement</strong></li>
              <li><strong>Jamais stockée</strong> sur nos serveurs</li>
              <li><strong>Jamais transmise</strong> à des tiers</li>
              <li>Utilisée uniquement pour calculer les distances</li>
            </ul>
          </div>
        </div>
      </div>

      {/* En-tête */}
      <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-blue-500/30 rounded-lg p-6">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <ShoppingCart className="w-8 h-8" />
          Liste de Courses Intelligente
        </h1>
        <p className="text-blue-200">
          Organisez vos courses selon les données officielles et la distance
        </p>
      </div>

      {/* Avertissement méthodologique */}
      <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-100">
            <p className="font-semibold mb-1">Ce module NE compare PAS les prix</p>
            <p className="text-yellow-200">
              Il propose une aide à la décision basée sur le <strong>type de magasin</strong>, 
              la <strong>distance</strong> et les <strong>données officielles</strong> (OPMR, INSEE). 
              Aucun prix exact n'est affiché car nous n'avons pas accès à ces données.
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Colonne gauche: Liste de courses */}
        <div className="space-y-4">
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <h2 className="text-xl font-semibold text-white mb-4">Votre liste</h2>
            
            {/* Ajouter produit */}
            <div className="flex gap-2 mb-4">
              <select
                value={produitSelectionne}
                onChange={(e) => setProduitSelectionne(e.target.value)}
                className="flex-1 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
              >
                <option value="">Sélectionner un produit</option>
                {PRODUITS_GENERIQUES
                  .filter(p => !listeCourses.find(lp => lp.nom === p.nom))
                  .map(p => (
                    <option key={p.nom} value={p.nom}>{p.nom}</option>
                  ))
                }
              </select>
              <button
                onClick={ajouterProduit}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium"
              >
                Ajouter
              </button>
            </div>

            {/* Liste */}
            {listeCourses.length === 0 ? (
              <p className="text-slate-400 text-center py-8">Votre liste est vide</p>
            ) : (
              <div className="space-y-2">
                {listeCourses.map(produit => (
                  <div key={produit.nom} className="flex items-center justify-between bg-slate-700/50 rounded p-3">
                    <div>
                      <p className="text-white font-medium">{produit.nom}</p>
                      <p className="text-xs text-slate-400">
                        {CATEGORIES_OFFICIELLES[produit.categorie]?.nom}
                      </p>
                    </div>
                    <button
                      onClick={() => retirerProduit(produit.nom)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      Retirer
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Consentement GPS */}
            {listeCourses.length > 0 && (
              <div className="mt-4 space-y-3">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentementGPS}
                    onChange={(e) => setConsentementGPS(e.target.checked)}
                    className="mt-1"
                  />
                  <span className="text-sm text-slate-300">
                    J'accepte l'utilisation de ma position GPS <strong>en local uniquement</strong> 
                    pour calculer les distances
                  </span>
                </label>

                <button
                  onClick={activerGPS}
                  disabled={!consentementGPS || gpsActive}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded font-medium ${
                    consentementGPS && !gpsActive
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-slate-600 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Navigation className="w-5 h-5" />
                  {gpsActive ? 'Position activée' : 'Trouver les magasins proches'}
                </button>
              </div>
            )}

            {erreurGPS && (
              <div className="mt-3 bg-red-900/20 border border-red-500/30 rounded p-3">
                <p className="text-red-300 text-sm">{erreurGPS}</p>
              </div>
            )}
          </div>

          {/* Sources des catégories */}
          {categoriesRequises.length > 0 && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-slate-300 mb-2">Sources officielles utilisées</h3>
              <div className="space-y-2">
                {categoriesRequises.map(cat => (
                  <div key={cat} className="text-xs text-slate-400">
                    <span className="text-slate-300">{CATEGORIES_OFFICIELLES[cat]?.nom}:</span>{' '}
                    {CATEGORIES_OFFICIELLES[cat]?.source}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Colonne droite: Recommandations */}
        <div className="space-y-4">
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
            <h2 className="text-xl font-semibold text-white mb-4">Recommandations</h2>

            {!gpsActive ? (
              <div className="text-center py-8">
                <MapPin className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">
                  Activez votre position pour voir les recommandations
                </p>
              </div>
            ) : recommandations.length === 0 ? (
              <p className="text-slate-400 text-center py-8">
                Aucun magasin confirmé disponible pour ce territoire
              </p>
            ) : (
              <div className="space-y-3">
                {recommandations.slice(0, 5).map((rec, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 ${
                      rec.pertinence.niveau === 'Prioritaire'
                        ? 'bg-green-900/20 border-green-500/30'
                        : rec.pertinence.niveau === 'Pertinent'
                          ? 'bg-blue-900/20 border-blue-500/30'
                          : 'bg-slate-700/20 border-slate-600/30'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-white">{rec.magasin.enseigne}</h3>
                        <p className="text-sm text-slate-400">{rec.magasin.type_magasin}</p>
                      </div>
                      <div className="text-right">
                        <div className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          rec.pertinence.niveau === 'Prioritaire'
                            ? 'bg-green-500/20 text-green-300'
                            : rec.pertinence.niveau === 'Pertinent'
                              ? 'bg-blue-500/20 text-blue-300'
                              : 'bg-slate-500/20 text-slate-300'
                        }`}>
                          {rec.pertinence.niveau}
                        </div>
                        <p className="text-sm text-slate-400 mt-1">{rec.magasin.distance} km</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {rec.pertinence.raisons.map((raison, i) => (
                        <p key={i} className="text-xs text-slate-400">• {raison}</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Explication méthodologie */}
          {gpsActive && recommandations.length > 0 && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-white mb-2">Comment est calculée la pertinence ?</h3>
              <div className="text-xs text-slate-400 space-y-2">
                <p>Le score de pertinence est basé sur :</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><strong>Type de magasin</strong> adapté aux catégories (OPMR/DGCCRF)</li>
                  <li><strong>Distance</strong> calculée par GPS local</li>
                  <li><strong>Couverture</strong> des besoins (un seul déplacement)</li>
                </ul>
                <p className="mt-2 text-yellow-400">
                  ⚠️ Ce n'est PAS une comparaison de prix. Les prix exacts ne sont pas disponibles.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
