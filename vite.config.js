import { defineConfig } from 'vite';

export default defineConfig({
  root: 'public',
  server: {
    port: 3000,
    proxy: {
      '/api-indian': {
        target: 'https://indian-food-db.herokuapp.com',
        changeOrigin: true,
        secure: false, // Heroku might use non-strict SSL for some subdomains
        rewrite: (path) => path.replace(/^\/api-indian/, '/api'), // Correctly prepends /api
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('[Proxy Error]', err);
          });
        }
      }
    }
  }
});
