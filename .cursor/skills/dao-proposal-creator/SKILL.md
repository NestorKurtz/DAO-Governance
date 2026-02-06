---
name: dao-proposal-creator
description: Creates AavegotchiDAO proposals (AGIPs) in Snapshot format. Use when the user says "create proposal for [topic]", "new agip about [topic]", or needs a DAO governance proposal.
---

# DAO Proposal Creator

Creates AavegotchiDAO proposals following the AGIP (Aavegotchi Improvement Proposal) Snapshot format.

## Trigger

- "create proposal for [topic]"
- "new agip about [topic]"
- "draft agip"

## Template

Create proposals using this structure:

```markdown
# AGIP-[NUMBER]: [Title]

## Summary
[1-2 sentences describing the proposal]

## Abstract
[Detailed description, 100-200 words]

## Motivation
Why is this proposal necessary?
- [Reason 1]
- [Reason 2]
- [Reason 3]

## Specification

### Implementation
[How will this be implemented?]

### Timeline
- Phase 1: [Date] - [Description]
- Phase 2: [Date] - [Description]
- Phase 3: [Date] - [Description]

### Budget
| Item | Amount | Notes |
|------|--------|-------|
| Development | X GHST | [Detail] |
| Marketing | X GHST | [Detail] |
| Operations | X GHST | [Detail] |
| **Total** | **X GHST** | **~$X USD** |

## Risks
### Technical Risks
- [Risk 1]: [Mitigation]

### Financial Risks
- [Risk 1]: [Mitigation]

### Community Risks
- [Risk 1]: [Mitigation]

## Success Metrics
- [Metric 1]: [Target]
- [Metric 2]: [Target]
- [Metric 3]: [Target]

## Team
- [Role]: [Name/ENS] - [Responsibility]

## Voting Options
1. Yes - Approve this proposal
2. No - Reject this proposal
3. Abstain

## Links
- Discussion: [Forum Link]
- Contract: [Etherscan Link]
- Documentation: [Docs Link]
```

## Validation Checklist

- Title: Clear and specific
- Budget: Detailed breakdown with GHST amounts
- Timeline: Realistic milestones with dates
- Risks: Honest assessment with mitigations
- All sections completed
