# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # dev server → http://localhost:5173
npm run build        # production build (must pass before deploying)
```

Deploys automatically on push to `main` via Vercel + GitHub integration.

## Environment

Requires a `.env` file with Supabase credentials (see `.env.example`). The same variables must be set in Vercel (Settings → Environment Variables) for production builds.

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## Architecture

Single-page app with a view-state router in `App.jsx` (`leaderboard` | `team` | `add-team` | `edit-team`). No external routing library.

### Key hooks

| Hook | What it does |
|------|-------------|
| `useTeams` | Fetches all teams from Supabase on mount; `saveTeam()` upserts and re-fetches |
| `usePlayerStats` | One batched MLB API call for all unique player IDs; returns `{ [mlbId]: homeRuns }` |
| `useNextGames` | Fetches `currentTeam` for each player, then team schedules; returns next game per player |
| `useHRLog` | Game-by-game HR log for a single player; fetched on demand |
| `usePlayerSearch` | Debounced MLB people search with `currentTeam` hydration; used in the team form |

### Scoring

Each team has 8 players. The **top 7 by 2026 HRs** count toward the team score — the lowest is automatically excluded. Computed at render time in `Leaderboard.jsx` (`teamTotal`) and `TeamCard.jsx`.

### Supabase

- Table: `teams`
- Schema: `id text primary key, data jsonb not null`
- Row ID: owner name, lowercase + hyphenated (e.g. `donna`, `obrien-luck`)
- The full team object (teamName, owner, players array) is stored in the `data` column
- All reads/writes go through `useTeams` — `saveTeam()` uses upsert

### MLB Stats API

Public, no auth, CORS-friendly. Base URL: `https://statsapi.mlb.com/api/v1`. Key endpoints:
- `/people?personIds=...&hydrate=stats(...)` — batch season stats
- `/people/search?names=...&hydrate=currentTeam` — player autocomplete
- `/people/{id}/stats?stats=gameLog&group=hitting&season=2026` — HR log
- `/schedule?sportId=1&teamIds=...&startDate=...` — upcoming games
