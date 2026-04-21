import { GoogleGenerativeAI } from "@google/generative-ai";

const getApiKey = () => {
  return import.meta.env.VITE_GEMINI_API_KEY || "";
};

async function callOllama(prompt: string) {
  console.log("Attempting Browser-to-Ollama local fallback...");
  try {
    // Note: This requires Ollama to have OLLAMA_ORIGINS="*" set in environment
    const response = await fetch("http://127.0.0.1:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llava:latest",
        prompt: prompt + "\nRespond ONLY in JSON format.",
        stream: false
      })
    });
    
    if (!response.ok) throw new Error("Ollama connection failed (Check CORS)");
    
    const data = await response.json();
    const text = data.response;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { error: "Ollama output parsing failed" };
  } catch (err: any) {
    return { error: `AI Error: ${err.message}. If using Ollama, ensure OLLAMA_ORIGINS="*" is set.` };
  }
}

export const analyzeFoodServerless = async (foodData: string, userProfile: any) => {
  const apiKey = getApiKey();
  
  const prompt = `
    ROLE: Health risk awareness engine.
    USER PROFILE: ${JSON.stringify(userProfile)}
    MEAL LOG: "${foodData}"

    TASKS:
    1. Identify estimated protein content (g).
    2. Assess risk levels (low, moderate, high) for: diabetes, heart, kidney, liver.
    3. Return ONLY structured JSON.

    OUTPUT FORMAT:
    {
      "proteinContent": "string",
      "risk_summary": [{ "condition": "string", "risk_level": "string", "reason": "string" }],
      "preventive_actions": [{ "condition": "string", "food_suggestions": ["string"], "lifestyle_changes": ["string"] }],
      "general_advice": ["string"]
    }
  `;

  if (!apiKey || apiKey.includes("REPLACE")) {
    return await callOllama(prompt);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : await callOllama(prompt);
  } catch (error: any) {
    console.error("Gemini Browser Error:", error.message);
    return await callOllama(prompt);
  }
};
