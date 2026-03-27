# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Purpose

Fantasy homerun derby team optimizer. Uses the player pool from `hrd-available-players-26.pdf` (2025 HR totals = cost) to select an optimal 8-player roster (top 7 + 1 backup) under a 172 HR salary cap, informed by 2026 HR projections and decision science/ML.

## Environment

- Python 3.14, virtual environment at `.venv/`
- Activate: `source .venv/bin/activate`
- Primary work surface: `main.ipynb` (Jupyter notebook)
- Run notebook: `jupyter notebook main.ipynb` or `jupyter lab`

## Installed Packages

Key packages already in `.venv`: `pandas`, `numpy`, `pypdf2`, `requests`, `lxml`, `ipykernel`, `jupyter_client`

Install new packages with: `.venv/bin/pip install <package>`

## Data

- `hrd-available-players-26.pdf` — source of truth for available players and their 2025 HR totals (= cap cost)
- Parse with `PyPDF2` (already installed)
- Cap: 172 total HRs across 8 players (7 starters + 1 backup)

## Architecture

All analysis lives in `main.ipynb`. The workflow is:
1. **Data wrangling** — extract player names + 2025 HR from PDF
2. **Projection modeling** — build 2026 HR projections (external stats sources + regression/ML)
3. **Optimization** — knapsack/integer programming to select best 8-player roster under cap
