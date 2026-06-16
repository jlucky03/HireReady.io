import mongoose from "mongoose";
import { getRabbitChannel } from "../config/rabbitmq.js";
import { getRedisClient } from "../config/redis.js";

const mongoStates = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting",
};

export const getHealthStatus = async (req, res) => {
  const mongo = mongoStates[mongoose.connection.readyState] || "unknown";

  let redis = "disconnected";
  try {
    const redisClient = getRedisClient();
    redis = redisClient?.isReady ? "connected" : "disconnected";
  } catch {
    redis = "disconnected";
  }

  let rabbitmq = "disconnected";
  try {
    rabbitmq = getRabbitChannel() ? "connected" : "disconnected";
  } catch {
    rabbitmq = "disconnected";
  }

  const allConnected =
    mongo === "connected" &&
    redis === "connected" &&
    rabbitmq === "connected";

  return res.status(allConnected ? 200 : 503).json({
    status: allConnected ? "ok" : "degraded",
    server: "running",
    mongo,
    redis,
    rabbitmq,
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
};