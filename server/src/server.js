import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import mongoose from 'mongoose';
import paymentRoutes from './routes/paymentRoutes.js'
import { connectRedis } from "./config/redis.js";
import cors from 'cors';
import errorHandler from "./middleware/errorHandler.js";
import authRoutes from './routes/authRoutes.js';
import interviewRoutes from './routes/interviewRoutes.js';
import resumeRoutes from './routes/resumeRoutes.js';
import oaRoutes from './routes/oaRoutes.js';
import { connectRabbitMQ } from "./config/rabbitmq.js";
import healthRoutes from "./routes/healthRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://localhost",
  ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL.trim()] : []),
  ...(process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean)
    : []),
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));
app.use(express.json());

// 🌟 Secure API Endpoint Wireframes
app.use('/api/auth', authRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/dsa', oaRoutes);
app.use('/api/payments', paymentRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/admin", adminRoutes);
app.get('/', (req, res) => {
  res.send('Intervyo.ai Core System API is online...');
});
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
});

app.use(errorHandler);




// Establish Core Database Connection Engine exactly as originally structured
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/intervyo';
mongoose
  .connect(MONGO_URI)
  .then(() => console.log('🚀 Database connection established successfully!'))
  .catch((err) => console.error('❌ Database connection error:', err));
connectRedis();
connectRabbitMQ();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server application running smoothly on port ${PORT}.`);
});