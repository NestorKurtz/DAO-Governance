# DAO-Governance

Diamond Standard (EIP-2535) DAO Governance and Signer Election System.

Two deployment options: **Standalone** (single contract, quick deploy) and **Diamond** (modular, upgradeable).

## Quick Start

```bash
npm install
npx hardhat compile
npx hardhat test
```

## Project Structure

```
contracts/
  standalone/
    DAOQuestionnaire.sol    # Single contract - deploy in minutes
  Diamond.sol               # Diamond proxy
  facets/
    NominationFacet.sol     # Candidate nominations
    AssessmentFacet.sol     # 4-trait scoring questionnaire
    AvailabilityFacet.sol   # Signer availability tracking
    PerformanceFacet.sol    # Reliability scoring
    DiamondCutFacet.sol     # Upgrade management
    DiamondLoupeFacet.sol   # Introspection
    OwnershipFacet.sol      # Access control
  libraries/
    LibDiamond.sol          # Diamond storage logic
    LibAppStorage.sol       # Shared AppStorage pattern
  interfaces/
    IDiamondCut.sol
    IDiamondLoupe.sol
    IERC165.sol
scripts/
  deploy-standalone.js      # Deploy standalone version
  deploy-diamond.js         # Deploy full Diamond version
test/
  DAOQuestionnaire.test.js  # 24 tests
```

## Assessment System

Each voter distributes **100 ValuePoints** across 4 traits:

| Trait | Description |
|-------|-------------|
| Technical Competence | Protocol knowledge, verification ability |
| Reliability & Commitment | Track record, consistency |
| Communication & Transparency | Responsiveness, proactive sharing |
| DAO Values Alignment | Long-term thinking, community-first |

**Rules:**
- Scores must total exactly 100
- Minimum 5 points per trait
- Optional 69-character feedback
- Cannot assess yourself
- One assessment per candidate per voter
- Median-based aggregation (outlier resistant)

## Deploy

### Standalone (quick)

```bash
# Local
npx hardhat run scripts/deploy-standalone.js

# Sepolia
SEPOLIA_RPC_URL=<url> PRIVATE_KEY=<key> npx hardhat run scripts/deploy-standalone.js --network sepolia
```

### Diamond (full)

```bash
# Local
npx hardhat run scripts/deploy-diamond.js

# Sepolia
SEPOLIA_RPC_URL=<url> PRIVATE_KEY=<key> npx hardhat run scripts/deploy-diamond.js --network sepolia
```

## Gas Estimates

| Action | Gas | Approx Cost |
|--------|-----|-------------|
| Nominate | ~50,000 | $0.10 |
| Assess | ~80,000 | $0.15 |
| Update status | ~30,000 | $0.05 |
| Full participation | ~450,000 | $0.85 |

## License

MIT
