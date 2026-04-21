import express from 'express';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { analyzeFood } from './gemini.js'; // local Ollama wrapper

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, '../public')));

app.post('/api/analyze-food', async (req, res) => {
    try {
        const result = await analyzeFood(req.body.foodData.parsed || req.body.foodData, req.body.userProfile);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: "Analysis failed" });
    }
});

app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running smoothly on http://localhost:${PORT}`);
});
