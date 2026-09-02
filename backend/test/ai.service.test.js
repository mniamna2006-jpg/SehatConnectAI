const assert = require("node:assert/strict");
const { EventEmitter } = require("node:events");
const path = require("node:path");
const test = require("node:test");

const { loadFreshWithMocks } = require("./helpers/load-with-mocks");

const servicePath = path.resolve(__dirname, "../src/services/ai.service.js");

function createHttpsResponse(rawProviderText) {
  return {
    request(_options, onResponse) {
      const request = new EventEmitter();
      request.write = () => {};
      request.end = () => {
        const response = new EventEmitter();
        response.statusCode = 200;

        queueMicrotask(() => {
          onResponse(response);
          response.emit(
            "data",
            JSON.stringify({
              candidates: [
                {
                  content: {
                    parts: [{ text: rawProviderText }],
                  },
                },
              ],
            })
          );
          response.emit("end");
        });
      };
      return request;
    },
  };
}

async function analyzeProviderText(rawProviderText) {
  const previousApiKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = "test-key";

  try {
    const { analyzeSymptoms } = loadFreshWithMocks(servicePath, {
      https: createHttpsResponse(rawProviderText),
    });
    return await analyzeSymptoms("I have chest pain", "ENGLISH");
  } finally {
    if (previousApiKey === undefined) {
      delete process.env.GEMINI_API_KEY;
    } else {
      process.env.GEMINI_API_KEY = previousApiKey;
    }
  }
}

test("rejects malformed provider JSON", async () => {
  await assert.rejects(
    analyzeProviderText("not-json"),
    /AI provider returned invalid output/
  );
});

test("rejects empty provider output", async () => {
  await assert.rejects(
    analyzeProviderText(""),
    /AI provider returned invalid output/
  );
});

test("rejects output missing is_emergency", async () => {
  await assert.rejects(
    analyzeProviderText(
      JSON.stringify({
        recommended_department: "Cardiology",
        message: "Please seek medical care.",
      })
    ),
    /AI provider returned invalid output/
  );
});

test("rejects non-boolean is_emergency", async () => {
  await assert.rejects(
    analyzeProviderText(
      JSON.stringify({
        recommended_department: "Cardiology",
        message: "Please seek medical care.",
        is_emergency: "false",
      })
    ),
    /AI provider returned invalid output/
  );
});

test("rejects missing or empty required text fields", async (t) => {
  const invalidOutputs = [
    { message: "Please seek care.", is_emergency: false },
    {
      recommended_department: " ",
      message: "Please seek care.",
      is_emergency: false,
    },
    { recommended_department: "Cardiology", is_emergency: false },
    {
      recommended_department: "Cardiology",
      message: " ",
      is_emergency: false,
    },
  ];

  for (const output of invalidOutputs) {
    await t.test(JSON.stringify(output), async () => {
      await assert.rejects(
        analyzeProviderText(JSON.stringify(output)),
        /AI provider returned invalid output/
      );
    });
  }
});

test("accepts valid non-emergency output", async () => {
  const result = await analyzeProviderText(
    JSON.stringify({
      recommended_department: "General Medicine",
      message: "Please consult a doctor.",
      is_emergency: false,
    })
  );

  assert.deepEqual(result, {
    recommended_department: "General Medicine",
    message: "Please consult a doctor.",
    is_emergency: false,
  });
});

test("accepts valid emergency output", async () => {
  const result = await analyzeProviderText(
    JSON.stringify({
      recommended_department: "Cardiology",
      message: "Call 1122 and seek emergency care now.",
      is_emergency: true,
    })
  );

  assert.deepEqual(result, {
    recommended_department: "Cardiology",
    message: "Call 1122 and seek emergency care now.",
    is_emergency: true,
  });
});

test("does not expose malformed Gemini content in errors", async () => {
  const sentinel = "RAW_GEMINI_SECRET_SENTINEL";

  await assert.rejects(analyzeProviderText(sentinel), (error) => {
    assert.equal(error.message.includes(sentinel), false);
    return true;
  });
});
