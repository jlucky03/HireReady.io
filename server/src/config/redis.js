import { createClient } from "redis";

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
  socket: {
    reconnectStrategy: false,
  },
});

redisClient.on("connect", () => {
  console.log("✅ Redis connected");
});

redisClient.on("error", (err) => {
  console.error("❌ Redis error:", err.message);
});

export const connectRedis = async () => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  } catch (err) {
    console.error("Redis connection failed:", err.message);
  }
};

export default redisClient;