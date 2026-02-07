# Skill: Subgraph Query Patterns

## Purpose
Efficient querying of The Graph subgraphs for Aavegotchi and Polygon ecosystem data. Covers pagination, block-pinning, and known entity schemas.

## Subgraph Endpoints

```js
const SUBGRAPHS = {
  // Aavegotchi Core (Polygon)
  aavegotchi_core: process.env.SUBGRAPH_AAVEGOTCHI_CORE
    || 'https://api.thegraph.com/subgraphs/name/aavegotchi/aavegotchi-core-matic',

  // Aavegotchi SVG / Realm / Gotchiverse
  aavegotchi_gotchiverse: process.env.SUBGRAPH_GOTCHIVERSE
    || 'https://api.thegraph.com/subgraphs/name/aavegotchi/gotchiverse-matic',

  // Aavegotchi Lending
  aavegotchi_lending: process.env.SUBGRAPH_LENDING
    || 'https://api.thegraph.com/subgraphs/name/aavegotchi/aavegotchi-lending',

  // GHST staking
  ghst_staking: process.env.SUBGRAPH_GHST_STAKING
    || 'https://api.thegraph.com/subgraphs/name/aavegotchi/ghst-staking',
};
```

> **Note**: Hosted service is being deprecated. Check Graph Explorer for decentralized endpoints. Decentralized subgraphs require a GRT-paid API key from https://thegraph.com/studio/.

## Pagination: ID-Based (Recommended)

`skip` is limited to 5000 and gets slower. Use ID-based pagination instead:

```js
async function queryAll(subgraphUrl, entityName, fields, filter = '') {
  const results = [];
  let lastId = '';

  while (true) {
    const query = `{
      ${entityName}(
        first: 1000,
        where: { id_gt: "${lastId}" ${filter ? ', ' + filter : ''} }
        orderBy: id
        orderDirection: asc
      ) {
        id
        ${fields}
      }
    }`;

    const res = await fetch(subgraphUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    const data = await res.json();

    if (data.errors) {
      throw new Error(`Subgraph error: ${JSON.stringify(data.errors)}`);
    }

    const entities = data.data[entityName];
    if (entities.length === 0) break;

    results.push(...entities);
    lastId = entities[entities.length - 1].id;

    if (entities.length < 1000) break;
  }

  return results;
}
```

## Block-Pinning for Consistent Snapshots

Query at a specific block to get point-in-time data:

```graphql
{
  aavegotchis(
    first: 1000,
    block: { number: 52000000 }
    where: { owner: "0xDAO_ADDRESS" }
  ) {
    id
    name
    stakedAmount
    escrow
  }
}
```

Use this for treasury snapshots to ensure consistent balances.

```js
async function queryAtBlock(subgraphUrl, query, blockNumber) {
  // Inject block parameter into query
  const blockQuery = query.replace(
    /\((\s*first:)/,
    `(block: { number: ${blockNumber} }, $1`
  );
  // ... fetch as normal
}
```

## Aavegotchi-Specific Entities

### DAO Treasury / Gotchis owned by DAO
```graphql
{
  aavegotchis(where: { owner: "0xDAO_TREASURY" }, first: 1000) {
    id
    name
    hauntId
    numericTraits
    modifiedNumericTraits
    stakedAmount        # GHST staked in Aavegotchi
    escrow              # Escrow wallet address (holds staked GHST)
    kinship
    experience
    lastInteracted
    status              # 0=closed, 1=VRF pending, 2=open portal, 3=aavegotchi
  }
}
```

### GHST Staking Positions
```graphql
{
  stakers(where: { id: "0xDAO_TREASURY" }) {
    id
    ghstStaked
    poolTokens {
      token
      amount
    }
  }
}
```

### Realm Parcels owned by DAO
```graphql
{
  parcels(where: { owner: "0xDAO_TREASURY" }, first: 1000) {
    id
    tokenId
    coordinateX
    coordinateY
    district
    size              # 0=humble, 1=reasonable, 2=spacious, 3=partner
    fudBoost
    fomoBoost
    alphaBoost
    kekBoost
  }
}
```

### Lending Activity
```graphql
{
  gotchiLendings(
    where: { lender: "0xDAO_TREASURY", completed: false }
    first: 1000
  ) {
    id
    gotchiTokenId
    upfrontCost
    period
    splitOwner
    splitBorrower
    splitOther
    whitelistId
    timeCreated
    timeAgreed
  }
}
```

## Time-Based Queries

Subgraph entities with timestamps:

```graphql
{
  erc20Transfers(
    where: {
      from: "0xDAO_TREASURY",
      timestamp_gt: "1700000000"
    }
    orderBy: timestamp
    orderDirection: asc
    first: 1000
  ) {
    id
    from
    to
    amount
    timestamp
    token {
      symbol
      decimals
    }
  }
}
```

## Error Handling

```js
async function subgraphFetch(url, query) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });

  const data = await res.json();

  // Subgraph errors
  if (data.errors) {
    const msg = data.errors.map(e => e.message).join('; ');
    // "indexing_error" = subgraph is behind or broken
    if (msg.includes('indexing_error')) {
      throw new Error(`Subgraph indexing error – data may be stale: ${msg}`);
    }
    throw new Error(`Subgraph query error: ${msg}`);
  }

  return data.data;
}
```

## Hosted vs. Decentralized

| Aspect | Hosted (Legacy) | Decentralized |
|--------|----------------|---------------|
| URL | `api.thegraph.com/subgraphs/name/...` | `gateway.thegraph.com/api/[KEY]/subgraphs/id/...` |
| Auth | None | GRT API key |
| Cost | Free | Pay per query (GRT) |
| Reliability | Deprecated, may go offline | Production-grade |
| Latency | Low | Low |

## Rules
- Use ID-based pagination, not `skip` (breaks above 5000)
- Pin to block number for snapshot consistency
- Check for `data.errors` – subgraphs return 200 even on error
- Hosted service is deprecated – plan for decentralized migration
- Cache subgraph results locally (DB) – don't re-query unchanged data
- Subgraph data can lag 1-5 minutes behind chain head
