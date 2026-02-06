---
name: quarterly-report-generator
description: Generates AavegotchiDAO quarterly reports. Use when the user says "create Q[1-4] report", "quarterly summary", or needs a DAO financial/governance report.
---

# Quarterly Report Generator

Creates AavegotchiDAO quarterly reports with financial overview, achievements, challenges, and next-quarter planning.

## Trigger

- "create Q[1-4] report"
- "quarterly summary"
- "dao report for Q[N]"

## Template

```markdown
# AavegotchiDAO - Q[N] [YEAR] Report

## Executive Summary
[3-5 sentences: Key achievements, challenges, next steps]

## Financial Overview

### Budget vs. Actual
| Category | Budgeted | Actual | Variance | Notes |
|----------|----------|--------|----------|-------|
| Development | X GHST | Y GHST | +/- Z% | [Note] |
| Marketing | X GHST | Y GHST | +/- Z% | [Note] |
| Operations | X GHST | Y GHST | +/- Z% | [Note] |

### Treasury Status
- Starting Balance: X GHST
- Revenue: X GHST
- Expenses: X GHST
- Ending Balance: X GHST

## Key Achievements
### Development
- ✅ [Achievement 1]
- ✅ [Achievement 2]

### Community
- 👥 [Metric 1]: X → Y (+Z%)
- 👥 [Metric 2]: A → B (+C%)

### Governance
- 🗳️ Proposals Passed: X
- 🗳️ Voter Participation: X%

## Challenges & Lessons
### Challenge 1: [Title]
**Issue:** [Description]
**Impact:** [Impact]
**Resolution:** [How we addressed it]
**Lesson:** [What we learned]

## Next Quarter (Q[N+1])

### Priorities
1. [Priority 1] - [Why important]
2. [Priority 2] - [Why important]
3. [Priority 3] - [Why important]

### Planned Initiatives
- [Initiative 1]: [Description]
- [Initiative 2]: [Description]

### Budget Request
| Category | Amount | Justification |
|----------|--------|---------------|
| [Cat 1] | X GHST | [Why] |

## Appendix
- Detailed Transaction Log: [Link]
- Community Feedback: [Link]
- Governance Votes: [Link]
```

## Usage

Replace placeholders (X, Y, Z, [N], etc.) with actual data. Ensure numbers are consistent across sections.
