# OPSEC Safety Measures

**Priority order:** Apply these from top to bottom. The first is non-negotiable after any parsing/untrusted-input incident.

---

## 1. Post–parsing / untrusted-input incident (highest priority)

**When:** After any run that parsed potentially untrusted or unverified file content (e.g. ODS/XLSX/CSV from an external or unverified source) with a library known to have prototype pollution, ReDoS, or similar vulnerabilities.

**Immediate actions:**

1. **Cease interaction with the said file.** Do not re-open, re-parse, or re-import it until the incident is formally closed by the opsec-incident-analyst.
2. **Preserve reference data without re-parsing.** Use an already-exported artifact (e.g. `config/signers.json`), or data extracted from a trusted snapshot (e.g. image/screenshot), as the single source of truth until the file is cleared.
3. **Run the post-incident checklist** (see [opsec-post-parsing-incident-protocol.md](opsec-post-parsing-incident-protocol.md)):
   - Check for unexpected new or modified files in the project and in user-writable directories used by the script.
   - Check for new scheduled tasks, cron jobs, or startup entries that could have been added by a potential RCE.
   - Compare script output (e.g. exported CSV/JSON) to a known-good reference (e.g. addresses from a trusted image or previous export) to detect tampering.
4. **Invoke the opsec-incident-analyst** to analyze and formalize what happened and to document the incident and closure.

**Reference:** Full procedure in [opsec-post-parsing-incident-protocol.md](opsec-post-parsing-incident-protocol.md). Skill: [injection-awareness](../skills/injection-awareness/SKILL.md). Agent: [opsec-incident-analyst](../agents/opsec-incident-analyst.md).

---

## 2. Server and infrastructure security

See `SERVER_SECURITY_OVERVIEW.md` (firewall, SSH, Fail2ban, SSL, app-level security, Coolify/Traefik).

---

## 3. Application and code security

- No API keys or secrets in code; use environment variables.
- Input validation on all user/API inputs.
- Parameterized queries; no string concatenation for SQL.
- Secure session/JWT and auth for admin endpoints.

---

## 4. Commit and repo hygiene

- No committed secrets or credentials.
- Config and address lists that are sensitive stay out of public DAO repos (e.g. delayers config, signer rosters in private locations).
