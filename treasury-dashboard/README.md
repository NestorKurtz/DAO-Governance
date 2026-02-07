# Aavegotchi DAO Treasury Dashboard

Dashboard for income and assets of the Aavegotchi DAO – totals, breakdown by source/wallet, time series (7/30/365 days).

## Goals

- **Income:** Overview and time series by source (Crafting, Baazaar, GBM, Forge etc.) for 7/30/365 days.
- **Assets:** Current balances by wallet, change per week/month (GHST, DAI, USDC, Alchemica, Alloy, Matic, LP).
- **Data basis:** Last 365 days of transaction history; optional Dune, Subgraphs, Polygonscan.

## Project structure

```
treasury-dashboard/
├── README.md           # This file
├── .gitignore
├── .env.example        # Environment variables (API keys, endpoints)
├── docs/               # Specifications, notes
├── backend/            # API, data queries, optional scraper
└── frontend/           # Dashboard UI (charts, tables)
```

## Quick start

- Backend and frontend will be added as needed.
- Legacy specs and addresses: see `../AAVEGOTCHI_TREASURY_DASHBOARD_OLD_SPECS.md` and `docs/`.

## Tech stack (planned)

- **Backend:** Node/Express or static site with API proxy; data from Dune/Subgraph/Polygonscan.
- **Frontend:** React/Vite + charts (e.g. Recharts), Tailwind.
- **Deploy:** Coolify on aavegotchidao.cloud, HTTPS via Traefik.
