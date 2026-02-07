# Skill: Incremental Scraper State

## Purpose
Tracks scraper position across runs so scrapers resume where they left off instead of re-processing from block 0.

## Schema

```sql
CREATE TABLE IF NOT EXISTS scraper_state (
  source TEXT NOT NULL,           -- 'polygonscan_txlist', 'polygonscan_tokentx', 'subgraph_core'
  chain TEXT NOT NULL,            -- 'polygon', 'base'
  last_block INTEGER DEFAULT 0,
  last_timestamp TEXT,
  last_id TEXT,                   -- for cursor-based pagination (subgraphs)
  records_total INTEGER DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (source, chain)
);
```

## Core Pattern: Transactional State Update

**Critical**: Always update data and state in the same transaction. If either fails, both roll back.

```js
function processAndSave(records, source, chain, lastBlock) {
  const db = getDb();

  db.transaction(() => {
    // 1. Insert/upsert the scraped data
    const insert = db.prepare(`
      INSERT OR IGNORE INTO transactions
        (tx_hash, chain, date, from_address, to_address, amount, currency, amount_usd, type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const r of records) {
      insert.run(r.tx_hash, chain, r.date, r.from, r.to, r.amount, r.currency, r.amountUsd, r.type);
    }

    // 2. Update state in SAME transaction
    db.prepare(`
      INSERT INTO scraper_state (source, chain, last_block, records_total, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'))
      ON CONFLICT(source, chain) DO UPDATE SET
        last_block = excluded.last_block,
        records_total = records_total + excluded.records_total,
        updated_at = datetime('now')
    `).run(source, chain, lastBlock, records.length);
  })();
}
```

## Modes

### Incremental (default)
```js
const state = db.prepare(
  'SELECT last_block FROM scraper_state WHERE source = ? AND chain = ?'
).get(source, chain);
const startBlock = (state?.last_block || 0) + 1;
// Fetch from startBlock to 'latest'
```

### Backfill
```js
// Start from block 0 (or a known genesis block) up to current state
const state = db.prepare(
  'SELECT last_block FROM scraper_state WHERE source = ? AND chain = ?'
).get(source, chain);
const endBlock = state?.last_block || currentBlock;
// Fetch from 0 to endBlock in chunks
```

### Re-scrape (idempotent)
```js
// Re-process a specific range without moving state forward
// Uses INSERT OR IGNORE / ON CONFLICT DO UPDATE for idempotency
function rescrape(source, chain, fromBlock, toBlock) {
  // Fetch and upsert, but DON'T update scraper_state
}
```

## Idempotency Patterns

### For transactions (keyed on tx_hash + chain):
```sql
INSERT OR IGNORE INTO transactions (tx_hash, chain, ...) VALUES (?, ?, ...);
```

### For snapshots (keyed on date + chain):
```sql
INSERT INTO treasury_snapshots (date, chain, ...) VALUES (?, ?, ...)
ON CONFLICT(date, chain) DO UPDATE SET
  ghst_balance = excluded.ghst_balance,
  total_usd = excluded.total_usd,
  updated_at = datetime('now');
```

## Block Range Chunking

Polygonscan and RPC calls should chunk by block range to avoid timeouts:

```js
const CHUNK_SIZE = 10000; // blocks per request

async function scrapeInChunks(startBlock, endBlock, fetchFn) {
  let current = startBlock;
  while (current <= endBlock) {
    const chunkEnd = Math.min(current + CHUNK_SIZE - 1, endBlock);
    const records = await fetchFn(current, chunkEnd);
    processAndSave(records, source, chain, chunkEnd);
    current = chunkEnd + 1;
  }
}
```

## State Inspection

```js
// scripts/scraper-status.js
const states = db.prepare('SELECT * FROM scraper_state ORDER BY chain, source').all();
console.table(states);
// Output:
// source                | chain   | last_block | records_total | updated_at
// polygonscan_txlist    | polygon | 52345678   | 12043         | 2025-01-15T...
// polygonscan_tokentx   | base    | 8901234    | 3421          | 2025-01-15T...
```

## Rules
- NEVER update state outside a transaction that also writes data
- NEVER decrease `last_block` (only move forward or stay)
- Always use `INSERT OR IGNORE` or `ON CONFLICT` for data – never assume uniqueness
- Log every state update with block range and record count
- Keep `records_total` as a running count for monitoring
