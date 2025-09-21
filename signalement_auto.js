// Déclenchement automatique des signalements

// API endpoint pour les signalements
const SIGNALEMENT_API = '/api/signalement';

// Fonction pour traiter les signalements stockés localement
export function processLocalReports() {
  const reports = JSON.parse(localStorage.getItem('akp-reports') || '[]');
  
  if (reports.length === 0) {
    console.log('Aucun signalement local à traiter');
    return;
  }
  
  console.log(`Traitement de ${reports.length} signalement(s) local(aux)`);
  
  // Simuler le traitement des signalements
  reports.forEach((report, index) => {
    console.log(`Signalement ${index + 1}:`, {
      produit: report.product?.name || 'Inconnu',
      motif: report.reason,
      timestamp: report.timestamp
    });
  });
  
  // En production, ici on enverrait les signalements au serveur
  // Pour la démo, on vide juste le cache local après affichage
  setTimeout(() => {
    localStorage.removeItem('akp-reports');
    console.log('Signalements locaux traités et supprimés');
  }, 5000);
}

// Fonction pour obtenir les statistiques des signalements
export function getReportStats() {
  const reports = JSON.parse(localStorage.getItem('akp-reports') || '[]');
  
  const stats = {
    total: reports.length,
    byReason: {},
    recent: reports.filter(r => {
      const reportDate = new Date(r.timestamp);
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return reportDate > dayAgo;
    }).length
  };
  
  reports.forEach(report => {
    const reason = report.reason || 'non_specifie';
    stats.byReason[reason] = (stats.byReason[reason] || 0) + 1;
  });
  
  return stats;
}

// Auto-traitement des signalements au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
  // Traiter les signalements locaux après un délai
  setTimeout(() => {
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      processLocalReports();
    }
  }, 2000);
});