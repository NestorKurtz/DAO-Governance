# Hungry GHost

Project within the Aavegotchi DAO – part of the **upcoming Budget Proposal**. Goal: introduce and surface revenue for the DAO.

## Context

- **Budget Proposal:** Hungry GHost will be anchored as a revenue stream in the next budget proposal.
- **Revenue:** Set up from the start so income is clearly recorded and attributable to the DAO (e.g. for Treasury Dashboard and Accounting App).
- **Realtime monitoring showcase:** Hungry GHost serves as a showcase for realtime monitoring – live visibility of revenue and activity.

## Project structure

```
hungry-ghost/
├── contracts/          # HungryGhostsStaking.sol (GHO/GHST staking)
├── backend/            # API (health, config)
├── frontend/           # React/Vite dashboard – wallet connect, GHST/GHO display
├── docs/               # PROJECT.md, BUDGET_PROPOSAL_NOTES.md, ECOSYSTEM.md
├── .env.example
└── README.md
```

## Development

**Backend** (port 5175):

```bash
cd hungry-ghost/backend
cp ../.env.example .env   # edit as needed
npm install
npm start
```

**Frontend** (port 5174):

```bash
cd hungry-ghost/frontend
npm install
npm run dev
```

Open http://localhost:5174 – connect MetaMask to Polygon, view GHST/GHO balances.

**Contracts** – Compile with root Hardhat: contracts live in `hungry-ghost/contracts/`. See `docs/ECOSYSTEM.md` for Aavegotchi integration.

## Integration with the DAO

- **Revenue:** Design concept/implementation so revenue (e.g. sales, fees) is clearly mapped to a DAO wallet or reporting endpoint.
- **Reporting:** Optional integration with Treasury Dashboard and Accounting App (shared categories, address config).
- **Governance:** Maintain all info relevant to the budget proposal in `docs/` (goals, milestones, expected revenue).

## Next steps (optional)

1. Document in `docs/`: short description for the budget proposal, expected revenue, milestones.
2. Add backend/frontend once scope is clear.
3. Define the revenue stream (wallet, API, bookings) so it can integrate with Treasury/Accounting.
