/**
 * Service — Facturation Marketplace Enseignes v1.0.0
 *
 * Gestion des abonnements, factures et TVA.
 * ❌ Pas de freemium — tous les plans sont payants.
 *
 * TVA DOM : 8,5%
 * TVA métropole : 20%
 */

import { safeLocalStorage } from '../utils/safeLocalStorage';
import type { MerchantInvoice, InvoiceStatus, MarketplacePlan } from '../types/merchant';
import { MARKETPLACE_PLANS } from './merchantService';

// ─── Clés localStorage ───────────────────────────────────────────────────────

const KEY_INVOICES = 'akiprisaye_marketplace_invoices';

// ─── Taux TVA par territoire ──────────────────────────────────────────────────

/** Taux de TVA applicable selon le territoire (DOM = 8,5%, Metro = 20%). */
export function getTvaRate(territoire: string): number {
  const domCodes = ['gp', 'mq', 'gf', 're', 'yt', 'mf', 'bl', 'pm', 'pf', 'nc', 'wf'];
  return domCodes.includes(territoire.toLowerCase()) ? 8.5 : 20;
}

// ─── Numérotation des factures ────────────────────────────────────────────────

function generateInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const all = safeLocalStorage.getJSON<MerchantInvoice[]>(KEY_INVOICES, []);
  const seq = String(all.length + 1).padStart(5, '0');
  return `MKT-${year}-${seq}`;
}

// ─── CRUD Factures ─────────────────────────────────────────────────────────────

function loadInvoices(): MerchantInvoice[] {
  return safeLocalStorage.getJSON<MerchantInvoice[]>(KEY_INVOICES, []);
}

function saveInvoices(list: MerchantInvoice[]): void {
  safeLocalStorage.setJSON(KEY_INVOICES, list);
}

/** Récupère toutes les factures d'une enseigne. */
export function getMerchantInvoices(merchantId: string): MerchantInvoice[] {
  return loadInvoices()
    .filter((i) => i.merchantId === merchantId)
    .sort((a, b) => new Date(b.dateEmission).getTime() - new Date(a.dateEmission).getTime());
}

/**
 * Génère une facture pour un abonnement.
 * La date d'échéance est J+30 pour mensuel, J+365 pour annuel.
 */
export function generateSubscriptionInvoice(
  merchantId: string,
  plan: MarketplacePlan,
  billingCycle: 'monthly' | 'annual',
  territoire: string
): MerchantInvoice {
  const planDetails = MARKETPLACE_PLANS.find((p) => p.id === plan);
  if (!planDetails) throw new Error(`Plan inconnu : ${plan}`);

  const montantHT = billingCycle === 'annual' ? planDetails.priceAnnual : planDetails.priceMonthly;
  const tvaRate = getTvaRate(territoire);
  const montantTTC = parseFloat((montantHT * (1 + tvaRate / 100)).toFixed(2));

  const now = new Date();
  const echeance = new Date(now);
  echeance.setDate(echeance.getDate() + (billingCycle === 'annual' ? 365 : 30));

  const invoice: MerchantInvoice = {
    id: `inv_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    merchantId,
    numero: generateInvoiceNumber(),
    montantHT,
    tvaRate,
    montantTTC,
    description: `Abonnement Marketplace ${planDetails.label} — ${billingCycle === 'annual' ? 'Annuel' : 'Mensuel'}`,
    status: 'pending',
    dateEmission: now.toISOString(),
    dateEcheance: echeance.toISOString(),
    createdAt: now.toISOString(),
  };

  const list = loadInvoices();
  list.push(invoice);
  saveInvoices(list);
  return invoice;
}

/** Marque une facture comme payée. */
export function markInvoicePaid(invoiceId: string): MerchantInvoice | null {
  const list = loadInvoices();
  const idx = list.findIndex((i) => i.id === invoiceId);
  if (idx === -1) return null;

  list[idx] = {
    ...list[idx],
    status: 'paid' as InvoiceStatus,
    datePaiement: new Date().toISOString(),
  };
  saveInvoices(list);
  return list[idx];
}

/** Annule une facture (résiliation). */
export function cancelInvoice(invoiceId: string): MerchantInvoice | null {
  const list = loadInvoices();
  const idx = list.findIndex((i) => i.id === invoiceId);
  if (idx === -1) return null;

  list[idx] = { ...list[idx], status: 'cancelled' as InvoiceStatus };
  saveInvoices(list);
  return list[idx];
}

/**
 * Calcule le montant total des factures payées pour une enseigne.
 * Utile pour le tableau de bord admin (chiffre d'affaires).
 */
export function getTotalRevenue(merchantId?: string): number {
  const list = loadInvoices().filter((i) => i.status === 'paid');
  const filtered = merchantId ? list.filter((i) => i.merchantId === merchantId) : list;
  return parseFloat(filtered.reduce((sum, i) => sum + i.montantTTC, 0).toFixed(2));
}

/**
 * Détermine si un abonnement est actif (dernière facture payée non expirée).
 */
export function isSubscriptionActive(merchantId: string): boolean {
  const invoices = getMerchantInvoices(merchantId).filter((i) => i.status === 'paid');
  if (invoices.length === 0) return false;
  const latest = invoices[0];
  return new Date(latest.dateEcheance) > new Date();
}
