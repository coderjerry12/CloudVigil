# EventShield AI — Backend

Serverless backend for the Event Management & Safety Platform.

## Architecture

- **AWS Lambda** — Business logic (Node.js 18)
- **Amazon API Gateway** — REST API with Cognito authorizer
- **Amazon DynamoDB** — Event data storage
- **AWS SAM** — Infrastructure as code

## Prerequisites

- AWS CLI configured (`aws configure`)
- AWS SAM CLI installed (`brew install aws-sam-cli`)
- Node.js 18+

## Deploy

### First time (interactive):
```bash
cd backend
sam build
sam deploy --guided
```

You'll be prompted for:
- Stack name: `eventshield-ai-backend-dev`
- Region: `us-east-1`
- CognitoUserPoolId: your User Pool ID
- CognitoUserPoolArn: `arn:aws:cognito-idp:us-east-1:<account-id>:userpool/<pool-id>`

### Subsequent deploys:
```bash
sam build && sam deploy
```

## Local Development

```bash
# Install dependencies
cd src && npm install && cd ..

# Start local API (requires Docker)
sam local start-api --env-vars env.json
```

Create `env.json`:
```json
{
  "Parameters": {
    "EVENTS_TABLE": "EventShield-Events-dev"
  }
}
```

## API Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | /events | Create event | Organizer |
| GET | /events?scope=organizer | Get organizer's events | Organizer |
| GET | /events?scope=browse | Browse upcoming events | Any user |
| GET | /events/{eventId} | Get single event | Any user |
| PUT | /events/{eventId} | Update event | Organizer (owner) |
| DELETE | /events/{eventId} | Cancel event (soft delete) | Organizer (owner) |

## After Deploy

Copy the API Gateway URL from the deploy output and update the frontend `.env`:

```
VITE_API_BASE_URL=https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/dev
```
