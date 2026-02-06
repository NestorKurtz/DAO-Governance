# Blockchain Data Scraper – Reference

## Subgraph Endpoints

**Aavegotchi (Polygon)**

- **Hosted (legacy):** `https://api.thegraph.com/subgraphs/name/aavegotchi/aavegotchi-core-matic`
- **Hosted (current):** Check [The Graph Hosted Service](https://thegraph.com/hosted-service/subgraph/aavegotchi/aavegotchi-core-matic) for the active URL (they may use `https://api.thegraph.com/subgraphs/name/aavegotchi/aavegotchi-core-matic` or a gateway).
- **Decentralized:** Use [Graph Explorer](https://thegraph.com/explorer) and select the Aavegotchi subgraph; copy the "Query URL" for the chain (Polygon).
- **Docs:** [Aavegotchi Subgraphs](https://docs.aavegotchi.com/subgraphs/general) – lists all subgraphs (core, baazaar, etc.).

Use env var `SUBGRAPH_AAVEGOTCHI_CORE` (and similar for others) so endpoints can change without code edits.

## Example Subgraph Queries (conceptual)

**Token transfers (adjust entity names to actual schema):**

```graphql
query Transfers($first: Int!, $skip: Int!, $fromBlock: Int!, $toBlock: Int!) {
  transfers(
    first: $first
    skip: $skip
    where: {
      blockNumber_gte: $fromBlock
      blockNumber_lte: $toBlock
    }
    orderBy: blockNumber
    orderDirection: asc
  ) {
    id
    from
    to
    value
    blockNumber
    blockTimestamp
    transactionHash
    token
  }
}
```

**Treasury / balance snapshots:** Query the subgraph for balance or transfer entities tied to the DAO treasury address; aggregate by day for `treasury_snapshots`. Exact query depends on the deployed subgraph schema – inspect the schema in the Graph Playground.

## Polygonscan API

- **Base URL:** `https://api.polygonscan.com/api`
- **Token transfers (ERC-20):** `?module=account&action=tokentx&address={address}&startblock={start}&endblock={end}&sort=asc`
- **Normal tx list:** `?module=account&action=txlist&address={address}&startblock={start}&endblock={end}&sort=asc`
- **API key:** Add `&apikey={POLYGONSCAN_API_KEY}` for higher rate limits (5 req/s vs 1 req/5s).
- **Docs:** [Polygonscan API](https://docs.polygonscan.com/)

## Accounting App Schema (target tables)

Scrapers should write to:

- **transactions** – `date`, `description`, `amount`, `currency`, `amount_usd`, `category_id`, `type`, `tx_hash`, `from_address`, `to_address`, `chain`, `notes`, `reconciled`, …
- **treasury_snapshots** – `date`, `ghst_balance`, `usdc_balance`, `dai_balance`, `matic_balance`, `total_usd`, …
- **budgets** – `category_id`, `year`, `quarter`, `amount`, `currency`, `notes`

Full DDL: `CURSOR_ACCOUNTING_PLAN.md` (Phase 1) and `accounting-app/ACCOUNTING_ROADMAP.md`.

## Incremental Scraping State

Store last synced position so runs are incremental:

- **Option A:** Table `scraper_state` with columns like `source` (e.g. `polygonscan_treasury`), `last_block` or `last_timestamp`, `updated_at`.
- **Option B:** Config or env (e.g. `LAST_SCRAPED_BLOCK=45000000`). Prefer DB so multiple workers stay in sync.

## Scheduling (PM2)

Example in `ecosystem.config.js` for a daily snapshot scraper:

```javascript
{
  name: 'scraper-treasury',
  script: 'scripts/scraper-treasury.js',
  cron_restart: '0 2 * * *',  // 02:00 daily
  autorestart: false
}
```

Run the script once per cron tick; use incremental state so each run only fetches new data.
