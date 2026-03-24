import { describe, it, expect } from 'vitest';
import { generateAssistantResponse } from '../services/assistantService';

describe('assistantService', () => {
  it('classe une requête revenus/financier dans le flux pricing avec disclaimer financier', () => {
    const response = generateAssistantResponse('Dis-moi ce que j\'ai pour les revenus. Financier');

    expect(response.message).toContain('A KI PRI SA YÉ propose plusieurs niveaux d\'accès');
    expect(response.sources).toContain('Grille tarifaire v1.6.1');
    expect(response.disclaimer).toBe(
      '⚠️ A KI PRI SA YÉ ne fournit aucun conseil financier. Consultez un conseiller agréé.'
    );
  });
});
