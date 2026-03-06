import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { appendFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

type RuntimeEvent = {
  type: 'console.error' | 'pageerror' | 'requestfailed' | 'http>=500';
  message: string;
};

const axeReportPath = resolve(process.cwd(), 'ux-axe-report.txt');
const strictMode = process.env.UX_AUDIT_STRICT === '1';

const eventsByTest = new Map<string, RuntimeEvent[]>();

function currentTestKey(titlePath: string[]): string {
  return titlePath.join(' > ');
}

test.beforeAll(() => {
  writeFileSync(
    axeReportPath,
    `UX/A11Y report for production audit\nMode: ${strictMode ? 'strict-blocking' : 'report-only'}\n\n`,
    'utf8',
  );
});

test.beforeEach(async ({ page }, testInfo) => {
  const key = currentTestKey(testInfo.titlePath);
  const events: RuntimeEvent[] = [];
  eventsByTest.set(key, events);

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      events.push({ type: 'console.error', message: msg.text() });
    }
  });

  page.on('pageerror', (error) => {
    events.push({ type: 'pageerror', message: error.message });
  });

  page.on('requestfailed', (request) => {
    events.push({
      type: 'requestfailed',
      message: `${request.method()} ${request.url()} (${request.failure()?.errorText ?? 'unknown'})`,
    });
  });

  page.on('response', (response) => {
    if (response.status() >= 500) {
      events.push({
        type: 'http>=500',
        message: `${response.status()} ${response.request().method()} ${response.url()}`,
      });
    }
  });
});

test.afterEach(async ({}, testInfo) => {
  const key = currentTestKey(testInfo.titlePath);
  const events = eventsByTest.get(key) ?? [];
  const text = events.map((event) => `${event.type}: ${event.message}`).join('\n');

  appendFileSync(
    axeReportPath,
    `[Runtime gate] ${key}\n${events.length ? text : 'OK'}\n\n`,
    'utf8',
  );

  if (strictMode) {
    expect(events, `Runtime errors detected in strict mode for ${key}`).toEqual([]);
  } else {
    expect.soft(events.length, `Runtime issues detected in report-only mode for ${key}`).toBe(0);
  }

  eventsByTest.delete(key);
});

test('HOME: renders without white screen and with visible H1', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  await expect(page.locator('body')).toBeVisible();
  await expect(page.locator('body')).not.toHaveText(/^\s*$/);
  await expect(page.locator('h1').first()).toBeVisible();
});

test('NAVIGATION SPA: comparateur route survives refresh and history', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const comparateurLink = page
    .locator('a')
    .filter({ hasText: /comparateur/i })
    .first();

  await expect(comparateurLink).toBeVisible();
  await comparateurLink.click();

  await expect(page).toHaveURL(/#\/comparateur/);
  await expect(page.locator('main')).toBeVisible();

  await page.reload();
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveURL(/#\/comparateur/);

  await page.goBack();
  await expect(page).toHaveURL(/#\/$|\/$/);

  await page.goForward();
  await expect(page).toHaveURL(/#\/comparateur/);
});

test('FORMULAIRE RECHERCHE: submit returns results or clean empty state', async ({ page }) => {
  await page.goto('/comparateur');
  await page.waitForLoadState('networkidle');

  const searchInput = page
    .locator('input[type="search"], input[placeholder*="recherche" i], input[name*="search" i], input[id*="search" i]')
    .first();

  await expect(searchInput).toBeVisible();
  await searchInput.fill('riz');
  await searchInput.press('Enter');
  await page.waitForTimeout(1200);

  const hasResults = (await page.locator('[data-testid*="result"], .result-item, article, li').count()) > 0;
  const hasEmptyState = await page
    .locator('text=/aucun résultat|aucun resultat|pas de résultat|pas de resultat|no results/i')
    .first()
    .isVisible()
    .catch(() => false);

  expect(
    hasResults || hasEmptyState,
    'Expected either search results or an explicit empty state after submit',
  ).toBeTruthy();
});

test('ACCESSIBILITÉ: axe scan home + comparateur with serious/critical gate only', async ({ page }) => {
  const pagesToAudit = [
    { name: 'home', url: '/' },
    { name: 'comparateur', url: '/comparateur' },
    { name: 'faq', url: '/faq' },
    { name: 'observatoire', url: '/observatoire' },
    { name: 'contact', url: '/contact' },
    { name: 'mentions-legales', url: '/mentions-legales' },
    { name: 'scanner', url: '/scanner' },
  ];

  for (const target of pagesToAudit) {
    await page.goto(target.url);
    await page.waitForLoadState('networkidle');

    const axeResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    const blockingViolations = axeResults.violations.filter((violation) =>
      ['serious', 'critical'].includes(violation.impact ?? ''),
    );

    appendFileSync(
      axeReportPath,
      `[AXE] ${target.name}\nviolations=${axeResults.violations.length}\nblocking=${blockingViolations.length}\n${blockingViolations
        .map((violation) => `- ${violation.impact} :: ${violation.id} :: ${violation.help}`)
        .join('\n') || 'No serious/critical violations'}\n\n`,
      'utf8',
    );

    if (strictMode) {
      expect(
        blockingViolations,
        `A11y serious/critical violations on ${target.name}: ${blockingViolations
          .map((v) => `${v.id} (${v.impact})`)
          .join(', ')}`,
      ).toEqual([]);
    } else {
      expect.soft(blockingViolations.length).toBe(0);
    }
  }
});

test('ACCESSIBILITÉ: page headings – chaque page a exactement un H1', async ({ page }) => {
  const pagesToCheck = [
    { name: 'home', url: '/' },
    { name: 'faq', url: '/faq' },
    { name: 'observatoire', url: '/observatoire' },
    { name: 'contact', url: '/contact' },
    { name: 'scanner', url: '/scanner' },
  ];

  for (const target of pagesToCheck) {
    await page.goto(target.url);
    await page.waitForLoadState('networkidle');

    const h1Count = await page.locator('h1').count();
    appendFileSync(axeReportPath, `[H1] ${target.name}: h1_count=${h1Count}\n`, 'utf8');

    if (strictMode) {
      expect(h1Count, `Expected exactly 1 <h1> on ${target.name}, found ${h1Count}`).toBe(1);
    } else {
      expect.soft(h1Count, `Expected exactly 1 <h1> on ${target.name}`).toBe(1);
    }
  }
});
