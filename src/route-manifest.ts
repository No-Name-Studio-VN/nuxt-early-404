import type { Early404Manifest, Early404PageRoute, Early404RouteSource } from './types/module';

function joinPagePath(parentPath: string, pagePath: string): string {
  if (pagePath.startsWith('/')) return pagePath;
  if (!pagePath) return parentPath || '/';

  const parent = parentPath === '/' ? '' : parentPath.replace(/\/$/, '');
  return `${parent}/${pagePath}`;
}

function getPageAliases(page: Early404PageRoute): string[] {
  if (!page.alias) return [];
  return Array.isArray(page.alias) ? page.alias : [page.alias];
}

// A constraint spans path segments when it can match a slash: `.` matches one, as does an
// explicit `/` or a negated class such as `[^-]`. Escape sequences other than `\/` cannot.
function spansPathSegments(constraint: string): boolean {
  return /[./]|\[\^/.test(constraint.replace(/\\[^/]/g, ''));
}

export function toRou3PagePattern(pagePath: string): string {
  return pagePath
    .replace(/:(\w+)\(([^)]*)\)/g, (_match, name: string, constraint: string) =>
      spansPathSegments(constraint) ? `:${name}*` : `:${name}`,
    )
    .replace(/:(\w+)\*.*/g, (_match, name: string) => `**:${name}`)
    .replace(/:([^/*]*)/g, (_match, name: string) => `:${name.replace(/[^\w?]/g, '_')}`);
}

export function collectNuxtPageRoutePatterns(
  pages: readonly Early404PageRoute[],
  parentPath = '',
): string[] {
  const routes: string[] = [];

  for (const page of pages) {
    const basePaths = [
      joinPagePath(parentPath, toRou3PagePattern(page.path)),
      ...getPageAliases(page).map((alias) => joinPagePath(parentPath, toRou3PagePattern(alias))),
    ];

    routes.push(...basePaths);

    if (page.children?.length) {
      for (const basePath of basePaths) {
        routes.push(...collectNuxtPageRoutePatterns(page.children, basePath));
      }
    }
  }

  return [...new Set(routes)];
}

export function collectServerRoutePatterns(sources: readonly Early404RouteSource[]): string[] {
  return [
    ...new Set(
      sources.flatMap((source) => {
        if (source.middleware || !source.route || source.route === '/__nuxt_error') {
          return [];
        }

        return [source.route];
      }),
    ),
  ];
}

export function createEarly404ManifestSource(manifest: Early404Manifest): string {
  return [
    `export const enabled = ${JSON.stringify(manifest.enabled)};`,
    `export const pageCaseSensitive = ${JSON.stringify(manifest.pageCaseSensitive)};`,
    `export const pageRoutePatterns = ${JSON.stringify(manifest.pageRoutePatterns)};`,
    `export const serverRoutePatterns = ${JSON.stringify(manifest.serverRoutePatterns)};`,
    `export const exclude = ${JSON.stringify(manifest.exclude)};`,
    `export const apiPrefixes = ${JSON.stringify(manifest.apiPrefixes)};`,
    `export const cacheMaxAge = ${JSON.stringify(manifest.cacheMaxAge)};`,
  ].join('\n');
}
