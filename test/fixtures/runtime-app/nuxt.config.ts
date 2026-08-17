import early404 from 'nuxt-early-404';

export default defineNuxtConfig({
  modules: [early404],
  early404: {
    exclude: ['/runtime-routes/**'],
  },
  nitro: {
    preset: 'node-server',
  },
});
