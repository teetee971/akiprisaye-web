/**
 * Preparedness Service
 * 
 * Manages cyclone preparation checklists and scoring
 */

import type {
  PreparednessChecklist,
  PreparationPhase,
  ChecklistItem,
  HouseholdProfile
} from '../types/cycloneComparison';

/**
 * Get checklist template by phase
 */
export function getChecklistByPhase(phase: PreparationPhase): PreparednessChecklist {
  const id = `checklist-${phase}-${Date.now()}`;
  const items: ChecklistItem[] = [];

  // Load template from local storage or default templates
  const templates = getChecklistTemplates();
  const template = templates[phase] || [];

  for (const t of template) {
    items.push({
      id: t.id,
      task: t.task,
      completed: false,
      priority: t.priority
    });
  }

  return {
    id,
    phase,
    items,
    score: 0,
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Save checklist to local storage
 */
export async function saveChecklist(checklist: PreparednessChecklist): Promise<void> {
  try {
    const key = `checklist-${checklist.phase}`;
    localStorage.setItem(key, JSON.stringify(checklist));
  } catch (error) {
    console.error('Error saving checklist:', error);
  }
}

/**
 * Load checklist from local storage
 */
export function loadChecklist(phase: PreparationPhase): PreparednessChecklist | null {
  try {
    const key = `checklist-${phase}`;
    const data = localStorage.getItem(key);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading checklist:', error);
  }
  return null;
}

/**
 * Calculate preparedness score
 */
export function calculatePreparednessScore(checklist: PreparednessChecklist): number {
  if (checklist.items.length === 0) return 0;

  const weights = {
    critical: 3,
    high: 2,
    medium: 1,
    low: 0.5
  };

  let totalWeight = 0;
  let completedWeight = 0;

  for (const item of checklist.items) {
    const weight = weights[item.priority];
    totalWeight += weight;
    if (item.completed) {
      completedWeight += weight;
    }
  }

  return totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;
}

/**
 * Toggle checklist item
 */
export function toggleChecklistItem(
  checklist: PreparednessChecklist,
  itemId: string
): PreparednessChecklist {
  const updatedItems = checklist.items.map(item => {
    if (item.id === itemId) {
      return {
        ...item,
        completed: !item.completed,
        completedAt: !item.completed ? new Date().toISOString() : undefined
      };
    }
    return item;
  });

  const updated: PreparednessChecklist = {
    ...checklist,
    items: updatedItems,
    lastUpdated: new Date().toISOString()
  };

  updated.score = calculatePreparednessScore(updated);

  return updated;
}

/**
 * Get personalized recommendations
 */
export function getPersonalizedRecommendations(
  checklist: PreparednessChecklist,
  householdProfile: HouseholdProfile
): string[] {
  const recommendations: string[] = [];

  // Check for incomplete critical items
  const incompleteCritical = checklist.items.filter(
    item => item.priority === 'critical' && !item.completed
  );

  if (incompleteCritical.length > 0) {
    recommendations.push(
      `⚠️ ${incompleteCritical.length} tâche(s) critique(s) non complétée(s)`
    );
  }

  // Household-specific recommendations
  if (householdProfile.hasBabies) {
    const hasBabyItems = checklist.items.some(
      item => item.task.toLowerCase().includes('bébé') || item.task.toLowerCase().includes('lait')
    );
    if (!hasBabyItems) {
      recommendations.push('👶 N\'oubliez pas le lait en poudre et les couches pour bébé');
    }
  }

  if (householdProfile.hasElderly) {
    recommendations.push('👴 Prévoir médicaments essentiels pour personnes âgées (1 mois)');
  }

  if (householdProfile.hasPets) {
    recommendations.push('🐕 Prévoir nourriture et eau pour animaux (7 jours minimum)');
  }

  if (householdProfile.hasVehicle) {
    const hasFuelTask = checklist.items.some(
      item => item.task.toLowerCase().includes('essence') && item.completed
    );
    if (!hasFuelTask) {
      recommendations.push('🚗 Faire le plein d\'essence');
    }
  }

  // Score-based recommendations
  const score = checklist.score;
  if (score < 30) {
    recommendations.push('📋 Vous êtes peu préparé. Commencez par les tâches critiques.');
  } else if (score < 60) {
    recommendations.push('📋 Préparation en cours. Continuez les tâches importantes.');
  } else if (score < 85) {
    recommendations.push('📋 Bonne préparation. Complétez les dernières tâches.');
  } else {
    recommendations.push('✅ Excellente préparation ! Restez vigilant.');
  }

  return recommendations;
}

/**
 * Get checklist templates
 */
function getChecklistTemplates(): Record<PreparationPhase, any[]> {
  return {
    before: [
      { id: 'before-001', task: 'Faire provisions eau/nourriture (3-7 jours)', priority: 'critical' },
      { id: 'before-002', task: 'Retirer objets extérieurs (plantes, meubles)', priority: 'high' },
      { id: 'before-003', task: 'Protéger fenêtres (volets, planches, X adhésif)', priority: 'critical' },
      { id: 'before-004', task: 'Charger tous appareils électroniques', priority: 'high' },
      { id: 'before-005', task: 'Faire le plein d\'essence', priority: 'high' },
      { id: 'before-006', task: 'Retirer argent liquide', priority: 'medium' },
      { id: 'before-007', task: 'Remplir baignoire (réserve eau)', priority: 'high' },
      { id: 'before-008', task: 'Localiser refuge le plus proche', priority: 'critical' },
      { id: 'before-009', task: 'Préparer sac évacuation', priority: 'critical' },
      { id: 'before-010', task: 'Informer proches/famille', priority: 'high' },
      { id: 'before-011', task: 'Éteindre gaz, disjoncteur (si évacuation)', priority: 'critical' }
    ],
    during: [
      { id: 'during-001', task: 'Rester à l\'intérieur', priority: 'critical' },
      { id: 'during-002', task: 'S\'éloigner des fenêtres', priority: 'critical' },
      { id: 'during-003', task: 'Se placer dans pièce sûre (sans fenêtres)', priority: 'critical' },
      { id: 'during-004', task: 'Écouter radio pour consignes', priority: 'critical' },
      { id: 'during-005', task: 'NE PAS sortir pendant l\'œil du cyclone', priority: 'critical' },
      { id: 'during-006', task: 'Économiser eau/nourriture/piles', priority: 'high' }
    ],
    after: [
      { id: 'after-001', task: 'Vérifier état de la maison', priority: 'high' },
      { id: 'after-002', task: 'Attention aux lignes électriques tombées', priority: 'critical' },
      { id: 'after-003', task: 'Ne pas boire eau du robinet (contamination possible)', priority: 'critical' },
      { id: 'after-004', task: 'Prendre photos des dégâts (assurance)', priority: 'high' },
      { id: 'after-005', task: 'Signaler personnes en détresse', priority: 'critical' },
      { id: 'after-006', task: 'Éviter déplacements inutiles', priority: 'medium' }
    ]
  };
}

/**
 * Reset all checklists
 */
export function resetAllChecklists(): void {
  localStorage.removeItem('checklist-before');
  localStorage.removeItem('checklist-during');
  localStorage.removeItem('checklist-after');
}

/**
 * Export checklist as text
 */
export function exportChecklistAsText(checklist: PreparednessChecklist): string {
  let text = `Checklist Préparation Cyclone - Phase: ${checklist.phase}\n`;
  text += `Score: ${checklist.score}%\n`;
  text += `Dernière mise à jour: ${new Date(checklist.lastUpdated).toLocaleDateString()}\n\n`;

  for (const item of checklist.items) {
    const status = item.completed ? '✓' : '☐';
    text += `${status} [${item.priority}] ${item.task}\n`;
  }

  return text;
}
