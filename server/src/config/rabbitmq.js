import amqp from "amqplib";

let connection;
let channel;

export const AI_EVALUATION_QUEUE = "ai-evaluation-queue";

export const connectRabbitMQ = async () => {
  try {
    connection = await amqp.connect(
      process.env.RABBITMQ_URL || "amqp://localhost:5672"
    );

    channel = await connection.createChannel();

    await channel.assertQueue(AI_EVALUATION_QUEUE, {
      durable: true,
    });

    console.log("✅ RabbitMQ connected");
  } catch (err) {
    console.error("❌ RabbitMQ connection failed:", err.message);
  }
};

export const getRabbitChannel = () => channel;

export const publishEvaluationJob = async (payload) => {
  if (!channel) {
    throw new Error("RabbitMQ channel not initialized");
  }

  channel.sendToQueue(
    AI_EVALUATION_QUEUE,
    Buffer.from(JSON.stringify(payload)),
    { persistent: true }
  );
};