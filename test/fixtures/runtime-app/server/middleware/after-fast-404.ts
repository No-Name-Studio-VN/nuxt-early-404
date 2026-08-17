export default defineEventHandler((event) => {
  setHeader(event, 'x-after-fast-404', 'reached');
});
