# CloudVigil 🛡️

## AI-powered Serverless Event Management & Safety Platform on AWS

## 🌟 Overview

CloudVigil is an **AI-powered serverless event management and safety platform** built entirely on AWS that empowers organizers to create, manage, and protect events while providing attendees with seamless registration, real-time safety assistance, and intelligent recommendations.

It bridges the gap between event management and event safety through:

- 🤖 **AI-Powered Event Creation** — Type a title, AI generates the description
- 🚨 **Real-time Safety System** — SOS, Medical, Fire alerts with auto-escalation
- 📱 **QR Check-in** — Camera-based scanning with duplicate prevention
- 🔔 **Audio Alarm** — Browser-based alarm for critical incidents
- 📊 **Live Analytics** — Real-time dashboards with crowd monitoring
- 🎯 **Smart Recommendations** — AI-scored personalized event suggestions

---

## 🚀 Live Demo

[![GitHub](https://img.shields.io/badge/📦_GITHUB-VIEW_CODE-black?style=for-the-badge&logo=github)](https://github.com/coderjerry12/CloudVigil)
[![Presentation](https://img.shields.io/badge/📊_PRESENTATION-VIEW_SLIDES-orange?style=for-the-badge)](https://docs.google.com/presentation/d/1CENYEN-CNkKsjyuPsvsWeGPSz4gyCs0n/edit?usp=sharing)
[![Documentation](https://img.shields.io/badge/📄_DOCUMENTATION-VIEW_DOC-green?style=for-the-badge)](https://docs.google.com/document/d/1YyGra87o2nYSxbW5cCeW5jGUN0DMreGe/edit?usp=sharing)

| | URL |
|---|---|
| 📦 **GitHub** | [https://github.com/coderjerry12/CloudVigil](https://github.com/coderjerry12/CloudVigil) |
| 📊 **Presentation** | [View Slides](https://docs.google.com/presentation/d/1CENYEN-CNkKsjyuPsvsWeGPSz4gyCs0n/edit?usp=sharing) |
| 📄 **Documentation** | [View Doc](https://docs.google.com/document/d/1YyGra87o2nYSxbW5cCeW5jGUN0DMreGe/edit?usp=sharing) |

---

## 🎥 Live Features

### 🤖 AI-Powered Event Creation (Amazon Bedrock Claude 3 Haiku)

Type a title and category, click "✨ AI Suggest" — Bedrock automatically:
- ✅ Generates professional event descriptions
- ✅ Writes organizer/speaker bios from name + expertise
- ✅ Context-aware assistant that knows your events and registrations
- ✅ Scores events by category preference for personalized recommendations

### 🚨 Safety & Incident Management

| Feature | Description |
|---------|-------------|
| **SOS Alerts** | One-tap emergency reporting with GPS location |
| **Auto-Escalation** | 5 min → IN_PROGRESS, 15 min → ESCALATED, 30 min → Email |
| **Audio Alarm** | Web Audio API 880Hz pulsing tone on organizer dashboard |
| **Cooldown** | Prevents spam — max 1 incident per type per 10 min |
| **Check-in Gate** | Only physically-present (QR scanned) attendees can report |
| **Resolution Notifications** | Attendee notified when their SOS is resolved |

### 📱 QR Registration & Check-in

- QR code generated on registration (embedded in email)
- Camera-based scanning with real-time validation
- Duplicate prevention — same QR can't scan twice
- Waitlist system with auto-promotion on cancellation

### 🔒 Access Control & Security

| Layer | Implementation |
|-------|---------------|
| **Authentication** | Amazon Cognito with JWT, email verification, immutable roles |
| **API Security** | API Gateway Cognito Authorizer (zero-cost rejection) |
| **Rate Limiting** | AWS WAF — 300 req/5min general, 10 registrations/5min per IP |
| **Least Privilege** | Per-Lambda IAM roles scoped to specific DynamoDB tables |
| **Encryption** | At rest (DynamoDB AES-256, S3 SSE) + in transit (TLS) |

### 📊 Analytics & Export

- 7-day trend analytics (registrations vs check-ins)
- Incident distribution pie charts
- Capacity utilization bar charts
- CSV export for attendee lists, attendance reports, incident reports
- Department performance metrics

### 🎯 Smart Recommendations

Algorithm scores events based on attendance history:
- Registration: +3 points per category
- Attended (checked in): +5 points per category
- Recency boost: +3 for events within 7 days
- Only shows upcoming, non-full events

### 📝 Post-Event Feedback

- Star rating (1-5) + selectable tags + free-text comment
- Guard: Only after check-in AND event completed
- Aggregate stats shown to organizer (rating distribution, comments)
- Feeds back into recommendation scoring

---

## 👥 Role-Based Access

| Role | Capabilities |
|------|-------------|
| **Organizer** | Create/edit/cancel events, upload images, manage sessions, view registrations, QR check-in, resolve incidents, analytics, CSV export |
| **Attendee** | Browse events, register with access codes, QR tickets, report SOS (after check-in), rate events, AI chatbot, bookmark sessions |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite, Material UI 6 |
| **Backend** | AWS Lambda (Node.js 18, ARM64), API Gateway |
| **Database** | Amazon DynamoDB (6 tables, 4+ GSIs) |
| **Authentication** | Amazon Cognito User Pools |
| **AI Engine** | Amazon Bedrock (Claude 3 Haiku) via Converse API |
| **Email** | Amazon SES (transactional with inline QR) |
| **Storage** | Amazon S3 (event images) |
| **CDN** | Amazon CloudFront (frontend + images) |
| **Scheduling** | Amazon EventBridge (escalation, reminders, crowd monitoring) |
| **Security** | AWS WAF v2 (rate limiting) |
| **Monitoring** | Amazon CloudWatch (alarms, logs) |
| **IaC** | AWS SAM (CloudFormation) |

---

## 📁 Project Structure

```
CloudVigil/
├── backend/
│   ├── template.yaml              # SAM/CloudFormation (entire infrastructure)
│   ├── samconfig.toml             # Deployment configuration
│   └── src/
│       ├── handlers/              # 30+ Lambda functions
│       │   ├── createEvent.js     # Event CRUD with image + sessions
│       │   ├── registerForEvent.js # Registration + waitlist + access code
│       │   ├── processCheckin.js  # QR validation + duplicate prevention
│       │   ├── createIncident.js  # SOS with check-in gate + cooldown
│       │   ├── escalateIncidents.js # Auto-escalation + email + repeated alerts
│       │   ├── chat.js            # Bedrock chatbot with context injection
│       │   ├── suggestDescription.js # AI event description generator
│       │   ├── getRecommendations.js # Category scoring algorithm
│       │   ├── submitFeedback.js  # Post-event rating system
│       │   ├── getAnalytics.js    # On-demand analytics computation
│       │   ├── monitorCrowds.js   # Occupancy calculation + alerts
│       │   ├── autoCompleteEvents.js # Status lifecycle management
│       │   ├── cancelRegistration.js # Waitlist auto-promotion
│       │   ├── markAllNotificationsRead.js # Batch notification clear
│       │   └── ... (16 more)
│       ├── utils/
│       │   ├── auth.js            # JWT claim extraction
│       │   ├── dynamodb.js        # DynamoDB Document Client
│       │   ├── notifications.js   # Notification creation helper
│       │   ├── ses.js             # Email with CID inline QR attachment
│       │   └── response.js       # HTTP response formatter
│       └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/            # AppLayout, Sidebar, TopBar (collapsible)
│   │   │   └── common/            # MetricCard, SafetyAlarm, CloudVigilLogo
│   │   ├── features/
│   │   │   ├── events/            # CRUD, filters, calendar, image upload, sessions
│   │   │   ├── registration/      # QR tickets, waitlist, cancellation
│   │   │   ├── checkin/           # QR scanner, attendance list
│   │   │   ├── safety/            # SOS reporting, incident management
│   │   │   ├── chat/              # AI chatbot widget
│   │   │   ├── recommendations/   # AI-scored event suggestions
│   │   │   ├── feedback/          # Star ratings, pending banner
│   │   │   ├── analytics/         # Charts, KPIs, export
│   │   │   └── notifications/     # Bell, popover, clear all
│   │   ├── auth/                  # Cognito auth, role guards, onboarding
│   │   ├── pages/                 # Dashboards, landing, profile, settings
│   │   ├── theme/                 # Light + Dark theme (MUI)
│   │   ├── i18n/                  # 8 languages
│   │   ├── utils/                 # CSV export utility
│   │   └── routes/                # Role-based routing
│   ├── deploy.sh                  # S3 + CloudFront deployment script
│   ├── .env                       # Environment variables
│   └── package.json
│
└── README.md
```

---

## ⚡ Getting Started

### Prerequisites
- Node.js 18+
- AWS CLI configured with credentials
- AWS SAM CLI (`brew install aws-sam-cli`)
- AWS account with: Lambda, DynamoDB, Cognito, SES, S3, CloudFront, Bedrock

### Installation

```bash
# Clone
git clone https://github.com/coderjerry12/CloudVigil.git
cd CloudVigil

# Backend
cd backend/src && npm install && cd ..
sam build && sam deploy --guided

# Frontend
cd frontend && npm install
cp .env.example .env  # Fill in Cognito + API URL
npm run dev           # http://localhost:5173
```

### Environment Variables

```env
VITE_AWS_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=your_user_pool_id
VITE_COGNITO_CLIENT_ID=your_client_id
VITE_API_BASE_URL=https://your-api.execute-api.us-east-1.amazonaws.com/dev
```

### Deploy to Production

```bash
# Backend
cd backend && sam build && sam deploy

# Frontend (S3 + CloudFront)
cd frontend && ./deploy.sh
```

---

## 🧪 Test Accounts (For Evaluators)

| Role | Email | Password |
|------|-------|----------|
| 🏛️ Organizer | mishraap2006@gmail.com | (your password) |
| 👤 Attendee | anupriyamishra1221@gmail.com | (your password) |

---

## 🏗️ Architecture Highlights

| Design Decision | Rationale |
|----------------|-----------|
| **DynamoDB composite keys** | O(1) lookup for "is user registered for event?" |
| **GSI design (4+ indexes)** | Efficient queries without table scans |
| **Pre-signed S3 URLs** | Direct upload bypasses Lambda 6MB limit |
| **CloudFront OAC** | Private S3 + permanent image URLs |
| **EventBridge schedules** | Serverless cron (escalation, reminders, crowd) |
| **Converse API** | Latest Bedrock API for Claude 3 |
| **Web Audio API** | Programmatic alarm sound, zero audio files |
| **localStorage persistence** | Sidebar state, session bookmarks |
| **Client-side date computation** | Instant status accuracy without backend roundtrip |

---

## 💰 Cost Optimization

| Component | Monthly Cost (50 events, 2000 registrations) |
|-----------|----------------------------------------------|
| Lambda (150K invocations) | ~$0.50 |
| DynamoDB (on-demand) | ~$2.00 |
| API Gateway | ~$1.75 |
| S3 + CloudFront | ~$1.00 |
| SES (2000 emails) | ~$0.20 |
| EventBridge | ~$0.01 |
| Cognito (free tier) | $0.00 |
| **Total** | **~$5.50/month** |

vs. Traditional (EC2 + RDS): **$200-500/month** → **97% cost reduction**

---

## 📊 AWS Services Used

| Service | Usage |
|---------|-------|
| **AWS Lambda** (30 functions) | All business logic — zero idle cost |
| **Amazon API Gateway** | REST API with JWT validation |
| **Amazon DynamoDB** (6 tables) | Sub-5ms reads, pay-per-request |
| **Amazon Cognito** | Auth + role management |
| **Amazon Bedrock** (Claude 3) | AI chatbot, descriptions, recommendations |
| **Amazon SES** | Registration emails with inline QR |
| **Amazon S3** | Event images + frontend hosting |
| **Amazon CloudFront** (2 distributions) | Frontend CDN + images CDN |
| **Amazon EventBridge** (4 schedules) | Escalation, reminders, crowd, auto-complete |
| **AWS WAF v2** | Rate limiting + bot protection |
| **Amazon CloudWatch** | Alarms on critical Lambda failures |
| **AWS SAM** | Infrastructure as Code |

---

## 🚀 Future Roadmap

| # | Feature | Description |
|---|---------|-------------|
| 1 | **IoT Crowd Sensors** | CCTV + Bluetooth beacons for real-time heatmaps |
| 2 | **Predictive Analytics** | ML crowd surge forecasting with SageMaker |
| 3 | **Native Mobile App** | React Native + offline QR scanning |

---

## 📝 License

Built with ☕ & 🎵 by **Anupriya Mishra**.

AWS Amazon 2026 Internship Project

Mentored by ArulBalaji and Abhishek
