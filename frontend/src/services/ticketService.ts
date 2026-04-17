import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
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

function generateTicketNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  return `TKT-${year}${month}${day}-${random}`;
}

class TicketService {
  async createTicket(data: CreateTicketData): Promise<Ticket> {
    const ticketNumber = generateTicketNumber();
    const now = new Date();
    const ticket: Ticket = {
      id: ticketNumber,
      ticketNumber,
      type: data.type,
      status: 'open',
      priority: 'medium',
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
      isPublic: false,
      isResolved: false,
      needsResponse: true,
    };
    if (db) {
      const ref = await addDoc(collection(db, 'tickets'), {
        ...ticket,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      ticket.id = ref.id;
    }
    return ticket;
  }

  async getTicket(ticketId: string): Promise<Ticket | null> {
    if (!db) return null;
    const snap = await getDoc(doc(db, 'tickets', ticketId));
    return snap.exists() ? ({ ...snap.data(), id: snap.id } as Ticket) : null;
  }

  async listTickets(filters?: TicketFilters): Promise<Ticket[]> {
    if (!db) return [];
    let q = query(collection(db, 'tickets'), orderBy('createdAt', 'desc'), limit(200));
    if (filters?.type)
      q = query(
        collection(db, 'tickets'),
        where('type', '==', filters.type),
        orderBy('createdAt', 'desc')
      );
    if (filters?.status)
      q = query(
        collection(db, 'tickets'),
        where('status', '==', filters.status),
        orderBy('createdAt', 'desc')
      );
    if (filters?.isPublic !== undefined)
      q = query(
        collection(db, 'tickets'),
        where('isPublic', '==', filters.isPublic),
        orderBy('createdAt', 'desc')
      );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ ...d.data(), id: d.id }) as Ticket);
  }

  async updateTicket(
    ticketId: string,
    updates: UpdateTicketData,
    adminId?: string
  ): Promise<Ticket | null> {
    if (!db) return null;
    const ref = doc(db, 'tickets', ticketId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const ticket = { ...snap.data(), id: snap.id } as Ticket;
    const now = new Date();
    const updatedFields: Partial<Ticket> = { ...updates, updatedAt: now };
    if (updates.status && updates.status !== ticket.status) {
      const change: TicketStatusChange = {
        from: ticket.status,
        to: updates.status,
        changedAt: now,
        changedBy: adminId,
      };
      updatedFields.statusHistory = [...(ticket.statusHistory ?? []), change];
      if (updates.status === 'resolved' || updates.status === 'closed') {
        updatedFields.isResolved = true;
        updatedFields.resolvedAt = now;
      }
    }
    await updateDoc(ref, { ...updatedFields, updatedAt: serverTimestamp() });
    return { ...ticket, ...updatedFields };
  }

  async deleteTicket(ticketId: string): Promise<boolean> {
    if (!db) return false;
    await deleteDoc(doc(db, 'tickets', ticketId));
    return true;
  }

  async getUserTickets(userEmail: string): Promise<Ticket[]> {
    if (!db) return [];
    const q = query(
      collection(db, 'tickets'),
      where('userEmail', '==', userEmail),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ ...d.data(), id: d.id }) as Ticket);
  }

  async getPublicTickets(lim = 50): Promise<Ticket[]> {
    if (!db) return [];
    const q = query(
      collection(db, 'tickets'),
      where('isPublic', '==', true),
      orderBy('createdAt', 'desc'),
      limit(lim)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ ...d.data(), id: d.id }) as Ticket);
  }

  async getTicketStats() {
    const tickets = await this.listTickets();
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
      byPriority: { low: 0, medium: 0, high: 0, urgent: 0 } as Record<TicketPriority, number>,
    };
    tickets.forEach((t) => {
      stats.byStatus[t.status]++;
      stats.byType[t.type]++;
      stats.byPriority[t.priority]++;
    });
    return stats;
  }
}

export const ticketService = new TicketService();
export default ticketService;
