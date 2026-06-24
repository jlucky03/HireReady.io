# HireReady AI

HireReady AI is a full-stack AI-powered interview and resume preparation platform built for job seekers. It combines resume ATS analysis, AI voice interview simulation, credit-based usage, payments, interview analytics, and admin/user dashboards in one practical job-preparation product.

> Status: MVP / portfolio-ready foundation. The project demonstrates real full-stack architecture and integrations, but should be hardened further before production use.

## Problem Statement

Job seekers often struggle to understand why their resumes are not shortlisted and how well they can perform in technical interviews. HireReady AI helps users practice with AI-driven interview sessions, analyze resumes for ATS compatibility, track progress, and manage usage through credits.

## Key Features

| Feature | Description |
| --- | --- |
| Firebase Auth | Email/password and Google authentication using Firebase. |
| ATS Resume Analyzer | Upload a resume PDF and receive an AI-generated ATS score, summary, and improvement suggestions using Groq API. |
| AI Voice Interview | Simulated voice interview flow with generated questions, speech input support, and final AI evaluation. |
| Credit System | Credit-based access model for ATS scans and interview sessions. |
| Razorpay Payments | Credit purchase flow using Razorpay order creation and signature verification. |
| Payment History | Users can view completed credit purchase history. |
| Redis Cache With Fallback | Resume analysis caching and rate limiting use Redis, while core app behavior can continue if Redis is unavailable. |
| RabbitMQ Async Evaluation With Direct Fallback | Interview evaluation is designed around asynchronous background processing, with fallback behavior for resilient evaluation handling. |
| Analytics Dashboard | Users can view interview history, scores, progress, weak areas, and topic-wise performance. |
| Admin/User Routing | Role-based admin and user dashboard routing with admin tools for users, credits, health, and failed evaluations. |

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React, Vite, Tailwind CSS, Zustand |
| Authentication | Firebase Auth, Firebase Admin SDK |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| AI | Groq API |
| Payments | Razorpay |
| Cache / Rate Limit | Redis |
| Queue / Worker | RabbitMQ, background evaluation worker |
| Charts / UI | Recharts, Lucide React |

## Architecture Overview

```text
User Browser
  |
  | React + Vite frontend
  v
Express API Server
  |
  |-- Firebase Admin SDK -> verifies Firebase ID token
  |-- MongoDB/Mongoose -> users, interviews, payments, exams
  |-- Groq API -> resume analysis and AI interview generation
  |-- Redis -> ATS cache and rate limiting
  |-- Razorpay -> credit purchase orders and verification
  |
  v
RabbitMQ Queue
  |
  v
Evaluation Worker
  |
  |-- Groq API -> final interview evaluation
  |-- MongoDB -> stores score, feedback, strengths, weaknesses
```

## Main User Flow

1. User signs up or logs in with Firebase Auth.
2. Backend verifies the Firebase token and syncs the user in MongoDB.
3. User uploads a resume PDF for ATS analysis.
4. Resume text is extracted, analyzed with Groq, cached in Redis, and credits are deducted.
5. User starts an AI voice interview using a topic or resume-based context.
6. Interview answers are stored and the final evaluation is queued through RabbitMQ.
7. Worker evaluates the interview and updates the report in MongoDB.
8. User views score, feedback, progress analytics, and history.
9. User can buy more credits through Razorpay and view payment history.

## Backend Architecture

The backend follows a modular Express structure:

- `routes/` defines API endpoints by domain.
- `controllers/` contains request handling and business workflows.
- `models/` contains Mongoose schemas.
- `middleware/` contains validation, rate limiting, error handling, and admin access logic.
- `config/` contains Firebase Admin, Redis, and RabbitMQ setup.
- `workers/` contains background interview evaluation logic.

Main backend domains:

| Domain | Responsibility |
| --- | --- |
| Auth | Firebase login sync, protected user session, role handling |
| Resume | PDF parsing, ATS analysis, Redis caching, credit usage |
| Interview | AI question generation, answer submission, history, analytics |
| Payments | Razorpay order creation, signature verification, credit updates |
| Admin | Overview, user management, failed evaluation retry, system health |
| Health | MongoDB, Redis, RabbitMQ, and API status checks |

## Redis Caching Strategy

Redis is used for:

- ATS resume analysis caching by user and resume hash.
- API rate limiting for expensive AI-backed endpoints.
- Reducing duplicate Groq API calls for repeated resume scans.

Example strategy:

```text
Resume PDF -> Extract text -> Hash text -> Check Redis
  |
  |-- Cache hit -> return saved ATS result, no credit deduction
  |
  |-- Cache miss -> call Groq, deduct credit, save result to Redis
```

## RabbitMQ Evaluation Pipeline

The AI voice interview uses an async evaluation pipeline:

```text
User submits final answer
  |
  v
API marks interview as "evaluating"
  |
  v
API publishes evaluation job to RabbitMQ
  |
  v
Worker consumes job
  |
  v
Worker calls Groq for strict interview scoring
  |
  v
Worker updates MongoDB with final score and feedback
```

If evaluation fails, the interview can be marked as failed and retried from the user/admin flow.

## Razorpay Payment Flow

