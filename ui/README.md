# HRD OBrien Luck — Family HR Tracker

Live leaderboard for the OBrien family 2026 MLB Home Run Derby pool.

## What it does

- Tracks each family member's 8-player roster in real time
- Pulls live 2026 HR totals from the MLB Stats API
- Scores each team by its **top 7 players** (8th auto-excluded)
- Shows each player's next scheduled game and a full HR log drill-down
- All team data stored in Firebase Firestore — changes sync instantly across all devices

## Live site

**https://hrd-obrien-luck.vercel.app**

## Setup

```bash
npm install
cp .env.example .env   # fill in Firebase credentials
npm run dev
```

## Deploy

```bash
npm run build          # verify build passes
npx vercel --prod      # push to production
```

Firebase env vars must also be set in the Vercel project dashboard (Settings → Environment Variables).

## Stack

- React 19 + Vite
- Firebase Firestore (team data)
- MLB Stats API (live stats, schedules, HR logs)
- Vercel (hosting)
