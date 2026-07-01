# 🚀 HireReady AI

> **AI-Powered Interview Preparation Platform with ATS Resume Analysis, AI Mock Interviews, Analytics, Credit System, Payments, and Production Deployment.**

<p align="center">

![React](https://img.shields.io/badge/React-19-blue?logo=react)
![Node](https://img.shields.io/badge/Node.js-Express-green?logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-green?logo=mongodb)
![Redis](https://img.shields.io/badge/Redis-Cache-red?logo=redis)
![RabbitMQ](https://img.shields.io/badge/RabbitMQ-Queue-orange?logo=rabbitmq)
![Firebase](https://img.shields.io/badge/Firebase-Authentication-yellow?logo=firebase)
![Docker](https://img.shields.io/badge/Docker-Container-blue?logo=docker)
![AWS](https://img.shields.io/badge/AWS-EC2-orange?logo=amazonaws)
![Razorpay](https://img.shields.io/badge/Razorpay-Payments-blue)

</p>

---

# 🌐 Live Demo

### 🔗 Application

**http://3.110.154.25**

> Hosted on **AWS EC2** using **Docker**, **Nginx**, **MongoDB**, **Redis**, and **RabbitMQ**.

---

# 📖 Overview

HireReady AI is a production-ready AI-powered interview preparation platform that helps candidates improve their chances of getting shortlisted by combining:

- 📄 ATS Resume Analysis
- 🎤 AI Mock Interviews
- 📊 Performance Analytics
- 💳 Credit-Based Usage System
- 💰 Razorpay Payments
- 👨‍💼 Admin Dashboard
- ⚡ Redis Caching
- 📨 RabbitMQ Background Workers

The application simulates real interview workflows while providing detailed AI-generated feedback and progress tracking.

---

# ✨ Key Features

## 🔐 Authentication

- Firebase Email/Password Login
- Google Authentication
- Firebase Admin Token Verification
- JWT Protected APIs
- Persistent Login
- Role-Based Authentication

---

## 📄 ATS Resume Analyzer

- Upload Resume (PDF)
- AI ATS Score
- Resume Summary
- Skill Extraction
- Strengths & Weaknesses
- Improvement Suggestions
- Redis Resume Cache
- Credit Deduction after Successful Analysis

---

## 🎤 AI Mock Interview

- AI Generated Questions
- Resume Based Interviews
- Voice Input Support
- Five Question Interview Flow
- AI Evaluation
- Interview History
- Performance Tracking

---

## 📊 Analytics Dashboard

- Interview History
- Topic-wise Performance
- Average Score
- Weak Areas
- Progress Tracking
- Evaluation Reports

---

## 💳 Payments

- Razorpay Integration
- Credit Purchase
- Secure Signature Verification
- Payment History
- Automatic Credit Updates

---

## 👨‍💼 Admin Dashboard

- User Management
- Credit Monitoring
- Audit Logs
- System Health
- Failed Evaluation Retry
- Platform Statistics

---

# 🛠 Tech Stack

| Layer | Technology |
|--------|------------|
| Frontend | React, Vite, TailwindCSS, Zustand |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Authentication | Firebase Auth + Firebase Admin |
| AI | Groq API |
| Payments | Razorpay |
| Cache | Redis |
| Queue | RabbitMQ |
| Deployment | Docker, Docker Compose |
| Reverse Proxy | Nginx |
| Cloud | AWS EC2 |

---

# 🏗 System Architecture

```text
                    +----------------------+
                    |    React + Vite      |
                    +----------+-----------+
                               |
                               |
                     Nginx Reverse Proxy
                               |
               +---------------+---------------+
               |                               |
        Static Frontend                 Express Backend
                                               |
      +----------------+----------------+----------------+
      |                |                |                |
   MongoDB          Redis          RabbitMQ         Firebase
      |                |                |                |
      |                |                |                |
      +----------------+----------------+                |
                       |                                 |
                       +----------> Evaluation Worker <--+
                                      |
                                      |
                                   Groq AI
```

---

# ⚙️ Engineering Highlights

- ✅ Production Deployment on AWS EC2
- ✅ Dockerized Multi-Container Architecture
- ✅ Reverse Proxy using Nginx
- ✅ Firebase Authentication
- ✅ Redis Resume Cache
- ✅ Redis API Rate Limiting
- ✅ RabbitMQ Background Worker
- ✅ Razorpay Payment Verification
- ✅ Modular Express Architecture
- ✅ Role-Based Access Control
- ✅ AI Powered Resume Analysis
- ✅ AI Interview Evaluation
- ✅ Production Ready REST APIs

---

# 🧠 Architecture Decisions

### Redis

Used for:

- Resume Analysis Cache
- API Rate Limiting
- Reducing Expensive AI Calls

---

### RabbitMQ

Used for:

- Background Interview Evaluation
- Asynchronous Processing
- Improved Scalability

If RabbitMQ becomes unavailable, the backend automatically switches to direct evaluation so interviews continue without interruption.

---

### Firebase

Responsible for:

- User Authentication
- Google Login
- Token Verification
- Secure Backend Authentication

---

### Razorpay

Used for:

- Credit Purchases
- Secure Signature Verification
- Payment History
- Automatic Credit Allocation

---

# 📂 Project Structure

```text
HireReady.io
│
├── client
│   ├── public
│   ├── src
│   │   ├── assets
│   │   ├── config
│   │   ├── hooks
│   │   ├── store
│   │   ├── App.jsx
│   │   ├── DashboardHome.jsx
│   │   ├── InterviewRoom.jsx
│   │   ├── ProgressAnalytics.jsx
│   │   ├── AdminDashboard.jsx
│   │   ├── PaymentHistory.jsx
│   │   └── BuyCredits.jsx
│   │
│   ├── package.json
│   └── Dockerfile
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
│   │   ├── utils
│   │   └── server.js
│   │
│   ├── package.json
│   └── Dockerfile
│
├── nginx
├── screenshots
├── docker-compose.devops.yml
└── README.md
```

---

# 📦 Backend Modules

| Module | Responsibility |
|----------|---------------|
| Auth | Firebase Login & Authentication |
| Resume | ATS Resume Analysis |
| Interview | AI Interview Flow |
| Payments | Razorpay Orders & Verification |
| Admin | User & Platform Management |
| Health | Service Monitoring |
| Worker | RabbitMQ Interview Evaluation |

# 🚀 Getting Started

## Prerequisites

- Node.js 20+
- MongoDB
- Redis
- RabbitMQ
- Docker & Docker Compose
- Firebase Project
- Razorpay Test/Live Keys
- Groq API Key

---

# 💻 Local Development

## 1. Clone Repository

```bash
git clone https://github.com/jlucky03/HireReady.io.git

cd HireReady.io
```

---

## 2. Install Dependencies

### Backend

```bash
cd server
npm install
```

### Frontend

```bash
cd ../client
npm install
```

---

## 3. Configure Environment Variables

### Backend (.env)

```env
PORT=5000

MONGO_URI=

REDIS_URL=

RABBITMQ_URL=

JWT_SECRET=

CLIENT_URL=

ADMIN_EMAILS=

GROQ_API_KEY=

RAZORPAY_KEY_ID=

RAZORPAY_KEY_SECRET=

FIREBASE_PROJECT_ID=

FIREBASE_CLIENT_EMAIL=

FIREBASE_PRIVATE_KEY=
```

---

### Frontend (.env)

```env
VITE_API_URL=

VITE_FIREBASE_API_KEY=

VITE_FIREBASE_AUTH_DOMAIN=

VITE_FIREBASE_PROJECT_ID=

VITE_FIREBASE_STORAGE_BUCKET=

VITE_FIREBASE_MESSAGING_SENDER_ID=

VITE_FIREBASE_APP_ID=
```

---

# ▶ Running Locally

### Backend

```bash
cd server
npm run dev
```

---

### Worker

```bash
cd server
npm run worker
```

---

### Frontend

```bash
cd client
npm run dev
```

Open

```
http://localhost:5173
```

---

# 🐳 Docker Deployment

Build and start all services

```bash
docker compose -f docker-compose.devops.yml up -d --build
```

Stop services

```bash
docker compose -f docker-compose.devops.yml down
```

View logs

```bash
docker logs hireready-backend

docker logs hireready-worker
```

---

# ☁ AWS EC2 Deployment

Deploy using Docker Compose

```bash
git pull

docker compose -f docker-compose.devops.yml pull

docker compose -f docker-compose.devops.yml up -d --force-recreate
```

Verify deployment

```bash
docker ps

docker logs hireready-backend

docker logs hireready-worker
```

---

# 🔄 ATS Resume Analysis Flow

```text
User Uploads Resume
          │
          ▼
Extract PDF Text
          │
          ▼
Check Redis Cache
          │
 ┌────────┴────────┐
 │                 │
 ▼                 ▼
Cache Hit      Cache Miss
 │                 │
 ▼                 ▼
Return Result   Groq AI Analysis
                     │
                     ▼
             Store in Redis
                     │
                     ▼
             Save to MongoDB
```

---

# 🎤 Interview Evaluation Flow

```text
Start Interview
        │
        ▼
Generate Questions
        │
        ▼
User Answers
        │
        ▼
Submit Final Answer
        │
        ▼
Publish Job
        │
        ▼
RabbitMQ Queue
        │
        ▼
Evaluation Worker
        │
        ▼
Groq AI
        │
        ▼
Store Report
        │
        ▼
Display Evaluation
```

---

# 🔁 RabbitMQ Fallback

```text
RabbitMQ Down
      │
      ▼
Direct Evaluation
      │
      ▼
Groq AI
      │
      ▼
Return Report
```

---

# ⚡ Redis Cache Strategy

Redis stores

- ATS Resume Results
- Resume Hash
- API Rate Limiting
- Temporary Cached Responses

Benefits

- Faster Responses
- Lower AI Cost
- Reduced Latency
- Better User Experience

---

# 💳 Razorpay Payment Flow

```text
Choose Plan
     │
     ▼
Create Order
     │
     ▼
Open Razorpay
     │
     ▼
Payment Success
     │
     ▼
Verify Signature
     │
     ▼
Add Credits
     │
     ▼
Save Payment
```

---

# 🔒 Authentication Flow

```text
User Login
     │
     ▼
Firebase Authentication
     │
     ▼
Receive ID Token
     │
     ▼
Backend Verification
     │
     ▼
MongoDB User Sync
     │
     ▼
JWT Protected APIs
```

---

# 👨‍💼 Admin Features

- Dashboard Overview
- User Management
- Credit Monitoring
- Audit Logs
- Failed Evaluation Retry
- Platform Health Monitoring
- MongoDB Status
- Redis Status
- RabbitMQ Status

---

# 📸 Application Screenshots

## 🔐 Authentication

![Authentication](screenshots/auth.png)

---

## 🏠 User Dashboard

![Dashboard](screenshots/dashboard.png)

---

## 📄 ATS Resume Analyzer

![ATS Analyzer](screenshots/ats-analyzer.png)

---

## 🎤 AI Interview Room

![Interview Room](screenshots/interview-room.png)

---

## 📊 AI Evaluation Report

![Evaluation Report](screenshots/evaluation-report.png)

---

## 📈 Progress Dashboard

![Progress Dashboard](screenshots/progress-dashboard.png)

---

## 💳 Payment History

![Payment History](screenshots/payment-history.png)

---

## 👨‍💼 Admin Dashboard

![Admin Dashboard](screenshots/admin-dashboard.png)

---

# 📈 Future Improvements

- Kubernetes Deployment
- GitHub Actions CI/CD
- Prometheus Monitoring
- Grafana Dashboards
- WebSocket Live Interview Monitoring
- Email Notifications
- Interview Recording
- Multi-language Support
- Resume Version Comparison
- AI Coding Interview Support

---

# 🏆 Skills Demonstrated

- Full Stack Development
- REST API Design
- Authentication & Authorization
- Docker & Docker Compose
- AWS EC2 Deployment
- Redis Caching
- RabbitMQ Messaging
- MongoDB Design
- Payment Gateway Integration
- AI Application Development
- Production Deployment
- Backend Architecture
- State Management
- Cloud Infrastructure

---

# 👨‍💻 Author

## Lucky Sanodiya

**Final-Year B.Tech Information Technology Student**

National Institute of Technology (NIT) Raipur

### Interests

- Backend Engineering
- Full Stack Development
- Distributed Systems
- AI Applications
- Cloud Computing
- DevOps

GitHub

https://github.com/jlucky03

---

# ⭐ Support

If you found this project useful or learned something from it, please consider giving it a ⭐ on GitHub.

It helps the project reach more developers and motivates further improvements.

---

# 📄 License

This project is developed for **educational**, **portfolio**, and **learning** purposes.

© 2026 Lucky Sanodiya. All Rights Reserved.