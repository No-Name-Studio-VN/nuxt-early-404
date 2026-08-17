import {
  addServerScanDir,
  addServerTemplate,
  addTypeTemplate,
  createResolver,
  defineNuxtModule,
} from '@nuxt/kit';
import './types/nuxt-hooks';
import {
  collectNuxtPageRoutePatterns,
  collectServerRoutePatterns,
  createEarly404ManifestSource,
} from './route-manifest';
import type { Early404ModuleOptions, Early404PageRoute, Early404RouteSource } from './types/module';

const EARLY_404_ROUTE_MANIFEST_ID = '#internal/nuxt-early-404-routes';

function normalizeApiPrefixes(prefixes: readonly string[]): string[] {
  const normalizedPrefixes = new Set<string>();

  for (const prefix of prefixes) {
    const trimmedPrefix = prefix.trim();
    if (!trimmedPrefix) {
      throw new TypeError('nuxt-early-404 apiPrefixes cannot contain an empty path.');
    }

    const withLeadingSlash = trimmedPrefix.startsWith('/') ? trimmedPrefix : `/${trimmedPrefix}`;
    const normalizedPrefix =
      withLeadingSlash.length > 1 ? withLeadingSlash.replace(/\/+$/, '') : withLeadingSlash;
    normalizedPrefixes.add(normalizedPrefix);
  }

  return [...normalizedPrefixes];
}

function normalizeExcludedPatterns(patterns: readonly string[]): string[] {
  const normalizedPatterns = new Set<string>();

  for (const pattern of patterns) {
    const trimmedPattern = pattern.trim();
    if (!trimmedPattern) {
      throw new TypeError('nuxt-early-404 exclude cannot contain an empty route pattern.');
    }

    normalizedPatterns.add(trimmedPattern.startsWith('/') ? trimmedPattern : `/${trimmedPattern}`);
  }

  return [...normalizedPatterns];
}

function validateCacheMaxAge(cacheMaxAge: number): void {
  if (!Number.isInteger(cacheMaxAge) || cacheMaxAge < 0) {
    throw new TypeError('nuxt-early-404 cacheMaxAge must be a non-negative integer.');
  }
}

export default defineNuxtModule<Early404ModuleOptions>({
  meta: {
    name: 'nuxt-early-404',
    configKey: 'early404',
    compatibility: { nuxt: '>=4.0.0' },
  },

  defaults: {
    enabled: true,
    apiPrefixes: ['/api'],
    exclude: [],
    cacheMaxAge: 60,
  },

  setup(options, nuxt) {
    if (!options.enabled) return;

    validateCacheMaxAge(options.cacheMaxAge);

    const resolver = createResolver(import.meta.url);
    const early404RuntimeDir = resolver.resolve('./runtime/server');
    const apiPrefixes = normalizeApiPrefixes(options.apiPrefixes);
    const exclude = normalizeExcludedPatterns(options.exclude);
    let resolvedPages: Early404PageRoute[] = [];
    let getServerRouteSources = (): Early404RouteSource[] => [];

    // Nitro scans this directory before the application's server directory, so this guard
    // runs before user middleware that would otherwise perform auth, storage, or SSR work.
    addServerScanDir(early404RuntimeDir, { prepend: true });

    nuxt.hook('nitro:init', (nitro) => {
      nitro.options.scanDirs = [
        early404RuntimeDir,
        ...nitro.options.scanDirs.filter((scanDir) => scanDir !== early404RuntimeDir),
      ];
      getServerRouteSources = () => [...nitro.scannedHandlers, ...nitro.options.handlers];
    });

    nuxt.hook('pages:resolved', (pages) => {
      resolvedPages = pages;
    });

    addServerTemplate({
      filename: EARLY_404_ROUTE_MANIFEST_ID,
      getContents: () =>
        createEarly404ManifestSource({
          enabled: !nuxt.options.dev,
          pageCaseSensitive: nuxt.options.router.options.sensitive === true,
          pageRoutePatterns: collectNuxtPageRoutePatterns(resolvedPages),
          serverRoutePatterns: collectServerRoutePatterns(getServerRouteSources()),
          exclude,
          apiPrefixes,
          cacheMaxAge: options.cacheMaxAge,
        }),
    });

    addTypeTemplate(
      {
        filename: 'types/nuxt-early-404-routes.d.ts',
        getContents: () =>
          [
            `declare module '${EARLY_404_ROUTE_MANIFEST_ID}' {`,
            '  export const enabled: boolean;',
            '  export const pageCaseSensitive: boolean;',
            '  export const pageRoutePatterns: readonly string[];',
            '  export const serverRoutePatterns: readonly string[];',
            '  export const exclude: readonly string[];',
            '  export const apiPrefixes: readonly string[];',
            '  export const cacheMaxAge: number;',
            '}',
            'export {};',
          ].join('\n'),
      },
      { nitro: true },
    );
  },
});
