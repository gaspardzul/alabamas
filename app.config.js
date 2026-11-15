// Extiende app.json. WEB_BASE_URL define el prefijo de la versión web:
//   ""          → https://alabamas.org/ (dominio propio)
//   "/alabamas" → https://gaspardzul.github.io/alabamas/ (GitHub Pages sin dominio)
// En CI lo calcula actions/configure-pages (ver .github/workflows/deploy-web.yml).
module.exports = ({ config }) => ({
  ...config,
  experiments: {
    ...config.experiments,
    baseUrl: process.env.WEB_BASE_URL || '',
  },
});
