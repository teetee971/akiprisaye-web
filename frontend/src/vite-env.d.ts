/// <reference types="vite/client" />

declare global {
  interface Window {
    __BUILD_SHA__?: string;
  }
}

export {};