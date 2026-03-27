# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # dev server → http://localhost:5173
npm run build        # production build (must pass before deploying)
npx vercel --prod    # deploy to Vercel production
```

## Environment

Requires a `.env` file with Firebase credentials (see `.env.example`). The same variables must be set in Vercel (Settings → Environment Variables) for production builds.

## Architecture

Single-page app with a view-state router in `App.jsx` (`leaderboard` | `team` | `add-team` | `edit-team`). No external routing library.

### Key hooks

| Hook | What it does |
|------|-------------|
| `useTeams` | Real-time Firestore `onSnapshot` on the `teams` collection — source of truth for all team data |
| `usePlayerStats` | One batched MLB API call for all unique player IDs; returns `{ [mlbId]: homeRuns }` |
| `useNextGames` | Fetches `currentTeam` for each player, then team schedules; returns next game per player |
| `useHRLog` | Game-by-game HR log for a single player; fetched on demand |
| `usePlayerSearch` | Debounced MLB people search with `currentTeam` hydration; used in the team form |

### Scoring

Each team has 8 players. The **top 7 by 2026 HRs** count toward the team score — the lowest is automatically excluded. This is computed at render time in `Leaderboard.jsx` (`teamTotal`) and `TeamCard.jsx`.

### Firebase

- Collection: `teams`
- Document ID: owner name, lowercase + hyphenated (e.g. `donna`, `obrien-luck`)
- All edits (including to originally hardcoded teams) go through `saveTeam()` in `useTeams`
- Required Firestore rules:
  ```
  match /teams/{teamId} {
    allow read, write: if true;
  }
  ```

### MLB Stats API

Public, no auth, CORS-friendly. Key endpoints used:
- `/people?personIds=...&hydrate=stats(...)` — batch season stats
- `/people/search?names=...&hydrate=currentTeam` — player autocomplete
- `/people/{id}/stats?stats=gameLog&group=hitting&season=2026` — HR log
- `/schedule?sportId=1&teamIds=...&startDate=...` — upcoming games
