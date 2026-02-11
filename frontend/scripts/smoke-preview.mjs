import { spawn } from 'node:child_process';

const PREVIEW_URL = 'http://127.0.0.1:4173/';
const READY_TOKEN = 'Local:';

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

    const homeResponse = await fetch(PREVIEW_URL);
    if (!homeResponse.ok) {
      throw new Error(`Home route request failed with HTTP ${homeResponse.status}.`);
    }

    const html = await homeResponse.text();
    if (!html.includes('id="root"')) {
      throw new Error('Smoke check failed: #root container missing from preview HTML response.');
    }

    const bundleMatch = html.match(/<script[^>]+src="([^"]*assets\/index-[^"]+\.js)"/i);
    if (!bundleMatch?.[1]) {
      throw new Error('Smoke check failed: unable to identify main index bundle in HTML.');
    }

    const bundleUrl = new URL(bundleMatch[1], PREVIEW_URL).toString();
    const bundleResponse = await fetch(bundleUrl);
    if (!bundleResponse.ok) {
      throw new Error(`Main bundle request failed with HTTP ${bundleResponse.status} for ${bundleUrl}.`);
    }

    console.log(`[smoke-preview] OK: #root found and bundle is reachable (${bundleUrl}).`);
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
