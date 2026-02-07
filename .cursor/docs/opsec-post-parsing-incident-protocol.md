# OPSEC: Post–parsing incident protocol

**Scope:** Incidents where we ran code that **parsed** a file (e.g. ODS, XLSX, CSV, XML) that may be untrusted or unverified, especially with a library that has known prototype pollution, ReDoS, or similar vulnerabilities.

**Goal:** Formalize what happened, preserve evidence, cease use of the suspect file, and either close the incident or escalate.

---

## Roles

| Role | Responsibility |
|------|----------------|
| **User / primary agent** | Stops using the suspect file; uses only reference data (export or image); continues other work. |
| **opsec-incident-analyst** (subagent) | Runs the procedure, enumerates avenues, analyzes, and produces the incident report and closure. |
| **injection-awareness skill** | Guides agents to recognize parsing-at-risk situations and to follow this protocol. |

---

## Procedure (opsec-incident-analyst)

### Phase 1: Immediate containment

1. **Identify and isolate the suspect artifact.**
   - File path(s): e.g. `C:\Users\ronal\CURSOR_guides\Multi-Sig-Signers_shorts.ods`
   - Parser/library and version: e.g. `xlsx` (SheetJS) 0.18.5 vs patched 0.20.3
   - Exact command/script that read the file: e.g. `export-signers-from-ods.js --output ...`

2. **Declare the file “do not use”.**
   - No re-parsing, re-import, or re-opening until incident is closed.
   - Document: “Suspect file: [path]. Status: do not use. Reference data: [path to signers.json or image-derived list].”

3. **Pin reference data.**
   - Prefer existing export (e.g. `config/signers.json`) or a trusted snapshot (e.g. addresses read from a verified image).
   - If the image is the source of truth: list addresses/labels as read from the image; use that list for comparison and for any downstream work until the ODS is cleared.

### Phase 2: Investigation

4. **Enumerate avenues.**
   - **Parsing path:** Which library, which entry point (e.g. `XLSX.readFile`), which options.
   - **Vulnerability:** CVE IDs (e.g. CVE-2023-30533, CVE-2024-22363), trigger condition (crafted file content).
   - **Process behavior:** Script only read file → built in-memory structures → wrote CSV/JSON → exited. No `exec`/`spawn`, no loading extra config after parse.
   - **Possible impact:** Prototype pollution in process only (no persistence); ReDoS (hang); RCE only if a gadget existed in that path and ran; persistence only if RCE wrote files or changed system config.

5. **Check for persistence (post-incident checklist).**
   - **Unexpected files:** In project dir and in any directory the script wrote to (e.g. `config/`). Look for new or recently modified files not explained by the normal export (e.g. only `signers.csv`, `signers.json` expected).
   - **Scheduled tasks / cron / startup:** List new or modified tasks (e.g. `schtasks`, `crontab`, startup folder, `~/.bashrc`/profile) that could have been added by a hypothetical RCE.
   - **Output integrity:** Compare exported data (e.g. `signers.json`) to the reference (e.g. addresses from the trusted image). Flag any extra rows, missing rows, or changed addresses.

6. **Formalize findings.**
   - **Incident summary:** Date, suspect file, parser, script, and one-line outcome (e.g. “Single run; no RCE indicators; reference data matches export”).
   - **Avenues considered:** Parsing path, CVEs, process flow, persistence checks.
   - **Conclusion:** Incident closed (no compromise) / inconclusive (document what was not checked) / escalated (evidence of tampering or RCE).

### Phase 3: Closure and hardening

7. **Document closure.**
   - “Incident closed: [date]. Suspect file remains do-not-use until [condition, e.g. replaced with known-good or verified hash].”
   - Or: “Incident escalated: [list of findings]. Recommended: [actions].”

8. **Harden for next time.**
   - Prefer patched/minimal parser (e.g. SheetJS from CDN 0.20.3+).
   - Prefer reading from trusted reference (export or image) instead of re-parsing the same file.
   - Ensure injection-awareness skill and this protocol are applied to any new “parse untrusted file” workflow.

---

## Reference data from image (Multi-Sig-Signers)

When the source of truth is a **picture** of the signer table (two columns: multi-sig wallet | payment address):

- **Use the addresses as listed in the image** for comparison and for any work that needs the roster.
- **Do not re-parse the ODS** until the incident is closed.
- **Known-good export** (if produced before the incident): `config/signers.json` (15 rows; columns: Member, Multi-Sig Token Holding Wallet Address, Payment Receipt Wallet Address). Image column 1 = Multi-Sig Token Holding Wallet Address, column 2 = Payment Receipt Wallet Address. One image typo: row 15 column 1 may show “Ox” instead of “0x”; correct value is `0xaa2b91105eaf4d5ed8f1849cdd99140fd4ac3e0c`.

---

## Checklist (quick)

- [ ] Suspect file identified and path documented.
- [ ] File declared “do not use”; reference data (export or image) pinned.
- [ ] No unexpected files in project/config.
- [ ] No new scheduled tasks / startup entries.
- [ ] Export content matches reference (e.g. image addresses).
- [ ] Incident summary and conclusion written.
- [ ] Closure or escalation recorded.
