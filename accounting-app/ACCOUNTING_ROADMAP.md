# Aavegotchi DAO Accounting App – Aligned Roadmap

A unified plan that builds on the existing accounting app and incorporates DAO-specific features from CURSOR_ACCOUNTING_PLAN.md.

---

## Current State vs Target

| Area | Current | Target (from Plan) |
|------|---------|---------------------|
| **Database** | SQLite, user-scoped | SQLite now → optional PostgreSQL later; DAO-scoped mode |
| **Schema** | users, categories, transactions | + blockchain fields, treasury_snapshots, budgets, expense_requests |
| **Auth** | JWT, multi-user | Keep JWT; add admin/DAO mode (single org) |
| **Categories** | User-defined | DAO standard categories + user-defined |
| **Reports** | summary, trends | + monthly, category, comparison, tax export |
| **Import** | None | CSV, Blockchain (Polygonscan) |
| **Export** | None | CSV, PDF, tax report |
| **Frontend** | Dashboard, Transactions, Reports, Categories | + Import page, richer charts, alerts |

---

## Guiding Principles

1. **Extend, don’t replace** – Build on existing features where possible.
2. **SQLite first** – Keep SQLite for local/dev; document PostgreSQL path.
3. **DAO mode** – Support both personal accounting and DAO org mode.
4. **Reuse** – Use existing auth, transactions CRUD, reports as a base.

---

## Phase 1: Schema & DAO Foundation (Week 1)

### 1.1 Schema Extensions (SQLite-compatible)

Add migrations that extend the current schema:

**Transactions table – add columns:**
- `currency` (default: USDC)
- `amount_usd`
- `tx_hash`, `from_address`, `to_address`, `chain`
- `notes`, `reconciled`, `reconciled_at`, `reconciled_by`

**New tables:**
- `treasury_snapshots` – daily balances (GHST, USDC, DAI, MATIC, total_usd)
- `budgets` – category/year/quarter budgets
- `expense_requests` – link to Foundation App

### 1.2 DAO Standard Categories

Add seed/migration with DAO categories (from plan):

- Income: Protocol Revenue, NFT Sales, Baazaar Fees, Rental Revenue, Grants Received, Token Sales, Interest/Yield, Other Income  
- Expense: Development, Salaries, Marketing, Infrastructure, Legal, Audits, Grants Given, Multi-Sig Compensation, Gas Fees, Other Expense  

Support both DAO defaults and user-defined categories.

### 1.3 Database Abstraction

- Introduce `backend/database/` with migrations.
- Keep `config/database.js` as the main DB interface.
- Add `scripts/migrate-dao.js` for DAO schema upgrades.

**Deliverables:**
- [ ] Migration script for schema extensions  
- [ ] DAO category seed  
- [ ] Backward-compatible init-db  

---

## Phase 2: Backend Enhancements (Week 2)

### 2.1 Transactions API Extensions

Extend `routes/transactions.js`:

- Filter: `minAmount`, `maxAmount`, `search`, `reconciled`
- Pagination
- `POST /api/transactions/bulk` for bulk insert
- Handle new fields (tx_hash, currency, reconciled)

### 2.2 Reports API Extensions

Extend `routes/reports.js`:

| Endpoint | Purpose |
|----------|---------|
| `GET /api/reports/summary` | Extend with year/quarter/month params |
| `GET /api/reports/trends` | Already exists |
| `GET /api/reports/monthly/:year` | 12 months income/expense/net |
| `GET /api/reports/category/:id` | By category, date range |
| `GET /api/reports/comparison` | Period vs period |

### 2.3 Import API

New `routes/import.js`:

- `POST /api/import/csv` – upload CSV, preview, map columns, import
- `POST /api/import/blockchain` – fetch from Polygonscan, preview, categorize, import  

New `services/polygonscan.js`:

- `getTransactionsByAddress(address, startBlock, endBlock)`
- `getTokenTransfers(address, token, startDate, endDate)`
- `parseTransactionToAccounting(tx)`
- `categorizeTransaction(tx)` – heuristic based on addresses, token, method  

### 2.4 Export API

New `routes/export.js`:

- `GET /api/export/csv` – query params: startDate, endDate, categories
- `GET /api/export/pdf` – year, quarter
- `GET /api/export/tax-report/:year` – tax-oriented report  

**Dependencies to add:**  
`axios`, `csv-parse`, `pdfkit` (backend)

**Deliverables:**
- [ ] Transactions filters & bulk endpoint  
- [ ] Reports endpoints  
- [ ] Import routes + Polygonscan service  
- [ ] Export routes  

---

## Phase 3: Frontend Enhancements (Week 3)

### 3.1 Dashboard Upgrades

- Summary cards: Income YTD, Expenses YTD, Net, Treasury (when available)
- Charts: Income vs Expense (bar), Expenses by category (pie), Treasury over time (line)
- Recent transactions (last 10) with quick actions
- Alerts: budget overruns, unreconciled, pending expense requests

### 3.2 Transactions Page Enhancements

- Filters: date range, category, type, amount range, search, reconciled
- Sortable columns
- Bulk actions: categorize, delete
- Inline category edit
- Quick add form

### 3.3 Import Page (New)

New `Import.jsx`:

- CSV upload + column mapping
- Blockchain import: address, date range, fetch, preview, categorize, confirm
- Progress and error handling

### 3.4 Reports Page Enhancements

- Year/quarter/month selector
- Monthly breakdown table
- Category drill-down
- Period comparison
- Export buttons (CSV, PDF)

### 3.5 Shared Components

- `TransactionTable.jsx` – reusable table
- `CategorySelect.jsx` – category dropdown
- `DateRangePicker.jsx` – date range
- `ExportButton.jsx` – export options

