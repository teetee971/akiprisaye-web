import { spawn } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

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
    env: { ...process.env, BASE_PATH },
    detached: process.platform !== 'win32',
  });
}

const stripAnsi = (str) => str.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');

function waitForReady(preview, timeoutMs = 60000) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Vite preview did not become ready in time.'));
    }, timeoutMs);

    const onData = (chunk) => {
      const text = stripAnsi(chunk.toString());
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

async function assertImage(pathname) {
  const res = await fetch(`http://${HOST}:${PORT}${pathname}`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`${pathname} returned HTTP ${res.status} — icon missing from dist`);
  }
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.startsWith('image/')) {
    throw new Error(`${pathname} has unexpected Content-Type "${contentType}" — expected image/*`);
  }
  const buf = await res.arrayBuffer();
  const bytes = new Uint8Array(buf);
  // Verify PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
  const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  if (!isPng) {
    throw new Error(`${pathname} does not start with PNG magic bytes — the file may be corrupt or replaced by HTML`);
  }
}

async function run() {
  const preview = startPreview();

  // Register readiness detection BEFORE logging listeners to avoid a race
  // condition where the 'Local:' chunk is drained before waitForReady can see it.
  const readyPromise = waitForReady(preview);

  preview.stdout?.on('data', (chunk) => process.stdout.write(chunk));
  preview.stderr?.on('data', (chunk) => process.stderr.write(chunk));

  try {
    await readyPromise;
    await assertOk(BASE_PATH, 'id="root"');
    await assertOk(`${BASE_PATH}manifest.webmanifest`);
    await assertImage(`${BASE_PATH}icon-192.png`);
    await assertImage(`${BASE_PATH}icon-512.png`);
    await assertOk(`${BASE_PATH}service-worker.js`);

    const notFoundCheck = await fetch(`http://${HOST}:${PORT}/assets/does-not-exist.js`, { cache: 'no-store' });
    if (notFoundCheck.status !== 404) {
      throw new Error(`/assets/does-not-exist.js returned HTTP ${notFoundCheck.status}, expected 404 (root /assets paths are being served).`);
    } else {
      console.log('[verify-pages-runtime] OK: root /assets paths are not served accidentally.');
    }

    // ── SPA fallback: dist/404.html must be the React app shell ────────────────
    // GitHub Pages serves dist/404.html for any unmatched URL (e.g. /landing).
    // Verify that file is the app shell (not the SPA redirect script) by checking
    // the file directly — Vite preview does not replicate GitHub Pages 404 routing.
    const notFoundHtmlPath = resolve(process.cwd(), 'dist/404.html');
    if (!existsSync(notFoundHtmlPath)) {
      throw new Error('dist/404.html not found — SPA fallback file is missing');
    }
    const notFoundHtml = readFileSync(notFoundHtmlPath, 'utf8');
    if (!notFoundHtml.includes('id="root"')) {
      throw new Error('dist/404.html does not contain id="root" — it must be a copy of dist/index.html so GitHub Pages serves the React app for direct route access (e.g. /landing)');
    }
    console.log('[verify-pages-runtime] OK: dist/404.html is the React app shell (SPA fallback).');

    // ── SPA ?p= redirect path: index.html ?p= handler must be present ──────────
    // The SPA redirect in public/404.html sends /some/path → /?p=%2Fsome%2Fpath.
    // The index.html inline script reads ?p= and restores the URL via history.replaceState
    // before React boots, so React Router sees /some/path and routes correctly.
    const indexHtmlPath = resolve(process.cwd(), 'dist/index.html');
    const indexHtml = readFileSync(indexHtmlPath, 'utf8');
    if (!indexHtml.includes("search[1] === 'p'")) {
      throw new Error("dist/index.html is missing the ?p= URL-restore handler — direct deep-link access via GitHub Pages 404 fallback will break");
    }
    console.log('[verify-pages-runtime] OK: dist/index.html contains the ?p= SPA path-restore handler.');

    // HTTP-level check: the SPA redirect target (?p=%2Flanding) serves the app
    // (Vite preview serves index.html for /?p= because it is the base URL with a query)
    await assertOk(`${BASE_PATH}?p=%2Flanding`, 'id="root"');
    console.log('[verify-pages-runtime] OK: SPA redirect target /?p=%2Flanding returns the app shell.');

    console.log(`[verify-pages-runtime] OK: ${BASE_URL} responds with expected production-like assets.`);
  } finally {
    await stopPreview(preview);
  }
}

run().catch((error) => {
  console.error('[verify-pages-runtime] FAILED:', error instanceof Error ? error.message : error);
  process.exit(1);
});
