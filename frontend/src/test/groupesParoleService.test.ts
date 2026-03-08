import { describe, it, expect } from 'vitest';
import { moderateText } from '../utils/textModeration';

describe('groupesParoleService — moderateText', () => {
  it('returns null for clean messages', () => {
    expect(moderateText('La vie chère en Guadeloupe c\'est insupportable')).toBeNull();
    expect(moderateText('Bonjour à tous, comment allez-vous ?')).toBeNull();
    expect(moderateText('Les prix ont augmenté de 10% ce mois-ci')).toBeNull();
  });

  it('flags hate speech', () => {
    expect(moderateText('Tu es un nazi')).not.toBeNull();
    expect(moderateText('discours de haine envers les migrants')).not.toBeNull();
  });

  it('flags profanity', () => {
    expect(moderateText('Va te faire foutre espèce de connard')).not.toBeNull();
    expect(moderateText('cette situation est vraiment de la merde')).not.toBeNull();
  });

  it('flags spam patterns', () => {
    expect(moderateText('Achetez maintenant nos produits pas chers')).not.toBeNull();
  });

  it('is case-insensitive', () => {
    expect(moderateText('NAZI propaganda')).not.toBeNull();
    expect(moderateText('SPAM PROMO click ici')).not.toBeNull();
  });

  it('returns a non-empty string reason when flagging', () => {
    const reason = moderateText('espèce de connard!');
    expect(typeof reason).toBe('string');
    expect(reason!.length).toBeGreaterThan(0);
  });
});
