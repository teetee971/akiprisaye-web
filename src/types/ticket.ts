/**
 * Ticket System Types
 * 
 * Système de tickets pour les suggestions, demandes et signalements utilisateurs
 * Conforme à la méthodologie de transparence et traçabilité
 */

export type TicketType = 
  | 'suggestion'        // Suggestion d'amélioration
  | 'feature_request'   // Demande de nouvelle fonctionnalité
  | 'bug_report'        // Signalement de problème technique
  | 'data_quality'      // Signalement d'erreur de données
  | 'question'          // Question / Support
  | 'other';            // Autre

export type TicketStatus =
  | 'open'              // Nouveau ticket
  | 'in_progress'       // En cours de traitement
  | 'under_review'      // En cours d'analyse
  | 'resolved'          // Résolu
  | 'closed'            // Fermé
  | 'duplicate';        // Doublon

export type TicketPriority =
  | 'low'               // Basse
  | 'medium'            // Moyenne
  | 'high'              // Haute
  | 'urgent';           // Urgente

export interface Ticket {
  id: string;                     // Identifiant unique (ex: TKT-20260114-001)
  ticketNumber: string;           // Numéro de ticket formaté pour l'utilisateur
  type: TicketType;
  status: TicketStatus;
  priority: TicketPriority;
  
  // Contenu
  title: string;                  // Titre court
  description: string;            // Description détaillée
  category?: string;              // Catégorie optionnelle (énergie, télécoms, etc.)
  
  // Métadonnées utilisateur
  userEmail?: string;             // Email (optionnel)
  userName?: string;              // Nom (optionnel)
  userId?: string;                // ID utilisateur Firebase (si authentifié)
  
  // Métadonnées système
  createdAt: Date;                // Date de création
  updatedAt: Date;                // Dernière mise à jour
  resolvedAt?: Date;              // Date de résolution
  
  // Suivi
  statusHistory: TicketStatusChange[];  // Historique des changements de statut
  adminNotes?: string;            // Notes internes (non visibles par l'utilisateur)
  responseMessage?: string;       // Message de réponse visible par l'utilisateur
  
  // Données additionnelles
  attachments?: string[];         // URLs des pièces jointes
  relatedUrl?: string;            // URL de la page concernée
  browserInfo?: string;           // Info navigateur (pour bug reports)
  
  // Flags
  isPublic: boolean;              // Visible par tous les utilisateurs
  isResolved: boolean;            // Résolu ou non
  needsResponse: boolean;         // Nécessite une réponse
}

export interface TicketStatusChange {
  from: TicketStatus;
  to: TicketStatus;
  changedAt: Date;
  changedBy?: string;             // ID de l'admin qui a fait le changement
  note?: string;                  // Note optionnelle sur le changement
}

export interface CreateTicketData {
  type: TicketType;
  title: string;
  description: string;
  category?: string;
  userEmail?: string;
  userName?: string;
  relatedUrl?: string;
}

export interface UpdateTicketData {
  status?: TicketStatus;
  priority?: TicketPriority;
  adminNotes?: string;
  responseMessage?: string;
  isPublic?: boolean;
}

export interface TicketFilters {
  type?: TicketType;
  status?: TicketStatus;
  priority?: TicketPriority;
  userId?: string;
  userEmail?: string;
  category?: string;
  isPublic?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
}

export const TICKET_TYPE_LABELS: Record<TicketType, string> = {
  suggestion: 'Suggestion',
  feature_request: 'Demande de fonctionnalité',
  bug_report: 'Problème technique',
  data_quality: 'Qualité des données',
  question: 'Question',
  other: 'Autre',
};

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  open: 'Ouvert',
  in_progress: 'En cours',
  under_review: 'En analyse',
  resolved: 'Résolu',
  closed: 'Fermé',
  duplicate: 'Doublon',
};

export const TICKET_PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: 'Basse',
  medium: 'Moyenne',
  high: 'Haute',
  urgent: 'Urgente',
};

export const TICKET_CATEGORY_OPTIONS = [
  'Énergie (Électricité)',
  'Énergie (Eau)',
  'Télécoms (Internet)',
  'Télécoms (Mobile)',
  'Transport (Avions)',
  'Transport (Bateaux)',
  'Produits alimentaires',
  'Scanner / OCR',
  'Carte interactive',
  'Comparateurs',
  'Observatoire',
  'Général',
];