**Dependencies:** `react-datepicker` (optional), existing `recharts`

**Deliverables:**
- [ ] Dashboard updates  
- [ ] Transaction filters & bulk actions  
- [ ] Import page  
- [ ] Reports enhancements  
- [ ] Shared components  

---

## Phase 4: DAO Data & Integration (Week 4)

### 4.1 DAO Addresses Config

`services/dao-addresses.js`:

```javascript
const DAO_ADDRESSES = {
  treasury: '0x...',
  multisig: '0x...',
  baazaar: '0x...',
  lending: '0x...',
  staking: '0x...'
};
```

### 4.2 2024 Historical Import

- Fetch 2024 transactions from treasury address
- Auto-categorize
- UI for review and manual categorization
- Reconciliation workflow

### 4.3 Foundation App Integration

- Sync expense requests from Foundation API
- Link payment votes to expense_requests
- Optional: API endpoint to pull Foundation data

### 4.4 Treasury Snapshots

- Manual or scheduled snapshot creation
- Store balances by token
- Use for Treasury Balance chart

### 4.5 Continuous / Scheduled Scraping (required for 2024/2025 budget data)

To know what the budget was in 2024 and 2025 (and current treasury), scraping must run **continuously or on a schedule**, not only on manual import.

- **Subgraphs** – Use The Graph (Aavegotchi subgraphs on Polygon) for transfers, events, balances; see `.cursor/skills/blockchain-data-scraper/`.
- **Block explorer** – Polygonscan for raw txs and token transfers when subgraph is insufficient.
- **Scheduler** – Cron or PM2 `cron_restart` (e.g. daily treasury snapshots, hourly new transactions). Store `last_block`/`last_timestamp` for incremental runs.
- **DB as source of truth** – All scraped data persisted in `transactions`, `treasury_snapshots`, `budgets` so reports and 2024/2025 budget views do not depend on live API calls.
- **Skill** – Use the **blockchain-data-scraper** skill when implementing or extending scrapers, subgraph clients, or secure storage.

**Deliverables:**
- [ ] DAO addresses config  
- [ ] 2024 import flow  
- [ ] Foundation integration (or API stub)  
- [ ] Treasury snapshot support  
- [ ] Scheduled scraper(s) and incremental state (e.g. `scraper_state` table or script)  

---

## Phase 5: Polish & Production (Week 5+)

### 5.1 Validation & Security

- Input validation on all new endpoints
- Admin-only routes for DAO mode
- Rate limiting
- Audit logging for sensitive actions

### 5.2 Environment & Config

`.env.example` updates:

```
# Existing
PORT=5000
JWT_SECRET=...

# New (optional)
POLYGONSCAN_API_KEY=
COINGECKO_API_KEY=
FOUNDATION_API_URL=http://localhost:3000
DB_TYPE=sqlite  # or postgres
```

### 5.3 PostgreSQL Migration Path (Optional)

- Add `pg` dependency
- `config/database.js` – support SQLite and PostgreSQL via `DB_TYPE`
- Adapt schema/migrations for PostgreSQL (JSONB, etc.)
- Document migration steps

### 5.4 Deployment

- Use existing `deploy.sh` and `ecosystem.config.js`
- Document Hostinger/Coolify deployment
- Backup strategy for SQLite/PostgreSQL

**Deliverables:**
- [ ] Validation and security  
- [ ] .env and config  
- [ ] Optional PostgreSQL support  
- [ ] Deployment docs  

---

## Project Structure (Target)

```
accounting-app/
├── backend/
│   ├── server.js
│   ├── config/
│   │   └── database.js
│   ├── database/
│   │   ├── schema.sql          # Reference schema (PostgreSQL)
│   │   ├── migrations/         # SQLite migrations
│   │   └── seed-dao-categories.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── categories.js
│   │   ├── transactions.js
│   │   ├── reports.js
│   │   ├── import.js           # NEW
│   │   └── export.js           # NEW
│   ├── services/
│   │   ├── polygonscan.js      # NEW
│   │   ├── treasury.js         # NEW (optional)
│   │   └── dao-addresses.js    # NEW
│   ├── middleware/
│   │   ├── auth.js
│   │   └── validation.js       # NEW
│   └── scripts/
│       ├── init-db.js
│       └── migrate-dao.js      # NEW
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── ... (existing)
│       │   ├── TransactionTable.jsx   # NEW/refactored
│       │   ├── CategorySelect.jsx     # NEW/refactored
│       │   ├── DateRangePicker.jsx    # NEW
│       │   └── ExportButton.jsx       # NEW
│       ├── pages/              # or keep components/
│       │   └── Import.jsx      # NEW
│       └── ...
└── ACCOUNTING_ROADMAP.md
```

---

## Checklist Summary

| Phase | Focus | Key Tasks |
|-------|-------|-----------|
| **1** | Schema & DAO | Migrations, DAO categories, treasury/budgets tables |
| **2** | Backend | Import/Export APIs, Polygonscan, report extensions |
| **3** | Frontend | Dashboard, Import page, filters, export UI |
| **4** | DAO Data | 2024 import, Foundation integration, treasury snapshots |
| **5** | Polish | Security, optional PostgreSQL, deployment |

---

## References

- **Existing app**: `accounting-app/README.md`, `backend/`, `frontend/`
- **Original plan**: `CURSOR_ACCOUNTING_PLAN.md`
- **Foundation app**: `aavegotchi-foundation/` (expense submissions, payment votes)

---

*Roadmap created 2025-02-05 – Aligned with CURSOR_ACCOUNTING_PLAN and current accounting-app*
