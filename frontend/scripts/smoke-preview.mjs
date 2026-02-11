import { spawn } from 'node:child_process';

const PREVIEW_URL = 'http://127.0.0.1:4173';
const READY_TOKEN = 'Local:';
const ROUTES = ['/', '/login', '/comparateur'];
const ADD_CRASH_FRAGMENT = "Cannot read properties of undefined (reading 'add')";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForPreviewReady(proc, timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error(`Vite preview did not become ready within ${timeoutMs}ms.`));
    }, timeoutMs);

    const onData = (chunk) => {
      const text = chunk.toString();
      if (text.includes(READY_TOKEN)) {
        cleanup();
        resolve();
      }
    };

    const onExit = (code) => {
      cleanup();
      reject(new Error(`Vite preview exited before readiness (code=${code ?? 'null'}).`));
    };

    const cleanup = () => {
      clearTimeout(timeout);
      proc.stdout?.off('data', onData);
      proc.stderr?.off('data', onData);
      proc.off('exit', onExit);
    };

    proc.stdout?.on('data', onData);
    proc.stderr?.on('data', onData);
    proc.on('exit', onExit);
  });
}

async function assertRootHtml() {
  const response = await fetch(`${PREVIEW_URL}/`);
  if (!response.ok) {
    throw new Error(`Home route request failed with HTTP ${response.status}.`);
  }

  const html = await response.text();
  if (!html.includes('id="root"')) {
    throw new Error('Smoke check failed: #root container missing from preview HTML response.');
  }

  return html;
}

async function runBrowserSmoke() {
  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    console.warn('[smoke-preview] WARN: playwright not installed, skipping browser runtime checks.');
    return;
  }

  let browser;
  try {
    browser = await chromium.launch();
  } catch (error) {
    console.warn(`[smoke-preview] WARN: unable to launch browser, skipping runtime checks (${error instanceof Error ? error.message : String(error)}).`);
    return;
  }
  const page = await browser.new_page({ viewport: { width: 390, height: 844 } });
  const runtimeErrors = [];

  page.on('console', (msg) => {
    const text = msg.text();
    if (msg.type() === 'error' || text.includes(ADD_CRASH_FRAGMENT)) {
      runtimeErrors.push(`[console:${msg.type()}] ${text}`);
    }
  });

  page.on('pageerror', (error) => {
    runtimeErrors.push(`[pageerror] ${String(error)}`);
  });

  for (const route of ROUTES) {
    await page.goto(`${PREVIEW_URL}${route}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);
  }

  await browser.close();

  const addCrash = runtimeErrors.find((entry) => entry.includes(ADD_CRASH_FRAGMENT));
  if (addCrash) {
    throw new Error(`Detected runtime add-crash: ${addCrash}`);
  }

  if (runtimeErrors.length > 0) {
    throw new Error(`Detected runtime errors:\n${runtimeErrors.join('\n')}`);
  }
}

async function runSmoke() {
  const preview = spawn(
    process.platform === 'win32' ? 'npm.cmd' : 'npm',
    ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4173', '--strictPort'],
    { stdio: ['ignore', 'pipe', 'pipe'], env: process.env, detached: process.platform !== 'win32' }
  );

  preview.stdout.on('data', (chunk) => process.stdout.write(chunk));
  preview.stderr.on('data', (chunk) => process.stderr.write(chunk));

  try {
    await waitForPreviewReady(preview);
    const html = await assertRootHtml();

    if (!html.includes('/assets/index-')) {
      throw new Error('Smoke check failed: unable to detect main index asset in HTML.');
    }

    await runBrowserSmoke();
    console.log('[smoke-preview] OK: routes loaded without runtime add-crash.');
  } finally {
    if (process.platform !== 'win32') {
      process.kill(-preview.pid, 'SIGTERM');
    } else {
      preview.kill('SIGTERM');
    }
    await wait(500);
    if (!preview.killed) {
      if (process.platform !== 'win32') {
        process.kill(-preview.pid, 'SIGKILL');
      } else {
        preview.kill('SIGKILL');
      }
    }
  }
}

runSmoke().catch((error) => {
  console.error('[smoke-preview] FAILED:', error instanceof Error ? error.message : error);
  process.exit(1);
});
