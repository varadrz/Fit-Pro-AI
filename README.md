# Vitality AI | Visionary Health Intelligence 

A premium, lightweight (<8MB) Health & Fitness platform built with a visionary Apple-inspired design language. Powered by Vanilla JavaScript, GSAP, and local AI via Ollama.

##  Design Philosophy
- **Minimalism**: A clean, high-contrast interface focusing on single-column clarity and deep black space.
- **Cinematic Motion**: Purposeful GSAP-driven scroll scaling and page transitions for an immersive experience.
- **Saturated Transparency**: Navigational elements utilizing saturated backdrop-blur and ultra-thin borders.

## 🚀 Visionary Features
- **Nutrition Analytics**: Advanced natural language meal logging (e.g., "2 idli, 1 bowl sambar") with automated protein deficiency detection and metabolic insight.
- **Fitness Lab**: AI-driven posture tracking for high-performance squats using MediaPipe Pose. Real-time feedback for optimal range of motion.
- **Restaurant Explorer**: Full menu intelligence for **McDonald's, Domino's, Subway, KFC,** and **Pizza Hut** with macro-filtering (Protein, Carbs, Calories).
- **Health Risk Awareness**: Proactive lifestyle screening for metabolic health triggers (Diabetes, Heart, Kidney, Liver) based on dietary patterns.
- **Supplement Intelligence**: Non-medical deficiency correction suggestions (B12, Vitamin D, Protein) integrated into the nutrition workflow.

## 🛠 Tech Stack
- **Frontend**: HTML5, CSS3 (Custom Apple-inspired framework), Vanilla JavaScript.
- **Animations**: GSAP 3.12 + ScrollTrigger.
- **Intelligence**: Local Ollama (LLava model) + MediaPipe Pose.
- **Backend**: Node.js (Express) with ES Module architecture.
- **Deployment**: Dockerized for GCP Cloud Run or Firebase.

## 🏁 Getting Started

### 1. Requirements
- **Node.js** (v18+)
- **Ollama** (Running locally with `ollama pull llava`)

### 2. Installation
```bash
npm install
```

### 3. Execution
```bash
npm start
```
The application will be live at `http://localhost:3000`.

## 📦 Deployment
This repository is optimized for **Google Cloud Platform (Cloud Run)**:
```bash
# Build & Deploy
gcloud run deploy vitality-ai --source . --platform managed
```

---
*Vitality AI is a demonstration of high-performance health intelligence. Always consult a medical professional for health advice.*
