import { describe, expect, it } from 'vitest';
import { createEarly404RouteMatcher, normalizeEarly404RequestPath } from '../src/runtime/matcher';

describe('fast 404 route matcher', () => {
  const matcher = createEarly404RouteMatcher(
    ['/', '/profile/:slug?', '/reader/:id'],
    ['/api/story/:id', '/robots.txt'],
    false,
    ['/legacy/**'],
  );

  it('matches Nuxt pages case-insensitively when the router is not sensitive', () => {
    expect(matcher.matches('/Reader/42')).toBe(true);
    expect(matcher.matches('/PROFILE/author-name')).toBe(true);
  });

  it('matches server routes, payload routes, exclusions, and the internal error route', () => {
    expect(matcher.matches('/api/story/42')).toBe(true);
    expect(matcher.matches('/robots.txt')).toBe(true);
    expect(matcher.matches('/reader/42/_payload.json')).toBe(true);
    expect(matcher.matches('/reader/42/_payload.js')).toBe(true);
    expect(matcher.matches('/legacy/imported-route')).toBe(true);
    expect(matcher.matches('/__nuxt_error')).toBe(true);
  });

  it('rejects paths that are absent from every known route source', () => {
    expect(matcher.matches('/wp-login.php')).toBe(false);
    expect(matcher.matches('/reader/42/extra')).toBe(false);
    expect(matcher.matches('/api/story/42/extra')).toBe(false);
    expect(matcher.matches('/unknown/_payload.json')).toBe(false);
  });

  it('normalizes base URLs and request queries before matching', () => {
    expect(normalizeEarly404RequestPath('/studio/Reader/42?chapter=2', '/studio/')).toBe(
      '/Reader/42',
    );
  });

  it('matches percent-encoded requests for pages with non-ASCII paths', () => {
    const unicodeMatcher = createEarly404RouteMatcher(['/tin-tức'], [], false, []);

    expect(unicodeMatcher.matches('/tin-t%E1%BB%A9c')).toBe(true);
    expect(unicodeMatcher.matches('/tin-t%E1%BB%A9c/extra')).toBe(false);
  });

  it('ignores malformed percent-encoding rather than throwing', () => {
    expect(matcher.matches('/%E0%A4%A')).toBe(false);
  });

  it('fails open if Nuxt did not expose any page routes', () => {
    expect(createEarly404RouteMatcher([], ['/api/story/:id'], false, []).ready).toBe(false);
  });
});
