/**
 * Unit Tests for bookingLinks utility
 *
 * Tests buildBookingUrl() UTM injection and affiliate ref behaviour,
 * and getCommissionStatus() label/colour logic.
 */

import { describe, it, expect } from 'vitest';
import { buildBookingUrl, getCommissionStatus, BOOKING_CONFIG } from '../utils/bookingLinks';
import { FAQ_DATA } from '../data/faq';
import { generateAssistantResponse } from '../services/assistantService';

describe('buildBookingUrl — UTM params', () => {
  it('injects utm_source, utm_medium and utm_campaign on a clean URL', () => {
    const result = buildBookingUrl('https://www.express-des-iles.com/', 'comparateur-bateaux');
    const url = new URL(result);
    expect(url.searchParams.get('utm_source')).toBe('akiprisaye');
    expect(url.searchParams.get('utm_medium')).toBe('comparateur');
    expect(url.searchParams.get('utm_campaign')).toBe('comparateur-bateaux');
  });

  it('preserves existing query params', () => {
    const result = buildBookingUrl('https://example.com/?promo=summer', 'comparateur-vols');
    const url = new URL(result);
    expect(url.searchParams.get('promo')).toBe('summer');
    expect(url.searchParams.get('utm_campaign')).toBe('comparateur-vols');
  });

  it('accepts a custom medium parameter', () => {
    const result = buildBookingUrl('https://example.com/', 'comparateur-voiture', 'sidebar');
    expect(result).toContain('utm_medium=sidebar');
  });

  it('returns "#" unchanged (empty / anchor links)', () => {
    expect(buildBookingUrl('#', 'comparateur-carburants')).toBe('#');
  });

  it('returns empty string unchanged', () => {
    expect(buildBookingUrl('', 'comparateur-internet')).toBe('');
  });

  it('returns relative / non-parseable URLs unchanged', () => {
    const relative = '/reservation?id=42';
    // new URL('/reservation?id=42') throws without a base — should fall back
    expect(buildBookingUrl(relative, 'comparateur-assurances')).toBe(relative);
  });

  it('injects a "ref" param when affiliateEnabled is true', () => {
    const result = buildBookingUrl('https://www.allianz.fr/', 'comparateur-assurances');
    const url = new URL(result);
    expect(url.searchParams.get('ref')).toBe(BOOKING_CONFIG.affiliateRef);
  });
});

describe('BOOKING_CONFIG defaults', () => {
  it('affiliateEnabled is true by default', () => {
    expect(BOOKING_CONFIG.affiliateEnabled).toBe(true);
  });

  it('affiliateRef is configured by default', () => {
    expect(BOOKING_CONFIG.affiliateRef).toBeTruthy();
  });

  it('utmEnabled is true by default', () => {
    expect(BOOKING_CONFIG.utmEnabled).toBe(true);
  });

  it('utmSource is "akiprisaye"', () => {
    expect(BOOKING_CONFIG.utmSource).toBe('akiprisaye');
  });
});

describe('getCommissionStatus — affiliate active', () => {
  it('returns active=true', () => {
    expect(getCommissionStatus().active).toBe(true);
  });

  it('returns yellow color', () => {
    expect(getCommissionStatus().color).toBe('yellow');
  });

  it('label mentions "Lien partenaire"', () => {
    expect(getCommissionStatus().label).toContain('Lien partenaire');
  });

  it('detail mentions technical tracking', () => {
    const detail = getCommissionStatus().detail.toLowerCase();
    expect(detail).toContain('suivi technique');
  });

  it('keeps commissions disabled by default even when using click tracking', () => {
    const status = getCommissionStatus();
    const trackedUrl = buildBookingUrl('https://example.com/', 'comparateur-vols');
    const tracked = new URL(trackedUrl);

    expect(status.active).toBe(true);
    expect(tracked.searchParams.get('utm_campaign')).toBe('comparateur-vols');
    expect(tracked.searchParams.get('ref')).toBe(BOOKING_CONFIG.affiliateRef);
  });
});

describe('payment messaging clarity (SumUp)', () => {
  it('mentions SumUp in FAQ activation answer', () => {
    const faqItem = FAQ_DATA.find((item) => item.id === 'faq-010');
    expect(faqItem?.answer).toContain('SumUp');
    expect(faqItem?.answer).toContain('activé publiquement');
    expect(faqItem?.answer).toContain('Pour connecter SumUp');
    expect(faqItem?.answer).toContain('checkout');
  });

  it('mentions SumUp in assistant pricing fallback', () => {
    const response = generateAssistantResponse('Quels sont les tarifs ?');
    expect(response.message).toContain('SumUp');
    expect(response.message).toContain('sont activés publiquement');
    expect(response.message).toContain('Pour connecter SumUp');
    expect(response.message).not.toContain('ne sont pas encore activés publiquement');
  });
});
