# Skill: Token Price Resolver

## Purpose
Resolves token amounts to USD values using historical prices. Handles GHST, MATIC, ETH, DAI, USDC with caching.

## Price Sources

### CoinGecko (primary)
- Free tier: 10-30 req/min (no key), 500 req/min (demo key)
- Historical prices available

### Stablecoin Shortcut
```js
const STABLECOINS = ['USDC', 'USDT', 'DAI', 'BUSD', 'FRAX'];

function isStablecoin(symbol) {
  return STABLECOINS.includes(symbol.toUpperCase());
}
// Stablecoins → $1.00, skip API call
```

## CoinGecko Token ID Mapping

```js
const COINGECKO_IDS = {
  GHST:  'aavegotchi',
  MATIC: 'matic-network',
  ETH:   'ethereum',
  WETH:  'weth',
  DAI:   'dai',
  USDC:  'usd-coin',
  USDT:  'tether',
  WBTC:  'wrapped-bitcoin',
  AAVE:  'aave',
  LINK:  'chainlink',
  KEK:   'kek-token',     // verify ID
  ALPHA: 'alpha-finance',  // verify ID
  FOMO:  'fomo-token',     // verify ID
  FUD:   'fud-token',      // verify ID
};
```

## Price Cache Table

```sql
CREATE TABLE IF NOT EXISTS price_cache (
  token TEXT NOT NULL,
  date DATE NOT NULL,
  price_usd REAL NOT NULL,
  source TEXT DEFAULT 'coingecko',
  fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (token, date)
);
```

## Core Logic

```js
async function getPrice(symbol, date) {
  // 1. Stablecoin shortcut
  if (isStablecoin(symbol)) return 1.0;

  // 2. Check cache
  const cached = db.prepare(
    'SELECT price_usd FROM price_cache WHERE token = ? AND date = ?'
  ).get(symbol.toUpperCase(), date);
  if (cached) return cached.price_usd;

  // 3. Fetch from CoinGecko
  const price = await fetchCoinGeckoPrice(symbol, date);

  // 4. Cache it
  db.prepare(
    'INSERT OR REPLACE INTO price_cache (token, date, price_usd) VALUES (?, ?, ?)'
  ).run(symbol.toUpperCase(), date, price);

  return price;
}
```

## CoinGecko API

### Historical Price (specific date)
```
GET https://api.coingecko.com/api/v3/coins/{id}/history?date={dd-mm-yyyy}
```

```js
async function fetchCoinGeckoPrice(symbol, dateStr) {
  const id = COINGECKO_IDS[symbol.toUpperCase()];
  if (!id) throw new Error(`Unknown token: ${symbol}`);

  // CoinGecko wants dd-mm-yyyy
  const [year, month, day] = dateStr.split('-');
  const cgDate = `${day}-${month}-${year}`;

  await rateLimiter.wait(); // 10 req/min

  const url = `https://api.coingecko.com/api/v3/coins/${id}/history?date=${cgDate}&localization=false`;
  const res = await fetch(url);

  if (res.status === 429) {
    // Rate limited – wait and retry once
    await new Promise(r => setTimeout(r, 60000));
    return fetchCoinGeckoPrice(symbol, dateStr);
  }

  const data = await res.json();
  return data.market_data?.current_price?.usd || null;
}
```

### Price Range (for bulk backfill)
```
GET https://api.coingecko.com/api/v3/coins/{id}/market_chart/range
    ?vs_currency=usd&from={unix}&to={unix}
```
Returns daily prices – more efficient for backfilling multiple dates.

```js
async function bulkFetchPrices(symbol, fromDate, toDate) {
  const id = COINGECKO_IDS[symbol.toUpperCase()];
  const from = Math.floor(new Date(fromDate).getTime() / 1000);
  const to = Math.floor(new Date(toDate).getTime() / 1000);

  const url = `https://api.coingecko.com/api/v3/coins/${id}/market_chart/range?vs_currency=usd&from=${from}&to=${to}`;
  const res = await fetch(url);
  const data = await res.json();

  // data.prices = [[timestamp_ms, price], ...]
  const insertPrice = db.prepare(
    'INSERT OR IGNORE INTO price_cache (token, date, price_usd) VALUES (?, ?, ?)'
  );

  db.transaction(() => {
    for (const [ts, price] of data.prices) {
      const date = new Date(ts).toISOString().split('T')[0];
      insertPrice.run(symbol.toUpperCase(), date, price);
    }
  })();

  return data.prices.length;
}
```

## Resolving Transaction USD Values

```js
async function enrichTransactionWithUsd(tx) {
  const date = tx.date.split('T')[0]; // YYYY-MM-DD
  const price = await getPrice(tx.currency, date);

  if (price !== null) {
    tx.amount_usd = tx.amount * price;
  } else {
    tx.amount_usd = null; // flag for manual review
    logger.warn(`No price for ${tx.currency} on ${date}`);
  }

  return tx;
}
```

## Backfill Strategy

For historical data (e.g., 2 years of transactions):
1. Collect unique `(token, date)` pairs from transactions missing `amount_usd`
2. Group by token
3. Use `market_chart/range` for each token (one call per token per 90-day window)
4. Bulk insert into `price_cache`
5. Then run `UPDATE transactions SET amount_usd = amount * (SELECT price_usd FROM price_cache ...)`

## Fallback Strategy

1. CoinGecko free API
2. CoinGecko with demo key (higher limits)
3. Manual price entry (for obscure tokens like KEK, ALPHA, FOMO, FUD)
4. Mark as NULL + flag for review

## Rules
- Always check cache before API call
- Stablecoins = $1.00, never call API for them
- Rate limit CoinGecko: max 8 req/min (leave headroom)
- Use bulk `market_chart/range` for backfill, not individual `/history` calls
- Store prices as-of daily close, not intraday
- NULL `amount_usd` is better than a wrong number – flag for review
