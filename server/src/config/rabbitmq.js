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

    connection.on("error", (err) => {
  console.warn("RabbitMQ connection error:", err.message);
});

connection.on("close", () => {
  console.warn("RabbitMQ connection closed. Running without queue.");
});

    channel = await connection.createChannel();

    channel.on("error", (err) => {
  console.warn("RabbitMQ channel error:", err.message);
});

channel.on("close", () => {
  console.warn("RabbitMQ channel closed.");
});

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
   console.warn("⚠️ RabbitMQ disabled:", err.message);
connection = null;
channel = null;
  }
};

export const getRabbitChannel = () => channel;

export const publishEvaluationJob = async (payload) => {
  if (!payload?.interviewId) {
    console.warn("Invalid evaluation job payload");
    return false;
  }

  if (!channel) {
    console.warn("RabbitMQ unavailable. Skipping queue publish.");
    return false;
  }

  try {
    const sent = channel.sendToQueue(
      AI_EVALUATION_QUEUE,
      Buffer.from(JSON.stringify(payload)),
      { persistent: true }
    );

    if (!sent) console.warn("RabbitMQ publish buffer is full");
    return sent;
  } catch (err) {
    console.warn("RabbitMQ publish failed:", err.message);
    channel = null;
    return false;
  }
};