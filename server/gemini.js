import { GoogleGenerativeAI } from "@google/generative-ai";

export async function analyzeFood(foodData, userProfile) {
  const prompt = `
    ROLE: Health risk awareness engine.
    USER PROFILE: ${JSON.stringify(userProfile)}
    MEAL LOG: "${foodData}"

    TASKS:
    1. Identify estimated protein content (g). Calculate protein requirement. Detect deficiency.
    2. Assess risk levels (low, moderate, high) for: diabetes, heart, kidney, liver.
    3. Suggest preventive actions.
    4. Suggest supplements if deficient (protein, vitamin B12, vitamin D, iron, calcium, multivitamin). Mark optional, add 'consult doctor'.
    5. NEVER provide medical diagnosis. Use 'possible risk'.
    6. Return ONLY structured JSON.

    OUTPUT FORMAT:
    {
      "calories": 0,
      "protein": 0,
      "carbs": 0,
      "fats": 0,
      "protein_status": "adequate | deficient",
      "risk_summary": [{ "condition": "string", "risk_level": "low|moderate|high", "reason": "string", "preventive_actions": ["string"] }],
      "supplements": ["string"]
    }
  `;

  try {
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llava:latest",
        prompt: prompt,
        stream: false
      })
    });
    const data = await response.json();
    const text = data.response;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { error: "Ollama output parsing failed" };
  } catch (err) {
    console.error("Local AI Error:", err);
    return { error: "AI service failed. Ensure Ollama is running." };
  }
}
