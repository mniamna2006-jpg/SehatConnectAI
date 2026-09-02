const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");

const { loadFreshWithMocks } = require("./helpers/load-with-mocks");
const { createExpressMock, createResponse } = require("./helpers/route-harness");

const routePath = path.resolve(__dirname, "../src/routes/ai.routes.js");

class AIProviderError extends Error {}

function loadAiRoutes({
  analyzeSymptoms,
  prisma,
  authenticateToken = (_req, _res, next) => next(),
  authorizeRole = (_req, _res, next) => next(),
  rateLimit = (_req, _res, next) => next(),
}) {
  const harness = createExpressMock();

  loadFreshWithMocks(routePath, {
    express: harness.express,
    "../config/prisma": prisma,
    "../middleware/auth.middleware": {
      authenticateToken,
      authorizeRoles: () => authorizeRole,
    },
    "../middleware/ai-rate-limit.middleware": {
      aiChatRateLimit: rateLimit,
    },
    "../services/ai.service": {
      AIProviderError,
      analyzeSymptoms,
      SUPPORTED_LANGUAGES: ["ENGLISH", "URDU", "ROMAN_URDU"],
      MAX_MESSAGE_LENGTH: 2000,
    },
  });

  return harness;
}

function loadChatHandler(options) {
  const harness = loadAiRoutes(options);

  const route = harness.findRoute("POST", "/chat");
  return route.handlers[route.handlers.length - 1];
}

async function invokeMiddlewareChain(handlers, request, response) {
  let index = 0;

  async function next() {
    const handler = handlers[index];
    index += 1;
    if (handler) {
      await handler(request, response, next);
    }
  }

  await next();
}

async function invokeChat(handler, body = {}) {
  const response = createResponse();
  const originalConsoleError = console.error;
  console.error = () => {};

  try {
    await handler(
      {
        body: {
          message: "Chest pain",
          language: "ENGLISH",
          ...body,
        },
        user: { user_id: "user-1" },
      },
      response
    );
  } finally {
    console.error = originalConsoleError;
  }

  return response;
}

