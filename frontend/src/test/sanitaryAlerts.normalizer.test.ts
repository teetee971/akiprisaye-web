import { describe, expect, it } from 'vitest';
import { normalizeRappelConsoAlert } from '../services/sanitaryAlertsNormalizer';

describe('normalizeRappelConsoAlert', () => {
  it('maps minimal fields and severity rules', () => {
    const normalized = normalizeRappelConsoAlert({
      reference_fiche: 'F-123',
      titre_rappel: 'Rappel produit',
      marque_produit: 'Marque X',
      noms_des_modeles_ou_references: 'Lait infantile',
      categorie_de_produit: 'Alimentation',
      risques_encourus_par_le_consommateur: 'Risque de listeria',
      date_de_publication: '2026-02-12T00:00:00Z',
      lien_vers_la_fiche_rappel: 'https://rappel.conso.gouv.fr/fiche/123',
      zones_geographiques_de_vente: ['Guadeloupe', 'Martinique'],
    });

    expect(normalized.id).toBe('F-123');
    expect(normalized.riskLevel).toBe('critical');
    expect(normalized.severity).toBe('critical');
    expect(normalized.territories).toEqual(['gp', 'mq']);
    expect(normalized.sourceUrl).toContain('rappel.conso.gouv.fr');
  });
});
