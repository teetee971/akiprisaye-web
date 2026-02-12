import { test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createConsoleGate } from './utils/consoleGate';

const strictMode = process.env.AXE_STRICT === '1';

test.describe('A11y audit (axe-core)', () => {
  for (const route of ['/', '/#/comparateur']) {
    test(`axe scan ${route}`, async ({ page }) => {
      const gate = createConsoleGate(page);

      await page.goto(route);
      const results = await new AxeBuilder({ page }).analyze();

      const summary = results.violations
        .map((violation) => `${violation.id}: ${violation.help} (${violation.nodes.length} nodes)`)
        .join('\n');

      if (results.violations.length > 0 && !strictMode) {
        test.info().annotations.push({
          type: 'warning',
          description: `Axe violations (non bloquant): ${summary}`,
        });
        console.warn(`⚠️ Axe violations (warning only) on ${route}:\n${summary}`);
      }

      if (strictMode && results.violations.length > 0) {
        throw new Error(`Axe violations (strict mode) on ${route}:\n${summary}`);
      }

      gate.expectClean();
    });
  }
});
