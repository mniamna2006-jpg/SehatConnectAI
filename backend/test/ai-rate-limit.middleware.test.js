const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");

const { createResponse } = require("./helpers/route-harness");

const middlewarePath = path.resolve(
  __dirname,
  "../src/middleware/ai-rate-limit.middleware.js"
);

function requestFor(userId) {
  return { user: { user_id: userId } };
}

test("limits each user and returns stable 429 with Retry-After", () => {
  let currentTime = 1_000;
  const { createAiChatRateLimit } = require(middlewarePath);
  const limiter = createAiChatRateLimit({
    maxRequests: 2,
    windowMs: 60_000,
    now: () => currentTime,
  });
  let allowed = 0;

  limiter(requestFor("user-1"), createResponse(), () => {
    allowed += 1;
  });
  limiter(requestFor("user-1"), createResponse(), () => {
    allowed += 1;
  });
  const blockedResponse = createResponse();
  limiter(requestFor("user-1"), blockedResponse, () => {
    allowed += 1;
  });

  assert.equal(allowed, 2);
  assert.equal(blockedResponse.statusCode, 429);
  assert.equal(blockedResponse.headers["retry-after"], "60");
  assert.deepEqual(blockedResponse.body, {
    success: false,
    message: "Too many AI chat requests. Please try again later.",
  });

  currentTime += 60_000;
  const resetResponse = createResponse();
  limiter(requestFor("user-1"), resetResponse, () => {
    allowed += 1;
  });
  assert.equal(allowed, 3);
  assert.equal(resetResponse.statusCode, 200);
});

test("uses independent counters for authenticated users", () => {
  const { createAiChatRateLimit } = require(middlewarePath);
  const limiter = createAiChatRateLimit({
    maxRequests: 1,
    windowMs: 60_000,
    now: () => 1_000,
  });
  let userOneAllowed = 0;
  let userTwoAllowed = 0;

  limiter(requestFor("user-1"), createResponse(), () => {
    userOneAllowed += 1;
  });
  limiter(requestFor("user-1"), createResponse(), () => {
    userOneAllowed += 1;
  });
  limiter(requestFor("user-2"), createResponse(), () => {
    userTwoAllowed += 1;
  });

  assert.equal(userOneAllowed, 1);
  assert.equal(userTwoAllowed, 1);
});
