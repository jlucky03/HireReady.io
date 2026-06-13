import redisClient from "../config/redis.js";

export const redisRateLimiter = ({
  keyPrefix,
  limit,
  windowSeconds,
  message,
}) => {
  return async (req, res, next) => {
    try {
      const userKey = req.user?._id || req.ip;
      const key = `rl:${keyPrefix}:${userKey}`;

   const count = await redisClient.incr(key);

if (count === 1) {
  await redisClient.expire(key, windowSeconds);
}

      if (count > limit) {
        const ttl = await redisClient.ttl(key);

        return res.status(429).json({
          message:
            message ||
            `Too many requests. Try again after ${ttl} seconds.`,
          retryAfter: ttl,
        });
      }

      next();
    } catch (err) {
      console.error("Rate limiter error:", err.message);
      next();
    }
  };
};