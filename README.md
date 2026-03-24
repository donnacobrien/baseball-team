# HRD 2026 Team Optimizer

Picks the optimal 8-player homerun derby roster using projection models and integer programming.

## Rules

- **Player pool:** 251 available players from `hrd-available-players-26.pdf`
- **Cost:** each player's 2025 HR total
- **Cap:** team cannot exceed **172 total HRs**
- **Roster:** 8 players — top 7 are starters, 8th is backup

## How It Works

1. **Data ingestion** — player pool parsed from the PDF (251 players, costs 9–60 HR)
2. **Historical stats** — fetches 2022–2025 batting stats from FanGraphs via `pybaseball`
3. **Projections** — builds 2026 HR projections from three sources, then ensembles them:
   - **Marcel** (internal): weighted 3-year HR rate + regression to mean + age curve
   - **Steamer** (FanGraphs): full-season projection system
   - **ZiPS** (FanGraphs): Dan Szymborski's projection system
   - **ATC** (FanGraphs): average of public projection systems
   - External systems weighted 3×, Marcel weighted 1× in the ensemble
4. **Optimization** — `scipy.optimize.milp` solves the 0-1 integer knapsack: maximize projected 2026 HRs subject to the 172 HR cap and exactly 8 players selected

## Setup

```bash
python -m venv .venv
source .venv/bin/activate
pip install pybaseball scipy matplotlib seaborn jupyter
jupyter notebook main.ipynb
```

The virtual environment (`.venv`, Python 3.14) is already present in this repo — just activate and run.

## Output

- Printed optimal roster with cost, projection, and value-efficiency per player
- `hrd_team.png` — bar chart of projected HRs + cost-vs-projection scatter
- Sensitivity analysis: next-best team if the top projected player is excluded
- Top-30 value-efficiency leaderboard (projected HR per cost unit)

## Files

| File | Description |
|------|-------------|
| `main.ipynb` | Full analysis notebook — run top to bottom |
| `hrd-available-players-26.pdf` | Official player pool with 2025 HR totals |
| `CLAUDE.md` | Guidance for Claude Code in this repo |
