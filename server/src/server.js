import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

import authRoutes from './routes/authRoutes.js';
import interviewRoutes from './routes/interviewRoutes.js';
import resumeRoutes from './routes/resumeRoutes.js';
import oaRoutes from './routes/oaRoutes.js';

const app = express();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// 🌟 Secure API Endpoint Wireframes
app.use('/api/auth', authRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/dsa', oaRoutes);

app.get('/', (req, res) => {
  res.send('Intervyo.ai Core System API is online...');
});

// Establish Core Database Connection Engine exactly as originally structured
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/intervyo';
mongoose
  .connect(MONGO_URI)
  .then(() => console.log('🚀 Database connection established successfully!'))
  .catch((err) => console.error('❌ Database connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server application running smoothly on port ${PORT}.`);
});