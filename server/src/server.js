import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

import authRoutes from './routes/authRoutes.js';
import interviewRoutes from './routes/interviewRoutes.js';
// ---- FIXED PATH RESOLUTION LINE HERE ----
import resumeRoutes from './routes/resumeRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/resume', resumeRoutes);

app.get('/', (req, res) => {
  res.send('Intervyo.ai Core System API is online...');
});

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/intervyo';
mongoose
  .connect(MONGO_URI)
  .then(() => console.log('🚀 Database connection established successfully!'))
  .catch((err) => console.error('❌ Database connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server application running smoothly on port ${PORT}.`);
});