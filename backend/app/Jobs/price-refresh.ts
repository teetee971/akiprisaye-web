/**
 * price-refresh.ts — Scheduled price-refresh job (node-cron)
 *
 * Runs every day at 2 AM UTC to collect fresh price observations from the
 * Open Prices API (prices.openfoodfacts.org) via the platform's typed
 * scraper layer (backend/src/scrapers/).
 *
 * Usage (standalone):
 *   npx tsx backend/app/Jobs/price-refresh.ts
 *
 * Integration with SyncScheduler (backend/src/services/scheduler/syncScheduler.ts):
 *   The SyncScheduler already schedules syncOpenPricesJob every 6 hours.
 *   This file exists as an alternative entry-point for a daily full-run and
 *   can be wired to the scheduler with:
 *     this.registerJob({ id: 'price:refresh', cron: '0 2 * * *', handler: runPriceRefreshJob })
 */

import { CarrefourScraper } from '../../src/scrapers/carrefour.scraper.js';
import { LeclercScraper }   from '../../src/scrapers/leclerc.scraper.js';
import { SuperUScraper }    from '../../src/scrapers/superu.scraper.js';
import type { ScrapeResult } from '../../src/scrapers/base.scraper.js';

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Notify on job failure via SendGrid (if configured) or console fallback. */
async function notifyAdmin(jobName: string, error: unknown): Promise<void> {
  const msg = error instanceof Error ? error.message : String(error);
  console.error(`[CRON][${jobName}] ⚠️  Admin notification: job failed — ${msg}`);

  const apiKey = process.env.SENDGRID_API_KEY;
  const adminEmail = process.env.ADMIN_ALERT_EMAIL;
  const fromEmail = process.env.FROM_EMAIL ?? 'noreply@akiprisaye.fr';

  if (!apiKey || !adminEmail) {
    return;
  }

  try {
    const body = JSON.stringify({
      personalizations: [{ to: [{ email: adminEmail }] }],
      from: { email: fromEmail },
      subject: `[AkiPriSaYé] 🚨 Cron job failed: ${jobName}`,
      content: [
        {
          type: 'text/plain',
          value: `Le job cron "${jobName}" a échoué.\n\nErreur : ${msg}\n\nHeure : ${new Date().toISOString()}`,
        },
      ],
    });

    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body,
    });

    if (!res.ok) {
      console.error(`[CRON][${jobName}] Alert email failed: HTTP ${res.status}`);
    }
  } catch (sendErr) {
    console.error(`[CRON][${jobName}] Could not send alert email:`, sendErr);
  }
}

// ── Main job function ──────────────────────────────────────────────────────────

/**
 * Run a full price-refresh cycle across all configured DOM-TOM retailer scrapers.
 *
 * @returns Summary counts and any collected errors.
 */
export async function runPriceRefreshJob(): Promise<{
  success: boolean;
  totalObservations: number;
  totalErrors: number;
  results: Record<string, { observations: number; errors: string[] }>;
  error?: string;
}> {
  console.info('[CRON][price-refresh] Started at', new Date().toISOString());

  const scrapers = [
    new CarrefourScraper(),
    new LeclercScraper(),
    new SuperUScraper(),
  ];

  const summary: Record<string, { observations: number; errors: string[] }> = {};
  let totalObservations = 0;
  let totalErrors = 0;

  try {
    // Run all scrapers in sequence (each already includes polite rate-limiting)
    for (const scraper of scrapers) {
      let result: ScrapeResult;
      try {
        result = await scraper.fetch();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[CRON][price-refresh] ${scraper.retailer} — unexpected error: ${msg}`);
        summary[scraper.retailer] = { observations: 0, errors: [msg] };
        totalErrors += 1;
        continue;
      }

      summary[scraper.retailer] = {
        observations: result.observations.length,
        errors: result.errors,
      };
      totalObservations += result.observations.length;
      totalErrors += result.errors.length;

      console.info(
        `[CRON][price-refresh] ${scraper.retailer} — ` +
        `${result.observations.length} observations, ${result.errors.length} errors`,
      );

      if (result.errors.length > 0) {
        result.errors.slice(0, 3).forEach((e) =>
          console.warn(`  ⚠️  ${e}`),
        );
      }
    }

    console.info(
      `[CRON][price-refresh] Completed — ${totalObservations} observations total, ` +
      `${totalErrors} errors`,
    );

    return { success: true, totalObservations, totalErrors, results: summary };

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[CRON][price-refresh] Fatal error:', msg);
    await notifyAdmin('price-refresh', err);
    return { success: false, totalObservations, totalErrors, results: summary, error: msg };
  }
}

// ── Standalone entry-point ─────────────────────────────────────────────────────

// When executed directly (e.g. `node price-refresh.js` or `tsx price-refresh.ts`),
// run the job immediately and exit.
const isMain =
  typeof import.meta.url === 'string' &&
  process.argv[1] != null &&
  new URL(import.meta.url).pathname === new URL(process.argv[1], 'file://').pathname;

if (isMain) {
  runPriceRefreshJob()
    .then((r) => {
      console.info('[CRON][price-refresh] Done:', r);
      process.exit(r.success ? 0 : 1);
    })
    .catch((err) => {
      console.error('[CRON][price-refresh] Uncaught error:', err);
      process.exit(1);
    });
}

