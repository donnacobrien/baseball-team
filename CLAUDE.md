# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Layout

| Directory | Purpose |
|-----------|---------|
| `ui/` | React web app — live family HR tracker, deployed on Vercel |
| `team-creation/` | Python Jupyter notebook — optimizer that selected the original teams |

---

## ui/ — React Web App

### Stack
- **React 19** + **Vite 8**
- **Firebase Firestore** — team data (real-time, shared across all users)
- **MLB Stats API** (`statsapi.mlb.com`) — live 2026 HR totals, schedules, game logs
- **Vercel** — hosting

### Commands
```bash
cd ui
npm install          # install dependencies
npm run dev          # start dev server at http://localhost:5173
npm run build        # production build
npx vercel --prod    # deploy to production
```

### Environment variables
Copy `.env.example` to `.env` and fill in Firebase project credentials:
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```
The same keys must be set in the Vercel project dashboard (Settings → Environment Variables).

### Architecture

**Views** (managed as a `view` state string in `App.jsx`):
- `leaderboard` — all teams ranked by top-7 2026 HR total
- `team` — player breakdown for one team; double-click a player name for their HR log
- `add-team` / `edit-team` — form to create or edit a team

**Data flow:**
- `useTeams` — real-time Firestore listener; all team adds/edits write back to Firestore
- `usePlayerStats` — single batched MLB API call for all unique player IDs across all teams
- `useNextGames` — fetches each player's current team, then their upcoming schedule
- `useHRLog` — per-player game log, fetched on demand when the drill-down panel opens
- `usePlayerSearch` — debounced MLB people search, used in the Add/Edit team form

**Scoring rule:** top 7 players by 2026 HRs on each roster count toward the team total; the 8th is automatically excluded.

**Firestore:** single `teams` collection, one document per team, document ID = owner name (lowercase, hyphenated). All reads/writes require `allow read, write: if true` rules.

---

## team-creation/ — Python Optimizer

See `team-creation/CLAUDE.md` for full details. This is a standalone Jupyter notebook that was used to generate the original team picks and is not connected to the web app.
