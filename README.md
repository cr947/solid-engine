# Agora Agent

AI-powered prediction market agent for Polymarket using Next.js, Supabase, and Mistral via vLLM.

## What it does

- Fetches top Polymarket Gamma markets closing in 1-7 days.
- Analyzes each market with a local Mistral model via an OpenAI-compatible vLLM endpoint.
- Stores picks in Supabase.
- Exposes picks through Next.js API routes.
- Attaches a Polymarket builder code to every order payload.
- Runs as a Railway cron worker every 30 minutes.

## Setup

1. Install dependencies:

```bash
cd C:\Users\USER\agora-agent
npm install
```

2. Create a `.env.local` file with these values:

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_ANON_KEY=
VLLM_API_URL=http://165.245.130.123:8000
VLLM_API_KEY=grove-ai-secret-2024
VLLM_MODEL=mistralai/Mistral-7B-Instruct-v0.3
POLY_BUILDER_CODE=
POLY_API_KEY=
POLY_API_SECRET=
POLY_API_PASSPHRASE=
```

## Supabase schema

Run this SQL in your Supabase database:

```sql
create extension if not exists pgcrypto;

create table if not exists picks (
  id uuid primary key default gen_random_uuid(),
  market_id text not null,
  question text not null,
  pick text not null,
  confidence integer not null,
  reasoning text not null,
  outcome text default 'PENDING',
  created_at timestamptz default now()
);

create unique index if not exists picks_market_id_key on picks (market_id);
```

## Run

- Local app: `npm run dev`
- Worker: `node worker/index.js`

## API routes

- `GET /api/picks` returns the latest 50 picks.
- `POST /api/agent` triggers the agent loop manually.
