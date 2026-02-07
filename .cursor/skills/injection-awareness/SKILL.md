---
name: injection-awareness
description: Recognizes parsing-at-risk situations (reading ODS, XLSX, CSV, XML with libraries that have prototype pollution, ReDoS, or deserialization issues) and guides agents to follow the post-parsing incident protocol. Use when parsing untrusted or unverified files, or after a parsing incident.
---

# Injection awareness (parsing-at-risk)

Use this skill when the workflow involves **parsing** file content (ODS, XLSX, CSV, XML, etc.) that may be **untrusted or unverified**, especially with libraries known for prototype pollution, ReDoS, or deserialization vulnerabilities.

## When to apply

- User or agent is about to parse a spreadsheet or structured file from an external/unverified source.
- A script has already run that parsed such a file (e.g. `export-signers-from-ods.js` reading an ODS).
- User asks "was that safe?" or "opsec" after a parse.
- Adding or changing code that reads ODS/XLSX/CSV/XML (e.g. `xlsx`, `csv-parse`, `fast-csv`).

## Core rules

1. **Before parsing untrusted/unverified files**
   - Prefer a **patched** or minimal parser (e.g. SheetJS from `cdn.sheetjs.com` 0.20.3+, not npm `xlsx`).
   - If the file is only needed once, prefer using an **existing export** or **reference data from a trusted snapshot** (e.g. image) instead of re-parsing.

2. **After a parsing-at-risk run**
   - **Cease interaction** with the parsed file until the incident is closed.
   - Use **reference data only** (e.g. `config/signers.json` or addresses from a trusted image).
   - Invoke the **opsec-incident-analyst** to run the procedure in `.cursor/docs/opsec-post-parsing-incident-protocol.md`.
   - Run the **post-incident checklist** (unexpected files, scheduled tasks, output integrity).

3. **Where to look**
   - Safety measures (top): `.cursor/docs/OPSEC_SAFETY_MEASURES.md`
   - Full protocol: `.cursor/docs/opsec-post-parsing-incident-protocol.md`
   - Agent: `.cursor/agents/opsec-incident-analyst.md`

## Risk pattern

**Parsing-at-risk** = reading file content with a library that has known:
- Prototype pollution (e.g. CVE-2023-30533)
- ReDoS (e.g. CVE-2024-22363)
- Unsafe deserialization

Trigger is **parsing** a **crafted** or **unverified** file. Mitigation: use patched parser, minimize parsing of untrusted input, use reference data when possible, and run the post-incident protocol when in doubt.

## Reference data instead of re-parsing

When the suspect file must not be used:
- **Export:** e.g. `config/signers.json`, `config/signers.csv` (already produced by a previous run).
- **Image:** Addresses/labels can be read from a trusted screenshot and used as the list for comparison or downstream work (e.g. Multi-Sig-Signers: column 1 = multi-sig wallet, column 2 = payment address; typo “Ox” → `0x` for last row).

Do not re-open or re-parse the ODS/XLSX until the opsec-incident-analyst has closed the incident.
