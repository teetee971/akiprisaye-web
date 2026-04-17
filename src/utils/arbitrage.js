export const getDecision = (economieBrute, distanceKm, prixCarburant = 1.74) => {
  const consommationMoyenne = 7.5; 
  const coutEssence = (distanceKm * 2) * (consommationMoyenne / 100) * prixCarburant;
  const gainReel = economieBrute - coutEssence;

  return {
    rentable: gainReel > 0,
    gainReel: parseFloat(gainReel).toFixed(2),
    coutTrajet: parseFloat(coutEssence).toFixed(2)
  };
};
