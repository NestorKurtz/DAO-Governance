# Skill: Multi-Chain Scraper (Polygon + Base)

## Purpose
Scrapes blockchain data from Polygon and Base chains using Etherscan-compatible APIs (Polygonscan, Basescan).

## Chain Configuration

```js
const CHAINS = {
  polygon: {
    name: 'Polygon',
    explorerApi: 'https://api.polygonscan.com/api',
    apiKeyEnv: 'POLYGONSCAN_API_KEY',
    nativeCurrency: 'MATIC',
    blockTime: 2, // seconds
  },
  base: {
    name: 'Base',
    explorerApi: 'https://api.basescan.org/api',
    apiKeyEnv: 'BASESCAN_API_KEY',
    nativeCurrency: 'ETH',
    blockTime: 2,
  },
};
```

## DAO Wallet Addresses

```js
const DAO_WALLETS = {
  polygon: [
    '0x...',  // DAO Treasury
    '0x...',  // Multisig
  ],
  base: [
    '0x...',  // DAO Treasury on Base
  ],
};
```

## Etherscan-Compatible API Endpoints

All Etherscan forks (Polygonscan, Basescan) share the same API interface:

### Normal Transactions
```
GET ?module=account&action=txlist&address={ADDR}
    &startblock={FROM}&endblock={TO}
    &page=1&offset=10000&sort=asc
    &apikey={KEY}
```

### Internal Transactions
```
GET ?module=account&action=txlistinternal&address={ADDR}
    &startblock={FROM}&endblock={TO}
    &page=1&offset=10000&sort=asc
    &apikey={KEY}
```

### ERC-20 Token Transfers
```
GET ?module=account&action=tokentx&address={ADDR}
    &startblock={FROM}&endblock={TO}
    &page=1&offset=10000&sort=asc
    &apikey={KEY}
```

### Current Block Number
```
GET ?module=proxy&action=eth_blockNumber&apikey={KEY}
```

## Rate Limiting

| Tier | Polygonscan | Basescan |
|------|-------------|----------|
| Free | 5 req/s | 5 req/s |
| With key | 5 req/s (higher daily) | 5 req/s |

```js
class RateLimiter {
  constructor(maxPerSecond = 4) { // leave 1 req/s headroom
    this.interval = 1000 / maxPerSecond;
    this.lastCall = 0;
  }

  async wait() {
    const now = Date.now();
    const elapsed = now - this.lastCall;
    if (elapsed < this.interval) {
      await new Promise(r => setTimeout(r, this.interval - elapsed));
    }
    this.lastCall = Date.now();
  }
}
```

## Generic Fetcher

```js
async function fetchExplorerApi(chain, params) {
  const config = CHAINS[chain];
  const apiKey = process.env[config.apiKeyEnv] || '';
  const limiter = rateLimiters[chain];

  await limiter.wait();

  const url = new URL(config.explorerApi);
  Object.entries({ ...params, apikey: apiKey }).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString());
  const data = await res.json();

  // Etherscan API returns status "0" for errors (NOT HTTP errors)
  if (data.status === '0' && data.message !== 'No transactions found') {
    throw new Error(`${config.name} API error: ${data.message} – ${data.result}`);
  }

  return data.result || [];
}
```

## Scraper Structure

```js
async function scrapeChain(chain) {
  const wallets = DAO_WALLETS[chain];

  for (const address of wallets) {
    // Each wallet × endpoint = separate scraper_state entry
    for (const action of ['txlist', 'txlistinternal', 'tokentx']) {
      const source = `explorer_${action}`;
      const state = getState(source, chain);
      const currentBlock = await getCurrentBlock(chain);

      await scrapeInChunks(
        state.last_block + 1,
        currentBlock,
        (from, to) => fetchExplorerApi(chain, {
          module: 'account',
          action,
          address,
          startblock: from,
          endblock: to,
          sort: 'asc',
          offset: 10000,
        })
      );
    }
  }
}
```

## Transaction Normalization

Different endpoints return different fields. Normalize to a common format:

```js
function normalizeTx(raw, chain, action) {
  const base = {
    tx_hash: raw.hash,
    chain,
    block_number: parseInt(raw.blockNumber),
    date: new Date(parseInt(raw.timeStamp) * 1000).toISOString(),
    from_address: raw.from.toLowerCase(),
    to_address: raw.to.toLowerCase(),
  };

  if (action === 'tokentx') {
    return {
      ...base,
      amount: parseFloat(raw.value) / Math.pow(10, parseInt(raw.tokenDecimal)),
      currency: raw.tokenSymbol,
      contract_address: raw.contractAddress.toLowerCase(),
    };
  }

  return {
    ...base,
    amount: parseFloat(raw.value) / 1e18,
    currency: CHAINS[chain].nativeCurrency,
  };
}
```

## Bridge Transaction Detection

Cross-chain bridges use known contracts. Flag these for reconciliation:

```js
const BRIDGE_CONTRACTS = {
  polygon: ['0x...'], // Polygon Bridge
  base: ['0x...'],    // Base Bridge
};

function isBridgeTx(tx, chain) {
  const bridges = BRIDGE_CONTRACTS[chain] || [];
  return bridges.includes(tx.to_address) || bridges.includes(tx.from_address);
}
```

## Environment Variables

```
POLYGONSCAN_API_KEY=your-key
BASESCAN_API_KEY=your-key
```

## Rules
- Always use rate limiter – never fire requests without throttling
- Check `data.status === '0'` – Etherscan returns HTTP 200 for API errors
- Normalize all addresses to lowercase before storing
- Store `chain` field on every record – never assume single-chain
- Handle "No transactions found" gracefully (empty result, not error)
- Use block range chunking (10,000 blocks per request) for backfill
