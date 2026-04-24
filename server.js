import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Replicate Vite proxies for Production
app.use('/api-indian', createProxyMiddleware({
    target: 'https://indian-food-db.herokuapp.com',
    changeOrigin: true,
    pathRewrite: {
        '^/api-indian': '/api',
    },
}));

app.use('/api-mealdb', createProxyMiddleware({
    target: 'https://www.themealdb.com',
    changeOrigin: true,
    pathRewrite: {
        '^/api-mealdb': '/api/json/v1/1',
    },
}));

// Serve static assets from public/dist
app.use(express.static(path.join(__dirname, 'public', 'dist')));

// SPA support: Redirect all other requests to index.html
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`RestroBoom AI Production Server running on port ${PORT}`);
});
