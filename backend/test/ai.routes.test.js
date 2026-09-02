const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");

const { loadFreshWithMocks } = require("./helpers/load-with-mocks");
const { createExpressMock, createResponse } = require("./helpers/route-harness");

const routePath = path.resolve(__dirname, "../src/routes/ai.routes.js");

class AIProviderError extends Error {}

function loadChatHandler({ analyzeSymptoms, prisma }) {
  const harness = createExpressMock();

  loadFreshWithMocks(routePath, {
    express: harness.express,
    "../config/prisma": prisma,
    "../middleware/auth.middleware": {
      authenticateToken: (_req, _res, next) => next(),
      authorizeRoles: () => (_req, _res, next) => next(),
    },
    "../services/ai.service": {
      AIProviderError,
      analyzeSymptoms,
      SUPPORTED_LANGUAGES: ["ENGLISH", "URDU", "ROMAN_URDU"],
      MAX_MESSAGE_LENGTH: 2000,
    },
  });

  const route = harness.findRoute("POST", "/chat");
  return route.handlers[route.handlers.length - 1];
}

test("invalid provider output returns generic 502 without raw content", async () => {
  const sentinel = "RAW_GEMINI_SECRET_SENTINEL";
  const prisma = {
    patient: {
      findUnique: async () => ({ patient_id: "patient-1" }),
    },
    aIConversation: {
      create: async () => ({ conversation_id: "conversation-1" }),
    },
    aIMessage: {
      create: async () => ({}),
    },
  };
  const handler = loadChatHandler({
    analyzeSymptoms: async () => {
      throw new AIProviderError(`invalid output: ${sentinel}`);
    },
    prisma,
  });
  const response = createResponse();
  const originalConsoleError = console.error;
  console.error = () => {};

  try {
    await handler(
      {
        body: { message: "Chest pain", language: "ENGLISH" },
        user: { user_id: "user-1" },
      },
      response
    );
  } finally {
    console.error = originalConsoleError;
  }

  assert.equal(response.statusCode, 502);
  assert.deepEqual(response.body, {
    success: false,
    message: "AI assistant is currently unavailable",
  });
  assert.equal(JSON.stringify(response.body).includes(sentinel), false);
});
