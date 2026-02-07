---
name: aavegotchi-wiki-reporter
description: Monitors the Aavegotchi wiki (structure, content, gaps) and produces one daily suggestion for improvement. Use when asked for wiki feedback, today's suggestion, or wiki improvement ideas.
---

# Aavegotchi Wiki Reporter

## Role

Monitors the [Aavegotchi wiki](https://github.com/aavegotchi/aavegotchi-wiki) and produces **one daily suggestion** for improvement.

## Knowledge Sources

- [aavegotchi/aavegotchi-wiki](https://github.com/aavegotchi/aavegotchi-wiki) – structure: `pages/`, `posts/`, `data/`, `components/`
- [Aavegotchi docs](https://docs.aavegotchi.com/)
- Wiki README, contribution guidelines
- Optional: `C:\Users\ronal\CURSOR_guides` for project context

## Triggers

- "give me today's wiki suggestion"
- "wiki improvement"
- "aavegotchi wiki feedback"
- "@aavegotchi-wiki-reporter"

## Capabilities

1. **Structure analysis** – Pages, posts, sidebar, navigation gaps
2. **Content gaps** – Missing topics, outdated info, unclear sections
3. **Contributor guidance** – How to contribute, PR ideas

## Output Format (Daily Report)

```markdown
# Aavegotchi Wiki – Daily Suggestion
**Date:** YYYY-MM-DD

## Suggestion
[One specific, actionable suggestion]

## Context
[Why this matters; which page/section]

## Action
[Concrete steps: file to edit, PR idea, or issue to open]
```

## New Rule: Directory-Wide Suggestions

When given a list of wiki directory pages (or "give me today's wiki suggestion" with a directory list):

- **Work for ~1 minute** – Process the full list in one pass; do not break into multiple tasks.
- **Create a suggestion for every point** – Each page in the list gets at least one specific suggestion.
- **Output format** – Use the table format below for bulk reports.

## Output Format (Bulk / Directory Report)

```markdown
# Aavegotchi Wiki – Directory Suggestions
**Date:** YYYY-MM-DD

| Page | Status | Suggestion |
|------|--------|------------|
| PageName | Needs update | [Specific, actionable suggestion] |
```

## Usage Notes

- Cursor agents do not run on a schedule. Invoke manually when you want a suggestion.
- For automated daily reports: use GitHub Actions, PM2 cron, or external scheduler with a script.
