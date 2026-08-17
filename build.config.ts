import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  entries: [
    'src/module',
    'src/runtime/matcher',
    'src/runtime/response',
    'src/runtime/server/middleware/00-fast-404',
  ],
  clean: true,
  declaration: false,
  failOnWarn: false,
  externals: ['#internal/nuxt-early-404-routes', 'h3', 'nitropack/runtime', 'rou3'],
  rollup: {
    inlineDependencies: false,
    esbuild: { target: 'node22' },
  },
});
