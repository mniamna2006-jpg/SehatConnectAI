const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");

const { loadFreshWithMocks } = require("./helpers/load-with-mocks");
const { createExpressMock, createResponse } = require("./helpers/route-harness");

const routePath = path.resolve(
  __dirname,
  "../src/routes/notification.routes.js"
);

test("notification 500 responses hide internal errors and log them", async (t) => {
  const sentinel = "SQL_INTERNAL_SENTINEL";
  const databaseError = new Error(sentinel);
  const throwDatabaseError = async () => {
    throw databaseError;
  };
  const prisma = {
    notification: {
      findMany: throwDatabaseError,
      count: throwDatabaseError,
      findFirst: throwDatabaseError,
      update: throwDatabaseError,
      updateMany: throwDatabaseError,
    },
  };
  const harness = createExpressMock();

  loadFreshWithMocks(routePath, {
    express: harness.express,
    "../config/prisma": prisma,
    "../middleware/auth.middleware": {
      authenticateToken: (_req, _res, next) => next(),
    },
  });

  const cases = [
    {
      method: "GET",
      path: "/my",
      message: "Failed to fetch notifications",
    },
    {
      method: "GET",
      path: "/unread-count",
      message: "Failed to fetch unread notification count",
    },
    {
      method: "PATCH",
      path: "/:notification_id/read",
      message: "Failed to update notification",
      params: { notification_id: "notification-1" },
    },
    {
      method: "PATCH",
      path: "/read-all",
      message: "Failed to update notifications",
    },
  ];

  for (const testCase of cases) {
    await t.test(`${testCase.method} ${testCase.path}`, async () => {
      const route = harness.findRoute(testCase.method, testCase.path);
      const handler = route.handlers[route.handlers.length - 1];
      const response = createResponse();
      const logged = [];
      const originalConsoleError = console.error;
      console.error = (...args) => logged.push(args);

      try {
        await handler(
          {
            params: testCase.params || {},
            user: { user_id: "user-1" },
          },
          response
        );
      } finally {
        console.error = originalConsoleError;
      }

      assert.equal(response.statusCode, 500);
      assert.deepEqual(response.body, {
        success: false,
        message: testCase.message,
      });
      assert.equal(JSON.stringify(response.body).includes(sentinel), false);
      assert.equal(
        logged.some((entry) => entry.includes(databaseError)),
        true
      );
    });
  }
});
