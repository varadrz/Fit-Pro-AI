# Vitality AI | Food & Fitness Intelligence

A lightweight (<8MB) Health & Fitness Web App built with Vanilla JS, GSAP, and MediaPipe. Powered by local AI via Ollama.

## Features
- **Nutrition Intelligence**: Natural language meal logging with quantity parsing.
- **Health Risk Awareness**: Detects potential lifestyle risks (diabetes, heart, etc.) based on meal data.
- **Supplement Guidance**: Suggests safe, non-medical supplements if deficiencies are detected.
- **Restaurant Explorer**: Filter menu items by macros (protein, carbs, calories) from popular brands.
- **AI Fitness Lab**: Real-time posture tracking for squats, pushups, and rotating toe touches using MediaPipe.
- **Cinematic UI**: GSAP-powered scroll storytelling for an immersive experience.

## Getting Started

### 1. Local Setup
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm start
   ```
4. Open `http://localhost:3000`.

### 2. AI Configuration (Ollama)
The app uses a local LLM for nutrition analysis.
1. Install [Ollama](https://ollama.ai).
2. Pull the LLava model:
   ```bash
   ollama pull llava
   ```
3. Ensure Ollama is running (`ollama serve`).

## Deployment (GCP Cloud Run)
This app is ready for serverless deployment on Google Cloud Platform.
1. Build and push the Docker image:
   ```bash
   gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/vitality-ai
   ```
2. Deploy to Cloud Run:
   ```bash
   gcloud run deploy vitality-ai --image gcr.io/YOUR_PROJECT_ID/vitality-ai --platform managed
   ```

## Tech Stack
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Animations**: GSAP + ScrollTrigger
- **Pose Detection**: MediaPipe Pose
- **Server**: Node.js (Express)
- **AI Interface**: Local Ollama (LLava)
