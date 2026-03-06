// Client-only utilities – never import this file from Node scripts, vite.config,
// test configs, or service-worker build pipelines.
// Use ./buildVersionGuard.client for explicit client-side imports.
export { enforceBuildVersionSync, enforceBuildVersionSyncAsync, registerAppServiceWorker } from './buildVersionGuard.client';
export { enforceBuildVersionSync, registerAppServiceWorker } from './buildVersionGuard.client';
