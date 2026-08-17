import { addRoute, createRouter, findRoute } from 'rou3';
import type { RouterContext } from 'rou3';

const PAYLOAD_SUFFIXES = ['/_payload.json', '/_payload.js'];
const NUXT_ERROR_ROUTE = '/__nuxt_error';

export interface Early404RouteMatcher {
  ready: boolean;
  matches: (path: string) => boolean;
}

function withoutQuery(path: string): string {
  const queryIndex = path.indexOf('?');
  return queryIndex === -1 ? path : path.slice(0, queryIndex);
}

function normalizeBaseURL(baseURL: string): string {
  const withLeadingSlash = baseURL.startsWith('/') ? baseURL : `/${baseURL}`;
  const withoutTrailingSlash = withLeadingSlash.replace(/\/+$/, '');
  return withoutTrailingSlash || '/';
}

function withoutBase(path: string, baseURL: string): string {
  const base = normalizeBaseURL(baseURL);
  if (base === '/') return path;
  if (path === base || path === `${base}/`) return '/';
  if (path.startsWith(`${base}/`)) return path.slice(base.length);
  return path;
}

function getPayloadPagePath(path: string): string | undefined {
  for (const suffix of PAYLOAD_SUFFIXES) {
    if (path === suffix) return '/';
    if (path.endsWith(suffix)) return path.slice(0, -suffix.length) || '/';
  }
}

function createRouteRouter(
  routePatterns: readonly string[],
  caseSensitive: boolean,
): RouterContext<boolean> {
  const router = createRouter<boolean>();

  for (const routePattern of new Set(routePatterns)) {
    const pattern = caseSensitive ? routePattern : routePattern.toLowerCase();
    addRoute(router, undefined, pattern, true);
  }

  return router;
}

function routerMatches(router: RouterContext<boolean>, path: string): boolean {
  return Boolean(findRoute(router, undefined, path));
}

export function normalizeEarly404RequestPath(requestPath: string, baseURL: string): string {
  return withoutBase(withoutQuery(requestPath), baseURL);
}

export function createEarly404RouteMatcher(
  pageRoutePatterns: readonly string[],
  serverRoutePatterns: readonly string[],
  pageCaseSensitive: boolean,
  excludedRoutePatterns: readonly string[],
): Early404RouteMatcher {
  const pageRouter = createRouteRouter(pageRoutePatterns, pageCaseSensitive);
  const serverRouter = createRouteRouter(serverRoutePatterns, true);
  const excludedRouter = createRouteRouter(excludedRoutePatterns, true);
  const foldedExcludedRouter = pageCaseSensitive
    ? undefined
    : createRouteRouter(excludedRoutePatterns, false);

  function matches(path: string): boolean {
    if (path === NUXT_ERROR_ROUTE) return true;
    if (routerMatches(excludedRouter, path)) return true;
    if (foldedExcludedRouter && routerMatches(foldedExcludedRouter, path.toLowerCase()))
      return true;
    if (routerMatches(serverRouter, path)) return true;

    const pagePath = pageCaseSensitive ? path : path.toLowerCase();
    if (routerMatches(pageRouter, pagePath)) return true;

    const payloadPagePath = getPayloadPagePath(path);
    if (!payloadPagePath) return false;

    const payloadPageRoute = pageCaseSensitive ? payloadPagePath : payloadPagePath.toLowerCase();
    return routerMatches(pageRouter, payloadPageRoute);
  }

  return {
    ready: pageRoutePatterns.length > 0,
    matches,
  };
}
