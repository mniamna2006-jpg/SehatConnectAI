const https = require("https");
const http = require("http");

const SUPPORTED_LANGUAGES = ["ENGLISH", "URDU", "ROMAN_URDU"];

const MAX_MESSAGE_LENGTH = 2000;

const SYSTEM_PROMPT = `You are SehatConnectAI, a helpful healthcare assistant for patients in Pakistan.

Your role:
- Provide general health information and guidance.
- Help patients understand symptoms, common conditions, and wellness practices.
- Suggest which medical department or specialist a patient might need.
- Encourage healthy lifestyle habits and preventive care.

Important safety rules:
- You are NOT a doctor. Always make this clear when relevant.
- Do NOT diagnose diseases or conditions definitively.
- Do NOT prescribe medications or recommend specific dosages.
- Do NOT provide definitive medical conclusions.
- Always recommend consulting a qualified healthcare professional for proper diagnosis and treatment.
- If symptoms suggest a potential emergency (chest pain, difficulty breathing, severe bleeding, loss of consciousness, severe allergic reaction, signs of stroke), immediately advise the user to seek emergency medical attention or call emergency services (1122 in Pakistan).
- Express uncertainty when appropriate. Use phrases like "this could be related to" rather than "you have."
- Do not refuse normal healthcare questions — provide helpful general information while noting limitations.

Language behavior:
- When the requested language is ENGLISH, respond in English.
- When the requested language is URDU, respond in Urdu script.
- When the requested language is ROMAN_URDU, respond in Roman Urdu (Urdu written in English/Latin script).
- Always respond in the requested language.`;

/**
 * Build the user-facing prompt sent to the AI provider.
 */
function buildMessages(message, language) {
  const langInstruction = {
    ENGLISH: "Respond in English.",
    URDU: "Respond in Urdu script.",
    ROMAN_URDU: "Respond in Roman Urdu (Urdu written in English/Latin script).",
  };

  return [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: `${message}\n\n[${langInstruction[language] || langInstruction.ENGLISH}]`,
    },
  ];
}

/**
 * Call the configured OpenAI-compatible AI provider.
 *
 * Environment variables:
 *   AI_PROVIDER_API_KEY  – Bearer token for the AI provider
 *   AI_PROVIDER_BASE_URL – API base URL (default: https://api.openai.com)
 *   AI_PROVIDER_MODEL    – Model name (default: gpt-4o-mini)
 */
async function callAIProvider(messages) {
  const apiKey = process.env.AI_PROVIDER_API_KEY;
  const baseUrl = (process.env.AI_PROVIDER_BASE_URL || "https://api.openai.com").replace(/\/+$/, "");
  const model = process.env.AI_PROVIDER_MODEL || "gpt-4o-mini";

  if (!apiKey) {
    throw new Error("AI provider is not configured");
  }

  const body = JSON.stringify({
    model,
    messages,
    max_tokens: 1024,
    temperature: 0.7,
  });

  const url = new URL(`${baseUrl}/v1/chat/completions`);
  const transport = url.protocol === "https:" ? https : http;

  return new Promise((resolve, reject) => {
    const req = transport.request(
      {
        method: "POST",
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
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
                parsed?.error?.message || `AI provider returned status ${res.statusCode}`;
              return reject(new Error(errMsg));
            }

            const content = parsed?.choices?.[0]?.message?.content;
            if (!content) {
              return reject(new Error("AI provider returned an empty response"));
            }

            resolve(content.trim());
          } catch (parseErr) {
            reject(new Error("Failed to parse AI provider response"));
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
 * Generate an AI assistant response for a patient message.
 *
 * @param {string} message  – The patient's text message
 * @param {string} language – One of ENGLISH, URDU, ROMAN_URDU
 * @returns {Promise<string>} The AI-generated response
 */
async function generateResponse(message, language) {
  const messages = buildMessages(message, language);
  return callAIProvider(messages);
}

module.exports = {
  generateResponse,
  SUPPORTED_LANGUAGES,
  MAX_MESSAGE_LENGTH,
};
