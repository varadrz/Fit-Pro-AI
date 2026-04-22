import { defineConfig } from 'vite';

export default defineConfig({
  root: 'public',
  server: {
    port: 3000,
    proxy: {
      '/api-indian': {
        target: 'https://indian-food-db.herokuapp.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api-indian/, '/api')
      },
      '/api-mealdb': {
        target: 'https://www.themealdb.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-mealdb/, '/api/json/v1/1')
      }
    }
  }
});
