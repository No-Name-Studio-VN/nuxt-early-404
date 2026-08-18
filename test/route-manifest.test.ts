import { describe, expect, it } from 'vitest';
import {
  collectNuxtPageRoutePatterns,
  collectServerRoutePatterns,
  createEarly404ManifestSource,
  toRou3PagePattern,
} from '../src/route-manifest';

describe('route manifest generation', () => {
  it('converts Nuxt page paths into conservative Rou3 patterns', () => {
    expect(toRou3PagePattern('/reader/:id(\\d+)')).toBe('/reader/:id');
    expect(toRou3PagePattern('/articles/:slug?')).toBe('/articles/:slug?');
    expect(toRou3PagePattern('/docs/:pathMatch(.*)*')).toBe('/docs/**:pathMatch');
  });

  it('widens params whose constraint can match a slash to a catch-all', () => {
    // `:id(.*)` matches `/deep/a/b` in vue-router, so a single-segment `:id` would 404 it.
    expect(toRou3PagePattern('/deep/:id(.*)')).toBe('/deep/**:id');
    expect(toRou3PagePattern('/deep/:id([^-]+)')).toBe('/deep/**:id');
    expect(toRou3PagePattern('/deep/:id(a\\/b)')).toBe('/deep/**:id');
    expect(toRou3PagePattern('/reader/:id(\\d\\.\\d)')).toBe('/reader/:id');
  });

  it('collects nested pages beneath canonical paths and aliases', () => {
    expect(
      collectNuxtPageRoutePatterns([
        { path: '/' },
        {
          path: '/hub',
          alias: '/community',
          children: [
            { path: '' },
            { path: 'story/:id()' },
            { path: 'author/:slug?', alias: 'writer/:slug?' },
          ],
        },
      ]),
    ).toEqual([
      '/',
      '/hub',
      '/community',
      '/hub/story/:id',
      '/hub/author/:slug?',
      '/hub/writer/:slug?',
      '/community/story/:id',
      '/community/author/:slug?',
      '/community/writer/:slug?',
    ]);
  });

  it('keeps custom catch-all handlers and excludes Nuxt internal error rendering', () => {
    expect(
      collectServerRoutePatterns([
        { middleware: true },
        { route: '/api/story/:id' },
        { route: '/**' },
        { route: '/__nuxt_error' },
        { route: '/__nuxt_error_debug' },
      ]),
    ).toEqual(['/api/story/:id', '/**', '/__nuxt_error_debug']);
  });

  it('serializes the runtime manifest without executable configuration', () => {
    expect(
      createEarly404ManifestSource({
        enabled: true,
        pageCaseSensitive: false,
        pageRoutePatterns: ['/'],
        serverRoutePatterns: ['/api/health'],
        exclude: ['/legacy/**'],
        apiPrefixes: ['/api'],
        cacheMaxAge: 60,
      }),
    ).toContain('export const pageCaseSensitive = false;');
  });
});
