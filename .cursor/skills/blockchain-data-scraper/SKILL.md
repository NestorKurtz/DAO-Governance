---
name: blockchain-data-scraper
description: Scrapes blockchain data via subgraphs (GraphQL) and block explorers (e.g. Polygonscan), designs and populates databases, stores data securely, and runs continuous or scheduled scrapers. Use when building or maintaining blockchain scrapers, subgraph queries, treasury/transaction imports, budget history, or DAO accounting data pipelines.
---

# Blockchain Data Scraper

Use this skill when implementing or extending blockchain data pipelines for the accounting app (e.g. 2024/2025 budget and treasury data), subgraph integrations, or secure storage of on-chain data.

## Core Principles

1. **Continuous > one-off** – Prefer scheduled/continuous scraping so budget, treasury, and transaction history are always up to date. One-off import is for backfill or manual runs only.
2. **Subgraphs first** – Use The Graph (subgraphs) for structured, indexed data (transfers, events, balances) when available; fall back to block explorer APIs for raw txs.
3. **DB as source of truth** – Persist all scraped data in the project DB (SQLite now, optional PostgreSQL later). Never rely only on live API responses for reporting.
4. **Secure storage** – No API keys in code; use env vars. Validate and sanitize all inputs. Use parameterized queries; never concatenate user/API data into SQL.

## Data Sources

| Source | Use case | Auth |
|--------|----------|------|
| **Subgraph (GraphQL)** | Transfers, events, balances, historical queries | Usually public; optional API key for hosted service |
| **Polygonscan (REST)** | Normal txs, internal txs, token transfers by address | `POLYGONSCAN_API_KEY` in env (higher rate limits) |
| **RPC** | Raw block/transaction data when subgraph is insufficient | Optional; use env for endpoint and key |

## Subgraph Workflow

1. **Identify endpoint** – Aavegotchi/Polygon subgraphs (see [reference.md](reference.md)). Use hosted service or decentralized network URL.
2. **Query in batches** – Use `first`/`skip` or cursor-based pagination; respect `max(first)` (often 1000). Loop until no more results.
3. **Handle block ranges** – For historical backfill, query by `blockNumber_gte`/`blockNumber_lte` or `timestamp` in chunks (e.g. 1 week) to avoid timeouts.
4. **Normalize to app schema** – Map subgraph entities to `transactions`, `treasury_snapshots`, or `budgets` as per accounting app schema. Deduplicate by `tx_hash` or external id.

Example pattern:

```javascript
// Paginated GraphQL query
async function fetchAllTransfers(subgraphUrl, fromBlock, toBlock) {
  const first = 1000;
  let skip = 0;
  let hasMore = true;
  const results = [];
  while (hasMore) {
    const { data } = await graphql(subgraphUrl, GET_TRANSFERS, {
      first, skip, fromBlock, toBlock
    });
    results.push(...data.transfers);
    hasMore = data.transfers.length === first;
    skip += first;
  }
  return results;
}
```

## Block Explorer (Polygonscan) Workflow

1. **Rate limits** – With API key: 5 req/s; without: 1 req/5s. Use a small delay between requests in loops.
2. **Endpoints** – `account/tokentx`, `account/txlist`, `account/tokentx` for ERC-20; use `startblock`/`endblock` for historical ranges.
3. **Parse and categorize** – Map to accounting fields (`date`, `amount`, `currency`, `tx_hash`, `from_address`, `to_address`, `chain`). Use `services/dao-addresses.js` and heuristics for category.
4. **Upsert** – Insert or update by `tx_hash` to avoid duplicates when re-running.

## Database Alignment (Accounting App)

Use the existing or planned schema:

- **transactions** – `date`, `description`, `amount`, `currency`, `amount_usd`, `category_id`, `type`, `tx_hash`, `from_address`, `to_address`, `chain`, `notes`, `reconciled`, etc.
- **treasury_snapshots** – `date`, `ghst_balance`, `usdc_balance`, `dai_balance`, `matic_balance`, `total_usd`, optional MTD/YTD.
- **budgets** – `category_id`, `year`, `quarter`, `amount`, `currency`, `notes`.

Scraper outputs must match these tables so the app can report 2024/2025 budget and treasury without re-fetching from chain.

## Secure Storage Checklist

- [ ] All secrets in env (e.g. `POLYGONSCAN_API_KEY`, `SUBGRAPH_API_KEY`, `DB_PASSWORD`). Never commit.
- [ ] Parameterized queries only; no string concatenation for SQL.
- [ ] Validate addresses (e.g. 0x + 40 hex), block numbers (integer), dates.
- [ ] Log errors and skip bad rows; do not expose internal errors to API responses.
- [ ] If writing to shared DB, use transactions for bulk inserts and handle unique constraint (e.g. on `tx_hash`).

## Continuous / Scheduled Scraping

To know budget and treasury for 2024 and 2025 without manual runs:

1. **Scheduler** – Use cron, PM2 `cron_restart`, or a small worker (e.g. `scripts/scraper-worker.js`) that runs on an interval (e.g. daily for snapshots, hourly for new txs).
2. **Incremental** – Store last scraped block or timestamp; next run fetches only from that point.
3. **Idempotent** – Use upsert (e.g. `INSERT ... ON CONFLICT(tx_hash) DO UPDATE`) so re-runs are safe.
4. **Health** – Log success/failure and last run time; optional alert if a run fails or lags.

When adding a new scraper, prefer making it runnable as a scheduled job and document the schedule (e.g. in README or `ecosystem.config.js`).

## When to Use This Skill

- User asks to scrape blockchain data, subgraph data, or treasury/transaction history.
- User asks how to get 2024/2025 budget or treasury data for the accounting app.
- User wants continuous or non-stop scraping, scheduled imports, or a scraper worker.
- User is building or modifying `polygonscan.js`, subgraph clients, or DB tables for on-chain data.
- User asks where scraped data is stored or how to make it secure.

## Additional Resources

- Subgraph URLs and example queries: [reference.md](reference.md)
- Accounting app schema and roadmap: `accounting-app/ACCOUNTING_ROADMAP.md`, `CURSOR_ACCOUNTING_PLAN.md`
