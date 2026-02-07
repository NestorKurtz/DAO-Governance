# Security Protocol – DAO-Governance

## Grundsatz: Proaktive Validierung vor Interaktion mit exponierten Objekten

Bevor externe Dateien, APIs oder Datenquellen verarbeitet werden, ist eine Sicherheitsbewertung durchzufuehren:

1. **Abhaengigkeiten pruefen** – Welche Library verarbeitet die Daten? Bekannte CVEs?
2. **Version verifizieren** – Ist die eingesetzte Version gepatcht?
3. **Quelle bewerten** – Stammt das Objekt aus vertrauenswuerdiger Quelle?
4. **Output inspizieren** – Enthaelt die Ausgabe unerwartete Properties oder Strukturen?
5. **Blast Radius einschaetzen** – Was passiert downstream wenn die Eingabe kompromittiert ist?

---

## Sicherheitspruefungen (Audit Log)

### 2026-02-07 – CVE-2023-30533: Prototype Pollution in SheetJS

| Feld | Detail |
|------|--------|
| **CVE** | CVE-2023-30533 |
| **Advisory** | GHSA-4r6h-8v6p-xvw6 |
| **Severity** | High (CVSS 7.8) |
| **Betroffene Versionen** | SheetJS CE <= 0.19.2 |
| **Fix-Version** | >= 0.19.3 |
| **Unsere Version** | **0.20.3** (gepatcht) |
| **Quelle** | cdn.sheetjs.com (nicht npm – npm-Paket ist unmaintained) |

**Kontext:** Das Script `CURSOR_guides/scripts/export-signers-from-ods.js` parst die Datei `Multi-Sig-Signers_shorts.ods` mit SheetJS. Beim Parsen von ODS/XLSX-Dateien koennte eine manipulierte Datei via Prototype Pollution beliebige Properties auf `Object.prototype` injizieren.

**Was ist Prototype Pollution?**
Ein Angreifer schleust Properties wie `__proto__.isAdmin = true` in geparste Objekte ein. Da alle JavaScript-Objekte von `Object.prototype` erben, wirkt sich das auf die gesamte Laufzeitumgebung aus – potentiell Auth-Bypass, RCE, oder DoS.

**Pruefergebnis:**

| Pruefpunkt | Ergebnis |
|------------|----------|
| xlsx-Version >= 0.19.3 | v0.20.3 |
| Quelle: cdn.sheetjs.com (nicht npm) | Bestaetigt |
| Output (`signers.json`) frei von `__proto__`, `constructor`, `prototype` | Geprueft, sauber |
| ODS-Datei aus vertrauenswuerdiger Quelle | DAO-eigene Signer-Liste |
| xlsx in Produktions-Dependencies (DAO-Governance, aavegotchi-foundation) | Nicht vorhanden |
| Defensive Codierung (explizites Field-Mapping, kein Object-Spread) | Bestaetigt |
| Zusaetzlich gepatcht: CVE-2024-22363 (ReDoS) | Bestaetigt (>= 0.20.2) |

**Bewertung: KEIN RISIKO** – Version gepatcht, Output sauber, Code defensiv, isoliert von Produktion.

**Exemplarischer Wert:** Diese Pruefung demonstriert das Protokoll fuer proaktives Hinterfragen vor Interaktion mit potentiell exponierten Objekten. Auch wenn das Ergebnis "sicher" ist, muss die Pruefung VOR der Verarbeitung stattfinden, nicht danach.

---

## Richtlinien fuer zukuenftige Pruefungen

### Vor dem Parsen externer Dateien (ODS, XLSX, CSV, JSON, PDF)
- [ ] Library-Version gegen bekannte CVEs pruefen (NVD, GitHub Advisories)
- [ ] `npm audit` oder manuellen Check ausfuehren
- [ ] Dateiherkunft dokumentieren
- [ ] Output auf unerwartete Keys inspizieren

### Vor der Integration externer APIs (Polygonscan, Subgraphs, CoinGecko, Discord)
- [ ] API-Response-Struktur validieren (kein blindes Object-Spread)
- [ ] Rate-Limits respektieren (kein Abuse-Risiko)
- [ ] Fehlerhafte Responses abfangen (Etherscan gibt HTTP 200 bei Fehlern)
- [ ] Keine Secrets in Logs oder Error-Messages

### Vor dem Deployment (Coolify, Docker, VPS)
- [ ] `npm audit` im CI/CD
- [ ] Keine `.env`-Dateien im Image
- [ ] Container als non-root User
- [ ] Secrets ueber Coolify Environment, nicht im Repo

---

## Kontakt

Sicherheitsprobleme melden: Repository-Owner kontaktieren (private Disclosure).
