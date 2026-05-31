/// <reference types="vite/client" />

import type { CompanionApi } from '../electron/preload';

declare global {
  interface Window {
    companionApi: CompanionApi;
  }
}
