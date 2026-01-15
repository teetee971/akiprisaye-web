/**
 * Ticket Service
 * 
 * Service de gestion des tickets de suggestions, demandes et signalements
 * Conforme aux principes de transparence et traçabilité
 * 
 * IMPORTANT:
 * - Stockage Firebase Firestore
 * - Génération d'ID unique
 * - Historique complet des changements
 * - Respect RGPD (email optionnel)
 */

import type {
  Ticket,
  TicketType,
  TicketStatus,
  TicketPriority,
  CreateTicketData,
  UpdateTicketData,
  TicketFilters,
  TicketStatusChange,
} from '../types/ticket';

/**
 * Génère un numéro de ticket unique
 * Format: TKT-YYYYMMDD-XXX
 */
function generateTicketNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  
  return `TKT-${year}${month}${day}-${random}`;
}

/**
 * Service de gestion des tickets
 */
class TicketService {
  // Stockage en mémoire pour la démo (à remplacer par Firebase)
  private tickets: Map<string, Ticket> = new Map();

  /**
   * Crée un nouveau ticket
   */
  async createTicket(data: CreateTicketData): Promise<Ticket> {
    const ticketNumber = generateTicketNumber();
    const now = new Date();

    const ticket: Ticket = {
      id: ticketNumber,
      ticketNumber: ticketNumber,
      type: data.type,
      status: 'open',
      priority: 'medium', // Par défaut
      title: data.title,
      description: data.description,
      category: data.category,
      userEmail: data.userEmail,
      userName: data.userName,
      relatedUrl: data.relatedUrl,
      createdAt: now,
      updatedAt: now,
      statusHistory: [
        {
          from: 'open' as TicketStatus,
          to: 'open' as TicketStatus,
          changedAt: now,
          note: 'Ticket créé',
        },
      ],
      isPublic: false, // Par défaut non public
      isResolved: false,
      needsResponse: true,
    };

    // Stocker le ticket
    this.tickets.set(ticket.id, ticket);

    // Dans une vraie implémentation Firebase:
    // await addDoc(collection(db, 'tickets'), ticket);

    return ticket;
  }

  /**
   * Récupère un ticket par son ID
   */
  async getTicket(ticketId: string): Promise<Ticket | null> {
    const ticket = this.tickets.get(ticketId);
    return ticket || null;

    // Firebase:
    // const docRef = doc(db, 'tickets', ticketId);
    // const docSnap = await getDoc(docRef);
    // return docSnap.exists() ? docSnap.data() as Ticket : null;
  }

  /**
   * Liste les tickets avec filtres
   */
  async listTickets(filters?: TicketFilters): Promise<Ticket[]> {
    let tickets = Array.from(this.tickets.values());

    // Appliquer les filtres
    if (filters) {
      if (filters.type) {
        tickets = tickets.filter(t => t.type === filters.type);
      }
      if (filters.status) {
        tickets = tickets.filter(t => t.status === filters.status);
      }
      if (filters.priority) {
        tickets = tickets.filter(t => t.priority === filters.priority);
      }
      if (filters.userId) {
        tickets = tickets.filter(t => t.userId === filters.userId);
      }
      if (filters.userEmail) {
        tickets = tickets.filter(t => t.userEmail === filters.userEmail);
      }
      if (filters.category) {
        tickets = tickets.filter(t => t.category === filters.category);
      }
      if (filters.isPublic !== undefined) {
        tickets = tickets.filter(t => t.isPublic === filters.isPublic);
      }
      if (filters.dateFrom) {
        tickets = tickets.filter(t => t.createdAt >= filters.dateFrom!);
      }
      if (filters.dateTo) {
        tickets = tickets.filter(t => t.createdAt <= filters.dateTo!);
      }
    }

    // Trier par date de création (plus récent en premier)
    tickets.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return tickets;

    // Firebase:
    // let q = query(collection(db, 'tickets'));
    // if (filters?.type) q = query(q, where('type', '==', filters.type));
    // ... etc
    // const snapshot = await getDocs(q);
    // return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Ticket));
  }

  /**
   * Met à jour un ticket (admin uniquement)
   */
  async updateTicket(
    ticketId: string,
    updates: UpdateTicketData,
    adminId?: string
  ): Promise<Ticket | null> {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) return null;

    const now = new Date();
    const updatedTicket: Ticket = {
      ...ticket,
      ...updates,
      updatedAt: now,
    };

    // Si changement de statut, ajouter à l'historique
    if (updates.status && updates.status !== ticket.status) {
      const statusChange: TicketStatusChange = {
        from: ticket.status,
        to: updates.status,
        changedAt: now,
        changedBy: adminId,
      };
      updatedTicket.statusHistory = [...ticket.statusHistory, statusChange];

      // Marquer comme résolu si statut = resolved ou closed
      if (updates.status === 'resolved' || updates.status === 'closed') {
        updatedTicket.isResolved = true;
        updatedTicket.resolvedAt = now;
      }
    }

    this.tickets.set(ticketId, updatedTicket);

    // Firebase:
    // await updateDoc(doc(db, 'tickets', ticketId), updates);

    return updatedTicket;
  }

  /**
   * Supprime un ticket (admin uniquement, rarement utilisé)
   */
  async deleteTicket(ticketId: string): Promise<boolean> {
    const deleted = this.tickets.delete(ticketId);

    // Firebase:
    // await deleteDoc(doc(db, 'tickets', ticketId));

    return deleted;
  }

  /**
   * Récupère les tickets d'un utilisateur par email
   */
  async getUserTickets(userEmail: string): Promise<Ticket[]> {
    return this.listTickets({ userEmail });
  }

  /**
   * Récupère les tickets publics (pour affichage général)
   */
  async getPublicTickets(limit: number = 50): Promise<Ticket[]> {
    const tickets = await this.listTickets({ isPublic: true });
    return tickets.slice(0, limit);
  }

  /**
   * Statistiques des tickets
   */
  async getTicketStats(): Promise<{
    total: number;
    byStatus: Record<TicketStatus, number>;
    byType: Record<TicketType, number>;
    byPriority: Record<TicketPriority, number>;
  }> {
    const tickets = Array.from(this.tickets.values());

    const stats = {
      total: tickets.length,
      byStatus: {
        open: 0,
        in_progress: 0,
        under_review: 0,
        resolved: 0,
        closed: 0,
        duplicate: 0,
      } as Record<TicketStatus, number>,
      byType: {
        suggestion: 0,
        feature_request: 0,
        bug_report: 0,
        data_quality: 0,
        question: 0,
        other: 0,
      } as Record<TicketType, number>,
      byPriority: {
        low: 0,
        medium: 0,
        high: 0,
        urgent: 0,
      } as Record<TicketPriority, number>,
    };

    tickets.forEach(ticket => {
      stats.byStatus[ticket.status]++;
      stats.byType[ticket.type]++;
      stats.byPriority[ticket.priority]++;
    });

    return stats;
  }
}

// Instance singleton
export const ticketService = new TicketService();

// Export par défaut
export default ticketService;
