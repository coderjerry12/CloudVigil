# CloudVigil (EventShield AI)

AI-powered Serverless Event Management & Safety Platform built on AWS.

**Live URL:** https://d15l8ghwqm1m2r.cloudfront.net

---

## Prerequisites

- Node.js 18+
- AWS CLI configured with credentials
- AWS SAM CLI (`brew install aws-sam-cli`)
- An AWS account with access to: Lambda, DynamoDB, API Gateway, Cognito, SES, S3, CloudFront, EventBridge, Bedrock

---

## Project Structure

```
eventshield-ai/
├── frontend/          # React + TypeScript + Material UI
│   ├── src/
│   ├── .env           # Environment variables (Cognito, API URL)
│   ├── package.json
│   └── deploy.sh      # Deploy to S3 + CloudFront
├── backend/
│   ├── src/
│   │   ├── handlers/  # 30+ Lambda functions
│   │   ├── utils/     # Shared utilities (auth, db, ses, notifications)
│   │   └── package.json
│   ├── template.yaml  # SAM/CloudFormation template (full infrastructure)
│   └── samconfig.toml # SAM deployment config
```

---

## Setup & Run

### 1. Backend

```bash
cd eventshield-ai/backend/src
npm install

cd ..
sam build
sam deploy --guided
```

On first deploy, SAM will ask for parameters:
- `Environment`: dev
- `CognitoUserPoolId`: (your Cognito User Pool ID)
- `CognitoUserPoolArn`: (your Cognito User Pool ARN)

After deploy, note the `ApiUrl` output.

### 2. Frontend

```bash
cd eventshield-ai/frontend
npm install
```

Create/edit `.env`:
```
VITE_AWS_REGION=us-east-1
VITE_COGNITO_USER_POOL_ID=<your-user-pool-id>
VITE_COGNITO_CLIENT_ID=<your-app-client-id>
VITE_API_BASE_URL=<api-gateway-url-from-sam-deploy-output>
```

Run locally:
```bash
npm run dev
```

Deploy to CloudFront:
```bash
./deploy.sh
```

---

## AWS Services Used

| Service | Purpose |
|---------|---------|
| Lambda (30 functions) | Business logic |
| API Gateway | REST API with Cognito auth |
| DynamoDB (6 tables) | Data storage |
| Cognito | Authentication & roles |
| SES | Emails (registration, alerts) |
| S3 | Image storage + frontend hosting |
| CloudFront | CDN for frontend |
| EventBridge | Scheduled escalation, reminders, crowd monitoring |
| Bedrock (Claude 3) | AI chatbot |
| SAM/CloudFormation | Infrastructure as Code |

---

## Key Features

1. **Event Management** — CRUD, image upload, sessions/agenda, access codes
2. **Registration** — QR tickets, waitlist, auto-promotion
3. **QR Check-in** — Camera-based scanning, duplicate prevention
4. **Safety Center** — SOS/Medical/Fire/Food alerts, auto-escalation (5/15/30 min), audio alarm
5. **AI Chatbot** — Context-aware assistant (Bedrock Claude 3 Haiku)
6. **Recommendations** — Category-based scoring algorithm
7. **Notifications** — Real-time, SES emails, EventBridge reminders
8. **Analytics** — On-demand dashboard with charts, CSV export
9. **Feedback** — Post-event rating + comments
10. **Dark/Light Theme** — Full theme support

---

## Cognito Setup (Manual — one-time)

1. Create a User Pool in AWS Console (us-east-1)
2. Add custom attribute: `custom:role` (string, mutable)
3. Create an App Client (no secret)
4. Note the User Pool ID and Client ID for `.env`

---

## SES Setup

In SES sandbox mode, verify sender and recipient emails:
```bash
aws ses verify-email-identity --email-address your@email.com
```

---

## Bedrock Setup

Ensure Claude 3 Haiku model access is enabled in your AWS account:
- AWS Console → Bedrock → Model catalog → Try Claude 3 Haiku

---

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Organizer | mishraap2006@gmail.com | (your password) |
| Attendee | anupriyamishra1221@gmail.com | (your password) |

---

## Estimated Monthly Cost

~$5.50/month for moderate usage (50 events, 2000 registrations)