```text
User selects credit plan
  |
  v
Backend creates Razorpay order
  |
  v
Frontend opens Razorpay checkout
  |
  v
Razorpay returns payment response
  |
  v
Backend verifies signature
  |
  v
Credits are added and payment is marked paid
```

Payment verification uses Razorpay signature validation before adding credits.

## Admin/User Access Flow

```text
Firebase Login
  |
  v
Backend verifies token
  |
  v
User record loaded from MongoDB
  |
  |-- role = user  -> User Dashboard
  |
  |-- role = admin -> Admin Dashboard
```

Admin access is controlled through configured admin email addresses.

## Local Setup Instructions

### 1. Clone the repository

```bash
git clone <your-repository-url>
cd HireReady-AI
```

### 2. Install dependencies

```bash
cd server
npm install

cd ../client
npm install
```

### 3. Configure environment variables

Create environment files for the client and server. Use placeholders only in committed files and keep real secrets local.

### 4. Start local services

Start MongoDB, Redis, and RabbitMQ using Docker or local installations.

```bash
docker compose -f docker-compose.yml up -d
docker compose -f docker-compose.services.yml up -d
```

### 5. Start backend

```bash
cd server
npm run dev
```

### 6. Start evaluation worker

```bash
cd server
npm run worker
```

### 7. Start frontend

```bash
cd client
npm run dev
```

Frontend usually runs on:

```text
http://localhost:5173
```

Backend usually runs on:

```text
http://localhost:5000
```

## Environment Variables

Use these placeholders locally. Do not commit real secrets.

```env
GROQ_API_KEY=
MONGO_URI=
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
REDIS_URL=
RABBITMQ_URL=
ADMIN_EMAILS=
CLIENT_URL=
```

Suggested frontend variables:

```env
VITE_API_URL=
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
```

## Folder Structure

```text
HireReady AI
├── client
│   ├── public
│   ├── src
│   │   ├── config
│   │   ├── hooks
│   │   ├── store
│   │   ├── App.jsx
│   │   ├── DashboardHome.jsx
│   │   ├── InterviewRoom.jsx
│   │   ├── EvaluationReport.jsx
│   │   ├── ProgressAnalytics.jsx
│   │   ├── AdminDashboard.jsx
│   │   ├── BuyCredits.jsx
│   │   └── PaymentHistory.jsx
│   ├── package.json
│   └── vite.config.js
│
├── server
│   ├── src
│   │   ├── config
│   │   ├── controllers
│   │   ├── middleware
│   │   ├── models
│   │   ├── routes
│   │   ├── validators
│   │   ├── workers
│   │   └── server.js
│   └── package.json
│
├── docker-compose.yml
├── docker-compose.services.yml
└── README.md
```

## Scripts / Commands

### Frontend

| Command | Description |
| --- | --- |
| `npm run dev` | Start Vite development server |
| `npm run build` | Build frontend for production |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build |

### Backend

| Command | Description |
| --- | --- |
| `npm run dev` | Start Express server with Nodemon |
| `npm start` | Start Express server |
| `npm run worker` | Start RabbitMQ evaluation worker |

## Screenshots

Add screenshots after running the application locally.

| Screen | Preview |
| --- | --- |
| Login / Signup | `screenshots/auth.png` |
| User Dashboard | `screenshots/dashboard.png` |
| ATS Resume Analyzer | `screenshots/ats-analyzer.png` |
| AI Voice Interview | `screenshots/interview-room.png` |
| Evaluation Report | `screenshots/evaluation-report.png` |
| Progress Analytics | `screenshots/progress-dashboard.png` |
| Admin Dashboard | `screenshots/admin-dashboard.png` |
| Payment History | `screenshots/payment-history.png` |

## Future Improvements

- Add automated backend and frontend tests.
- Add Razorpay webhook handling for stronger payment reconciliation.
- Add stronger production security headers and request sanitization.
- Move Firebase Admin credentials fully to environment-based configuration.
- Add cloud deployment setup for frontend, backend, worker, Redis, RabbitMQ, and MongoDB.
- Add downloadable ATS and interview reports.
- Add more detailed resume history and comparison.
- Add code splitting to reduce frontend bundle size.
- Improve mobile responsiveness and accessibility.
- Add observability with structured logs and metrics.

## Interview Talking Points

- Built a full-stack AI product with authentication, payments, caching, queue-based async processing, and dashboards.
- Used Firebase Auth for frontend authentication and Firebase Admin SDK for backend token verification.
- Designed a credit-based usage model for AI-heavy operations.
- Integrated Groq API for ATS analysis, interview question generation, and final evaluation.
- Used Redis to cache repeated ATS analysis and reduce unnecessary AI calls.
- Used RabbitMQ and a worker process to move long-running evaluation outside the request-response cycle.
- Implemented Razorpay signature verification before credit updates.
- Modeled core entities with MongoDB and Mongoose: users, interviews, payments, and exams.
- Added admin-only routing for monitoring users, credits, health, and failed evaluations.

## Author

Built by **Kunal** as a full-stack SDE-1 portfolio project.

If this project helped you understand AI product architecture, authentication, payments, queues, or caching, consider starring the repository.
