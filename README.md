# AI SMS Middleware

A backend system that integrates SMS/Voice workflows with AI processing. The system implements Redis-based sliding window rate limiting using sorted sets to ensure accurate per-user request control across time windows. Supports endpoint-specific throttling and efficient cleanup via TTL.

## Features
- Twilio webhook integration (SMS)
- AI-powered intent extraction
- PostgreSQL audit logging
- Secure data handling (masking, env configs)

## Tech Stack
- Node.js (Express)
- OpenAI API
- PostgreSQL (Prisma)

## Run locally
cp .env.example .env
npm install
npm run dev

## Limitations
The middleware uses an in-memory approach that:
    Works for demo ✔️
    Prevents immediate replays ✔️
    Does NOT persist across restarts ❌