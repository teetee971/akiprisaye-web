import { ensureDefaultSources } from './db';
import { getEnabledConnectorsForTerritory } from './connectors/registry';
import { selectEansToRefresh } from './fetch/selectors';
import { createJob, runJob } from './fetch/runner';
import { handleRequest } from './router';
import type { Env, Territory } from './types';

async function runScheduledFetch(env: Env, territory: Territory): Promise<void> {
  await ensureDefaultSources(env.PRICE_DB);
  const sourceId = getEnabledConnectorsForTerritory(territory)[0]?.id ?? 'backoffice';
  const eans = await selectEansToRefresh(env.PRICE_DB, 50);
  const jobId = await createJob(env, sourceId, territory);
  await runJob(env, jobId, { eans });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return handleRequest(request, env);
  },

  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    const territories: Territory[] = ['fr', 'gp', 'mq'];
    for (const territory of territories) {
      ctx.waitUntil(runScheduledFetch(env, territory));
    }
  },
};