function createAtomicPrisma({
  existingConversation = null,
  failAiMessage = false,
} = {}) {
  const state = {
    conversations: [],
    messages: [],
    updates: [],
    transactionCalls: 0,
    writesOutsideTransaction: 0,
  };

  const writeConversation = async (query) => {
    const conversation = {
      conversation_id: "conversation-new",
      ...query.data,
    };
    state.conversations.push(conversation);
    return { conversation_id: conversation.conversation_id };
  };
  const writeMessage = async (query) => {
    state.messages.push(query.data);
    if (failAiMessage && query.data.sender === "AI") {
      throw new Error("AI message persistence failed");
    }
    return query.data;
  };
  const updateConversation = async (query) => {
    state.updates.push(query);
    return { conversation_id: query.where.conversation_id };
  };

  const prisma = {
    patient: {
      findUnique: async () => ({ patient_id: "patient-1" }),
    },
    aIConversation: {
      findFirst: async () => existingConversation,
      create: async (query) => {
        state.writesOutsideTransaction += 1;
        return writeConversation(query);
      },
      update: async (query) => {
        state.writesOutsideTransaction += 1;
        return updateConversation(query);
      },
    },
    aIMessage: {
      create: async (query) => {
        state.writesOutsideTransaction += 1;
        return writeMessage(query);
      },
    },
    department: {
      findMany: async () => [],
    },
    doctor: {
      findMany: async () => [],
    },
    async $transaction(callback) {
      state.transactionCalls += 1;
      const snapshot = {
        conversations: state.conversations.length,
        messages: state.messages.length,
        updates: state.updates.length,
      };
      const transaction = {
        aIConversation: {
          create: writeConversation,
          update: updateConversation,
        },
        aIMessage: {
          create: writeMessage,
        },
      };

      try {
        return await callback(transaction);
      } catch (error) {
        state.conversations.length = snapshot.conversations;
        state.messages.length = snapshot.messages;
        state.updates.length = snapshot.updates;
        throw error;
      }
    },
  };

  return { prisma, state };
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

test("failed new chat creates no conversation or messages", async () => {
  const { prisma, state } = createAtomicPrisma();
  const handler = loadChatHandler({
    analyzeSymptoms: async () => {
      throw new AIProviderError("provider unavailable");
    },
    prisma,
  });

  const response = await invokeChat(handler);

  assert.equal(response.statusCode, 502);
  assert.equal(state.conversations.length, 0);
  assert.equal(state.messages.length, 0);
  assert.equal(state.transactionCalls, 0);
});

test("failed existing chat adds no USER message", async () => {
  const { prisma, state } = createAtomicPrisma({
    existingConversation: { conversation_id: "conversation-existing" },
  });
  const handler = loadChatHandler({
    analyzeSymptoms: async () => {
      throw new AIProviderError("provider unavailable");
    },
    prisma,
  });

  const response = await invokeChat(handler, {
    conversation_id: "conversation-existing",
  });

  assert.equal(response.statusCode, 502);
  assert.equal(state.messages.length, 0);
  assert.equal(state.transactionCalls, 0);
});

test("malformed provider output changes no history", async () => {
  const { prisma, state } = createAtomicPrisma();
  const handler = loadChatHandler({
    analyzeSymptoms: async () => {
      throw new AIProviderError("AI provider returned invalid output");
    },
    prisma,
  });

  await invokeChat(handler);

  assert.deepEqual(state.conversations, []);
  assert.deepEqual(state.messages, []);
  assert.deepEqual(state.updates, []);
});

test("AI message persistence failure rolls back USER message and conversation", async () => {
  const { prisma, state } = createAtomicPrisma({ failAiMessage: true });
  const handler = loadChatHandler({
    analyzeSymptoms: async () => ({
      recommended_department: "Cardiology",
      message: "Seek care.",
      is_emergency: true,
    }),
    prisma,
  });

  const response = await invokeChat(handler);

  assert.equal(response.statusCode, 500);
  assert.equal(state.transactionCalls, 1);
  assert.deepEqual(state.conversations, []);
  assert.deepEqual(state.messages, []);
  assert.deepEqual(state.updates, []);
});

test("successful new chat atomically stores exactly one USER and AI pair", async () => {
  const { prisma, state } = createAtomicPrisma();
  const handler = loadChatHandler({
    analyzeSymptoms: async () => ({
      recommended_department: "General Medicine",
      message: "Please consult a doctor.",
      is_emergency: false,
    }),
    prisma,
  });

  const response = await invokeChat(handler);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.data.conversation_id, "conversation-new");
  assert.equal(state.transactionCalls, 1);
  assert.equal(state.writesOutsideTransaction, 0);
  assert.deepEqual(
    state.messages.map((message) => message.sender),
    ["USER", "AI"]
  );
  assert.equal(state.conversations.length, 1);
  assert.equal(state.updates.length, 1);
});

test("conversation ownership is checked before provider invocation", async () => {
  const { prisma, state } = createAtomicPrisma({
    existingConversation: null,
  });
  let providerCalls = 0;
  const handler = loadChatHandler({
    analyzeSymptoms: async () => {
      providerCalls += 1;
      return {
        recommended_department: "General Medicine",
        message: "Please consult a doctor.",
        is_emergency: false,
      };
    },
    prisma,
  });

  const response = await invokeChat(handler, {
    conversation_id: "not-owned",
  });

  assert.equal(response.statusCode, 404);
  assert.equal(providerCalls, 0);
  assert.equal(state.transactionCalls, 0);
  assert.deepEqual(state.messages, []);
});

test("AI limiter runs after authentication and only on POST /chat", async () => {
  const events = [];
  const prisma = {
    patient: {
      findUnique: async () => null,
    },
  };
  const harness = loadAiRoutes({
    analyzeSymptoms: async () => {
      events.push("provider");
    },
    prisma,
    authenticateToken: (req, _res, next) => {
      events.push("authenticate");
      req.user = { user_id: "user-1", role: "PATIENT" };
      return next();
    },
    authorizeRole: (_req, _res, next) => {
      events.push("authorize");
      return next();
    },
    rateLimit: (_req, _res, next) => {
      events.push("rate-limit");
      return next();
    },
  });

  const chat = harness.findRoute("POST", "/chat");
  await invokeMiddlewareChain(
    chat.handlers,
    { body: { message: "Headache" }, headers: {} },
    createResponse()
  );
  assert.deepEqual(events, ["authenticate", "authorize", "rate-limit"]);

  events.length = 0;
  const history = harness.findRoute("GET", "/history");
  await invokeMiddlewareChain(
    history.handlers,
    { headers: {} },
    createResponse()
  );
  assert.deepEqual(events, ["authenticate", "authorize"]);
});
