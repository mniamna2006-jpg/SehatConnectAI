const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_MAX_REQUESTS = 10;

function positiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function createAiChatRateLimit({
  windowMs = DEFAULT_WINDOW_MS,
  maxRequests = DEFAULT_MAX_REQUESTS,
  now = Date.now,
} = {}) {
  const requestsByUser = new Map();
  let nextCleanupAt = now() + windowMs;

  return function aiChatRateLimit(req, res, next) {
    const userId = req.user?.user_id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const currentTime = now();

    if (currentTime >= nextCleanupAt) {
      for (const [key, value] of requestsByUser) {
        if (currentTime >= value.resetAt) {
          requestsByUser.delete(key);
        }
      }
      nextCleanupAt = currentTime + windowMs;
    }

    const existing = requestsByUser.get(userId);

    if (!existing || currentTime >= existing.resetAt) {
      requestsByUser.set(userId, {
        count: 1,
        resetAt: currentTime + windowMs,
      });
      return next();
    }

    if (existing.count >= maxRequests) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((existing.resetAt - currentTime) / 1000)
      );
      res.set("Retry-After", retryAfterSeconds);
      return res.status(429).json({
        success: false,
        message: "Too many AI chat requests. Please try again later.",
      });
    }

    existing.count += 1;
    return next();
  };
}

const aiChatRateLimit = createAiChatRateLimit({
  windowMs: positiveInteger(
    process.env.AI_CHAT_RATE_LIMIT_WINDOW_MS,
    DEFAULT_WINDOW_MS
  ),
  maxRequests: positiveInteger(
    process.env.AI_CHAT_RATE_LIMIT_MAX,
    DEFAULT_MAX_REQUESTS
  ),
});

module.exports = {
  aiChatRateLimit,
  createAiChatRateLimit,
};
