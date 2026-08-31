const https = require("https");

const SUPPORTED_LANGUAGES = ["ENGLISH", "URDU", "ROMAN_URDU"];

const MAX_MESSAGE_LENGTH = 2000;

const SYSTEM_PROMPT = `You are the SehatConnectAI symptom-to-specialist assistant. Your job is to help patients find the right medical department based on their symptoms.

You are NOT a doctor. You must NEVER:
- Diagnose diseases or conditions definitively.
- Prescribe medications or recommend dosages.
- Provide treatment plans as if you are a medical professional.
- Tell the patient "you have" a specific disease.

Your job:
1. Read the patient's symptom description.
2. Determine which medical department or specialist type is most appropriate.
3. Provide a very brief (1–2 sentences) helpful explanation of why that department is appropriate.
4. If symptoms suggest an emergency (chest pain, severe breathing difficulty, heavy bleeding, loss of consciousness, stroke signs, severe allergic reaction), set is_emergency to true and advise immediate emergency care (call 1122 in Pakistan).

You MUST respond with valid JSON only (no markdown, no code fences, no extra text). Use this exact structure:

{
  "recommended_department": "Department Name",
  "message": "A very brief 1–2 sentence explanation. Do not diagnose.",
  "is_emergency": false
}

Rules for recommended_department:
- Use common department names such as: Cardiology, Neurology, Orthopedics, Dermatology, ENT, Ophthalmology, General Medicine, Pediatrics, Gynecology, Urology, Gastroenterology, Pulmonology, Psychiatry, Dentistry, General Surgery.
- If the symptoms are too vague to determine a specific department, recommend "General Medicine".
- Always provide exactly one department name.

Language rules:
- The "message" field MUST be written in the patient's requested language.
- ENGLISH → English
- URDU → Urdu script
- ROMAN_URDU → Roman Urdu (Urdu written in English/Latin script)`;

/**
 * Build the request payload for the Gemini generateContent API.
 */
function buildGeminiPayload(message, language) {
  const langInstruction = {
    ENGLISH: "Respond in English.",
    URDU: "Respond in Urdu script.",
    ROMAN_URDU: "Respond in Roman Urdu (Urdu written in English/Latin script).",
  };

  return {
    system_instruction: {
      parts: [{ text: SYSTEM_PROMPT }],
    },
    contents: [
      {
        parts: [
          {
            text: `${message}\n\n[${langInstruction[language] || langInstruction.ENGLISH}]`,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 1024,
      responseMimeType: "application/json",
    },
  };
}

/**
 * Call the Google Gemini API.
 *
 * Environment variables:
 *   GEMINI_API_KEY – Google Gemini API key
 *   GEMINI_MODEL   – Model name (default: gemini-2.0-flash)
 */
async function callGemini(payload) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";

  if (!apiKey) {
    throw new Error("AI provider is not configured");
  }

  const body = JSON.stringify(payload);

  const url = new URL(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
  );

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        method: "POST",
        hostname: url.hostname,
        path: `${url.pathname}?key=${encodeURIComponent(apiKey)}`,
        headers: {
          "Content-Type": "application/json",
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const parsed = JSON.parse(data);

            if (res.statusCode !== 200) {
              const errMsg =
                parsed?.error?.message || `Gemini API returned status ${res.statusCode}`;
              return reject(new Error(errMsg));
            }

            const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text) {
              return reject(new Error("Gemini API returned an empty response"));
            }

            resolve(text.trim());
          } catch (parseErr) {
            reject(new Error("Failed to parse Gemini API response"));
          }
        });
      }
    );

    req.on("error", () => {
      reject(new Error("Failed to connect to AI provider"));
    });

    req.write(body);
    req.end();
  });
}

/**
 * Parse the AI provider's raw text response into structured JSON.
 * Falls back to a safe default if parsing fails.
 */
function parseAIResponse(rawText) {
  // Strip markdown code fences if the AI wraps JSON in them
  let cleaned = rawText
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned);

    return {
      recommended_department: typeof parsed.recommended_department === "string"
        ? parsed.recommended_department.trim()
        : null,
      message: typeof parsed.message === "string" ? parsed.message.trim() : "",
      is_emergency: parsed.is_emergency === true,
    };
  } catch {
    // If JSON parsing fails, do NOT invent a department
    return {
      recommended_department: null,
      message: rawText || "We could not analyze your symptoms. Please consult a doctor directly.",
      is_emergency: false,
    };
  }
}

/**
 * Analyze patient symptoms and return a structured recommendation.
 *
 * @param {string} message  – The patient's symptom description
 * @param {string} language – One of ENGLISH, URDU, ROMAN_URDU
 * @returns {Promise<{recommended_department: string, message: string, is_emergency: boolean}>}
 */
async function analyzeSymptoms(message, language) {
  const payload = buildGeminiPayload(message, language);
  const rawResponse = await callGemini(payload);
  return parseAIResponse(rawResponse);
}

module.exports = {
  analyzeSymptoms,
  SUPPORTED_LANGUAGES,
  MAX_MESSAGE_LENGTH,
};
