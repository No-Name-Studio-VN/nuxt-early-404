import type { Nitro } from 'nitropack/types';

declare module '@nuxt/schema' {
  interface NuxtHooks {
    'nitro:init': (nitro: Nitro) => void;
  }
}

export {};
