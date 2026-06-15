import amqp from "amqplib";

let connection;
let channel;

export const AI_EVALUATION_QUEUE = "ai-evaluation-queue";
export const AI_EVALUATION_DLQ = "ai-evaluation-dlq";

export const connectRabbitMQ = async () => {
  try {
    connection = await amqp.connect(
      process.env.RABBITMQ_URL || "amqp://localhost:5672"
    );

    channel = await connection.createChannel();

    await channel.assertQueue(AI_EVALUATION_DLQ, {
      durable: true,
    });

    await channel.assertQueue(AI_EVALUATION_QUEUE, {
      durable: true,
      arguments: {
        "x-dead-letter-exchange": "",
        "x-dead-letter-routing-key": AI_EVALUATION_DLQ,
      },
    });

    console.log("✅ RabbitMQ connected");
  } catch (err) {
    console.error("❌ RabbitMQ connection failed:", err.message);
    throw err;
  }
};

export const getRabbitChannel = () => channel;

export const publishEvaluationJob = async (payload) => {
  if (!channel) {
    throw new Error("RabbitMQ channel not initialized");
  }

  if (!payload?.interviewId) {
    throw new Error("Invalid evaluation job payload");
  }

  const sent = channel.sendToQueue(
    AI_EVALUATION_QUEUE,
    Buffer.from(JSON.stringify(payload)),
    { persistent: true }
  );

  if (!sent) {
    console.warn("⚠️ RabbitMQ publish buffer is full");
  }
};