# Hungry Ghosts – Aavegotchi Ecosystem Integration

Integration points with the Aavegotchi ecosystem and DAO-Governance projects.

## Aavegotchi Ecosystem

| Component | Description | Links |
|-----------|-------------|-------|
| **aavegotchi-contracts** | Diamond (EIP-2535), facets | [github.com/aavegotchi/aavegotchi-contracts](https://github.com/aavegotchi/aavegotchi-contracts) |
| **deployed-contract-addresses** | GHST, GHO, Aave, Baazaar, Lending | [github.com/aavegotchi/deployed-contract-addresses](https://github.com/aavegotchi/deployed-contract-addresses) |
| **aavegotchi-core-subgraph** | Gotchi data, transfers | [github.com/aavegotchi/aavegotchi-core-subgraph](https://github.com/aavegotchi/aavegotchi-core-subgraph) |
| **gotchiverse-subgraph** | Gotchiverse data | [github.com/aavegotchi/gotchiverse-subgraph](https://github.com/aavegotchi/gotchiverse-subgraph) |

## Contract Addresses (Polygon Mainnet)

Use [deployed-contract-addresses](https://github.com/aavegotchi/deployed-contract-addresses) for authoritative values.

| Token / Contract | Purpose |
|------------------|---------|
| GHST | Belly token, rewards |
| GHO | Staking token (Aave yield) |
| Aave Pool | GHO deposits for yield |

## Subgraphs

- **aavegotchi-core-matic:** Gotchi ownership, XP, traits
- **gotchiverse:** Realm, parcels

Hosted: [The Graph Hosted Service](https://thegraph.com/hosted-service/subgraph/aavegotchi/aavegotchi-core-matic)

## DAO-Governance Integration

| Project | Connection |
|---------|------------|
| **treasury-dashboard** | Realtime revenue display; Hungry Ghosts as showcase |
| **accounting-app** | Transactions, categories, export; shared DAO wallet |
| **aavegotchi-foundation** | Nomination, assessment flow |
| **blockchain-data-scraper** | On-chain revenue tracking |

## Hungry Ghosts Data Flow

```
User (MetaMask) → Frontend (React/Vite)
                       ↓
              Backend API (health, config)
                       ↓
              Subgraph / Polygonscan → Treasury / Accounting
```

## References

- [Hungry Ghosts staking proposition](C:\Users\ronal\CURSOR_guides\Hungry Ghosts staking contract proposition.pdf)
- [Scalable Reward Distribution](https://uploads-ssl.webflow.com/5ad71ffeb79acc67c8bcdaba/5ad8d1193a40977462982470_scalable-reward-distribution-paper.pdf)
- [Aavegotchi Subgraphs](https://docs.aavegotchi.com/subgraphs/general)
