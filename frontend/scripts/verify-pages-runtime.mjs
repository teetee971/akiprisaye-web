import { spawn } from 'node:child_process';

const HOST = '127.0.0.1';
const PORT = '4173';
const BASE_PATH = '/akiprisaye-web/';
const BASE_URL = `http://${HOST}:${PORT}${BASE_PATH}`;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function startPreview() {
  return spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'preview', '--', '--host', HOST, '--port', PORT, '--strictPort'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: process.env,
    detached: process.platform !== 'win32',
  });
}

function waitForReady(preview, timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Vite preview did not become ready in time.'));
    }, timeoutMs);

    const onData = (chunk) => {
      const text = chunk.toString();
      if (text.includes('Local:')) {
        cleanup();
        resolve();
      }
    };

    const onExit = (code) => {
      cleanup();
      reject(new Error(`Vite preview exited early (code=${code ?? 'null'}).`));
    };

    const cleanup = () => {
      clearTimeout(timeout);
      preview.stdout?.off('data', onData);
      preview.stderr?.off('data', onData);
      preview.off('exit', onExit);
    };

    preview.stdout?.on('data', onData);
    preview.stderr?.on('data', onData);
    preview.on('exit', onExit);
  });
}

async function stopPreview(preview) {
  try {
    if (process.platform !== 'win32') process.kill(-preview.pid, 'SIGTERM');
    else preview.kill('SIGTERM');
  } catch {}

  await wait(500);

  if (!preview.killed) {
    try {
      if (process.platform !== 'win32') process.kill(-preview.pid, 'SIGKILL');
      else preview.kill('SIGKILL');
    } catch {}
  }
}

async function assertOk(pathname, requiredText) {
  const res = await fetch(`http://${HOST}:${PORT}${pathname}`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`${pathname} returned HTTP ${res.status}`);
  }
  if (requiredText) {
    const body = await res.text();
    if (!body.includes(requiredText)) {
      throw new Error(`${pathname} response missing required marker: ${requiredText}`);
    }
  }
}

async function run() {
  const preview = startPreview();
  preview.stdout?.on('data', (chunk) => process.stdout.write(chunk));
  preview.stderr?.on('data', (chunk) => process.stderr.write(chunk));

  try {
    await waitForReady(preview);
    await assertOk(BASE_PATH, 'id="root"');
    await assertOk(`${BASE_PATH}manifest.webmanifest`);
    await assertOk(`${BASE_PATH}icon-192.png`);
    await assertOk(`${BASE_PATH}service-worker.js`);

    const notFoundCheck = await fetch(`http://${HOST}:${PORT}/assets/does-not-exist.js`, { cache: 'no-store' });
    if (notFoundCheck.status !== 404) {
      throw new Error(`/assets/does-not-exist.js returned HTTP ${notFoundCheck.status}, expected 404 (root /assets paths are being served).`);
    } else {
    if (notFoundCheck.status === 404) {
      console.log('[verify-pages-runtime] OK: root /assets paths are not served accidentally.');
    }

    console.log(`[verify-pages-runtime] OK: ${BASE_URL} responds with expected production-like assets.`);
  } finally {
    await stopPreview(preview);
  }
}

run().catch((error) => {
  console.error('[verify-pages-runtime] FAILED:', error instanceof Error ? error.message : error);
  process.exit(1);
});
