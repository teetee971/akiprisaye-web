import { expect, test } from '@playwright/test';
import { createConsoleGate } from './utils/consoleGate';

test.describe('UX audit - functional critical journeys', () => {
  test('HOME charge sans erreurs console critiques', async ({ page }) => {
    const gate = createConsoleGate(page);

    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1, name: /comparez les prix réels/i })).toBeVisible();
    await expect(page.getByLabel(/rechercher un produit/i)).toBeVisible();

    gate.expectClean();
  });

  test('Navigation SPA + deep link + refresh restent fonctionnels', async ({ page }) => {
    const gate = createConsoleGate(page);

    await page.goto('/#/comparateur');
    await expect(page.getByRole('heading', { level: 1, name: /comparateur de prix/i })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('heading', { level: 1, name: /comparateur de prix/i })).toBeVisible();
    await expect(page.getByLabel(/code ean/i)).toBeVisible();

    gate.expectClean();
  });

  test('Flux de recherche: état utilisateur attendu (erreur validation / résultat)', async ({ page }) => {
    const gate = createConsoleGate(page);

    await page.goto('/#/comparateur');
    await page.getByRole('button', { name: /comparer les prix/i }).click();

    await expect(page.getByText(/veuillez entrer un code ean valide/i)).toBeVisible();

    await page.getByLabel(/code ean/i).fill('3017620422003');
    await page.getByRole('button', { name: /comparer les prix/i }).click();

    await expect(
      page.getByText(/résultat|meilleur prix|données en cours d'intégration/i).first(),
    ).toBeVisible({ timeout: 15000 });

    gate.expectClean();
  });
});
