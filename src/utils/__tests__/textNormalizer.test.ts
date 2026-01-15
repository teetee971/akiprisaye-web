/**
 * Text Normalizer Tests
 * Part of PR D - Text-based Product Recognition
 * 
 * Node-safe tests only (no browser APIs)
 */

import { describe, it, expect } from 'vitest';
import { normalizeText } from '../textNormalizer';

describe('normalizeText', () => {
  it('should convert text to uppercase', () => {
    expect(normalizeText('hello world')).toBe('HELLO WORLD');
    expect(normalizeText('Coca-Cola')).toBe('COCA COLA');
  });

  it('should remove special characters except allowed ones', () => {
    expect(normalizeText('Hello@World!')).toBe('HELLO WORLD');
    expect(normalizeText('Test#123$')).toBe('TEST 123');
  });

  it('should preserve numbers', () => {
    expect(normalizeText('Product 123')).toBe('PRODUCT 123');
    expect(normalizeText('Eau 1.5L')).toBe('EAU 1.5L');
  });

  it('should preserve euro symbol', () => {
    expect(normalizeText('Prix 5.99€')).toBe('PRIX 5.99€');
    expect(normalizeText('3,50 €')).toBe('3,50 €');
  });

  it('should preserve dots and commas', () => {
    expect(normalizeText('1.5L')).toBe('1.5L');
    expect(normalizeText('3,50')).toBe('3,50');
  });

  it('should normalize multiple spaces to single space', () => {
    expect(normalizeText('Hello    World')).toBe('HELLO WORLD');
    expect(normalizeText('Test  \n  Data')).toBe('TEST DATA');
  });

  it('should trim leading and trailing whitespace', () => {
    expect(normalizeText('  Hello World  ')).toBe('HELLO WORLD');
    expect(normalizeText('\n\tTest\n\t')).toBe('TEST');
  });

  it('should handle empty string', () => {
    expect(normalizeText('')).toBe('');
  });

  it('should handle OCR-like text with product information', () => {
    const ocrText = 'NUTELLA 750g\nPrix: 5.99€\nPâte à tartiner';
    const normalized = normalizeText(ocrText);
    // Accented characters are removed, creating extra spaces that get normalized
    expect(normalized).toBe('NUTELLA 750G PRIX 5.99€ P TE TARTINER');
  });

  it('should handle text with various separators', () => {
    expect(normalizeText('Coca-Cola/330ml|1.50€')).toBe('COCA COLA 330ML 1.50€');
  });

  it('should handle accented characters', () => {
    // Accented characters are removed as they're not in the allowed set
    expect(normalizeText('Pâté de campagne')).toBe('P T DE CAMPAGNE');
  });

  it('should be idempotent', () => {
    const text = 'Hello World 123';
    const normalized = normalizeText(text);
    expect(normalizeText(normalized)).toBe(normalized);
  });

  it('should handle real product examples', () => {
    expect(normalizeText('EVIAN 1.5L')).toBe('EVIAN 1.5L');
    expect(normalizeText('Riz Basmati 1kg - 2,50€')).toBe('RIZ BASMATI 1KG 2,50€');
    expect(normalizeText('Lait UHT Demi-écrémé 1L')).toBe('LAIT UHT DEMI CR M 1L');
  });
});
