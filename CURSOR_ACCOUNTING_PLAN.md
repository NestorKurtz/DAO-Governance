# Aavegotchi DAO Accounting App - Cursor Entwicklungsplan

> **→ Aligned Roadmap:** See [`accounting-app/ACCOUNTING_ROADMAP.md`](accounting-app/ACCOUNTING_ROADMAP.md) for the unified plan that builds on the existing app and incorporates this plan.

## Projektziel
Vollständige Buchhaltung für Aavegotchi DAO für die Jahre 2024 und 2025.
- Alle Einnahmen und Ausgaben erfassen
- Kategorisierung nach DAO-Standards
- Export für Steuern/Audits
- Integration mit dem Foundation Assessment System
- dies erfordert kontinuierliches und terminisiertes Skraping

**Datenbasis:** Budget- und Treasury-Daten für 2024/2025 erfordern **laufendes bzw. geplantes Scraping** (Subgraphs, Polygonscan), nicht nur manuellen Import. Siehe `accounting-app/ACCOUNTING_ROADMAP.md` Phase 4.5 und Skill `.cursor/skills/blockchain-data-scraper/`.

---

## Projektstruktur

```
accounting-app/
├── backend/
│   ├── server.js              # Express API Server
│   ├── database/
│   │   ├── schema.sql         # PostgreSQL Schema
│   │   ├── migrations/        # DB Migrationen
│   │   └── seed-2024.sql      # Historische Daten 2024
│   ├── routes/
│   │   ├── transactions.js    # CRUD für Transaktionen
│   │   ├── categories.js      # Kategorien-Management
│   │   ├── reports.js         # Berichte generieren
│   │   ├── import.js          # CSV/Blockchain Import
│   │   └── export.js          # PDF/CSV Export
│   ├── services/
│   │   ├── polygonscan.js     # Blockchain Daten holen
│   │   ├── treasury.js        # Treasury Berechnungen
│   │   └── reconciliation.js  # Abgleich Blockchain ↔ Bücher
│   └── middleware/
│       ├── auth.js            # JWT Authentication
│       └── validation.js      # Input Validierung
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx      # Übersicht
│   │   │   ├── Transactions.jsx   # Transaktionsliste
│   │   │   ├── Import.jsx         # Daten importieren
│   │   │   ├── Reports.jsx        # Berichte
│   │   │   └── Settings.jsx       # Einstellungen
│   │   ├── components/
│   │   │   ├── TransactionTable.jsx
│   │   │   ├── CategorySelect.jsx
│   │   │   ├── DateRangePicker.jsx
│   │   │   ├── Charts.jsx
│   │   │   └── ExportButton.jsx
│   │   └── services/
│   │       └── api.js
│   └── vite.config.js
└── package.json
```

---

## Phase 1: Datenbank Setup (Tag 1)

### Task 1.1: PostgreSQL Schema erstellen
**Datei:** `backend/database/schema.sql`

```sql
-- Kategorien für DAO Buchhaltung
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) CHECK (type IN ('income', 'expense')),
    parent_id INTEGER REFERENCES categories(id),
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Standard DAO Kategorien einfügen
INSERT INTO categories (name, type, description) VALUES
-- Einnahmen
('Protocol Revenue', 'income', 'Einnahmen aus dem Protokoll'),
('NFT Sales', 'income', 'Gotchi/Wearable Verkäufe'),
('Baazaar Fees', 'income', 'Marktplatz Gebühren'),
('Rental Revenue', 'income', 'Gotchi Lending Einnahmen'),
('Grants Received', 'income', 'Erhaltene Förderungen'),
('Token Sales', 'income', 'GHST Verkäufe'),
('Interest/Yield', 'income', 'DeFi Erträge'),
('Other Income', 'income', 'Sonstige Einnahmen'),

-- Ausgaben
('Development', 'expense', 'Entwicklungskosten'),
('Salaries', 'expense', 'Gehälter und Vergütungen'),
('Marketing', 'expense', 'Marketing und Werbung'),
('Infrastructure', 'expense', 'Server, Tools, Services'),
('Legal', 'expense', 'Rechtliche Kosten'),
('Audits', 'expense', 'Smart Contract Audits'),
('Grants Given', 'expense', 'Vergebene Förderungen'),
('Multi-Sig Compensation', 'expense', 'Multi-Sig Signer Vergütung'),
('Gas Fees', 'expense', 'Transaktionsgebühren'),
('Other Expense', 'expense', 'Sonstige Ausgaben');

-- Transaktionen
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(18, 8) NOT NULL,
    currency VARCHAR(20) DEFAULT 'USDC',
    amount_usd DECIMAL(18, 2),
    category_id INTEGER REFERENCES categories(id),
    type VARCHAR(20) CHECK (type IN ('income', 'expense')),

    -- Blockchain Referenz
    tx_hash VARCHAR(66),
    from_address VARCHAR(42),
    to_address VARCHAR(42),
    chain VARCHAR(20) DEFAULT 'polygon',

    -- Metadata
    notes TEXT,
    attachments JSONB,
    tags VARCHAR(50)[],

    -- Audit Trail
    created_by VARCHAR(42),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Reconciliation
    reconciled BOOLEAN DEFAULT FALSE,
    reconciled_at TIMESTAMP,
    reconciled_by VARCHAR(42)
);

-- Indices für Performance
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_category ON transactions(category_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_tx_hash ON transactions(tx_hash);

-- Treasury Snapshots (täglicher Stand)
CREATE TABLE treasury_snapshots (
    id SERIAL PRIMARY KEY,
    date DATE UNIQUE NOT NULL,

    -- Balances nach Token
    ghst_balance DECIMAL(18, 8),
    usdc_balance DECIMAL(18, 8),
    dai_balance DECIMAL(18, 8),
    matic_balance DECIMAL(18, 8),
    other_tokens JSONB,

    -- USD Werte
    total_usd DECIMAL(18, 2),

    -- Berechnete Werte
    income_mtd DECIMAL(18, 2),
    expense_mtd DECIMAL(18, 2),
    income_ytd DECIMAL(18, 2),
    expense_ytd DECIMAL(18, 2),

    created_at TIMESTAMP DEFAULT NOW()
);

-- Budgets pro Kategorie
CREATE TABLE budgets (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES categories(id),
    year INTEGER NOT NULL,
    quarter INTEGER CHECK (quarter BETWEEN 1 AND 4),
    amount DECIMAL(18, 2) NOT NULL,
    currency VARCHAR(20) DEFAULT 'USD',
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(category_id, year, quarter)
);

-- Expense Requests (Integration mit Foundation App)
CREATE TABLE expense_requests (
    id SERIAL PRIMARY KEY,
    amount DECIMAL(18, 2) NOT NULL,
    currency VARCHAR(20) DEFAULT 'USDC',
    description TEXT NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    payee_name VARCHAR(200),
    payee_wallet VARCHAR(42) NOT NULL,
    submitted_by VARCHAR(42) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),

    -- Approval Flow
    approved_by VARCHAR(42),
    approved_at TIMESTAMP,
    rejection_reason TEXT,

    -- Payment
    paid_tx_hash VARCHAR(66),
    paid_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT NOW()
);
```

### Task 1.2: Datenbank Connection
**Datei:** `backend/database/db.js`

```javascript
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'aavegotchi_accounting',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool
};
```

---

## Phase 2: Backend API (Tag 2-3)

### Task 2.1: Transactions API
**Datei:** `backend/routes/transactions.js`

Endpoints zu implementieren:
```
GET    /api/transactions           # Liste mit Pagination, Filter
GET    /api/transactions/:id       # Einzelne Transaktion
POST   /api/transactions           # Neue Transaktion
PUT    /api/transactions/:id       # Transaktion bearbeiten
DELETE /api/transactions/:id       # Transaktion löschen
POST   /api/transactions/bulk      # Mehrere auf einmal

Filter-Parameter:
- startDate, endDate
- category
- type (income/expense)
- minAmount, maxAmount
- search (Beschreibung)
- reconciled (true/false)
```

### Task 2.2: Reports API
**Datei:** `backend/routes/reports.js`

```
GET /api/reports/summary
    Query: year, quarter, month
    Response: {
        income: { total, byCategory: [...] },
        expense: { total, byCategory: [...] },
        netIncome: number,
        treasuryBalance: number
    }

GET /api/reports/monthly/:year
    Response: Array mit 12 Monaten, je income/expense/net

GET /api/reports/category/:categoryId
    Query: startDate, endDate
    Response: Alle Transaktionen dieser Kategorie

GET /api/reports/comparison
    Query: period1Start, period1End, period2Start, period2End
    Response: Vergleich zweier Zeiträume
```

### Task 2.3: Import Service
**Datei:** `backend/services/polygonscan.js`

```javascript
// Funktionen:
// 1. getTransactionsByAddress(address, startBlock, endBlock)
// 2. getTokenTransfers(address, token, startDate, endDate)
// 3. parseTransactionToAccounting(tx) - Konvertiert Blockchain TX zu Buchhaltungseintrag
// 4. categorizeTransaction(tx) - Automatische Kategorisierung basierend auf:
//    - Bekannte Adressen (Baazaar, Lending, etc.)
//    - Token Typ (GHST, USDC, etc.)
//    - Methoden-Signatur
```

### Task 2.4: Export Service
**Datei:** `backend/routes/export.js`

```
GET /api/export/csv
    Query: startDate, endDate, categories[]
    Response: CSV Download

GET /api/export/pdf
    Query: year, quarter
    Response: PDF Bericht

GET /api/export/tax-report/:year
    Response: Steuer-relevanter Bericht
```

---

## Phase 3: Frontend Dashboard (Tag 4-5)

### Task 3.1: Dashboard Seite
**Datei:** `frontend/src/pages/Dashboard.jsx`

Komponenten:
1. **Summary Cards**
   - Total Income (YTD)
   - Total Expenses (YTD)
   - Net Income
   - Treasury Balance

2. **Charts**
   - Monatlicher Income vs Expense (Bar Chart)
   - Ausgaben nach Kategorie (Pie Chart)
   - Treasury Balance über Zeit (Line Chart)

3. **Recent Transactions**
   - Letzte 10 Transaktionen
   - Quick Actions (Edit, Categorize)

4. **Alerts**
   - Budget Überschreitungen
   - Unreconciled Transaktionen
   - Pending Expense Requests

### Task 3.2: Transaction Management
**Datei:** `frontend/src/pages/Transactions.jsx`

Features:
1. Tabelle mit Sortierung und Filter
2. Inline Editing für Kategorie
3. Bulk Actions (Kategorisieren, Löschen)
4. CSV Import Dialog
5. Quick Add Form

### Task 3.3: Import Seite
**Datei:** `frontend/src/pages/Import.jsx`

Features:
1. CSV Upload mit Preview
2. Column Mapping
3. Blockchain Import
   - Adresse eingeben
   - Zeitraum wählen
   - Transaktionen abrufen
   - Review & Kategorisieren
   - Import bestätigen

---

## Phase 4: 2024 Daten Import (Tag 6)

### Task 4.1: Bekannte DAO Adressen sammeln
```javascript
const DAO_ADDRESSES = {
    treasury: '0x...', // Haupt-Treasury
    multisig: '0x...', // Multi-Sig Wallet
    baazaar: '0x...', // Marktplatz Contract
    lending: '0x...', // Gotchi Lending
    staking: '0x...', // GHST Staking
    // ... weitere
};
```

### Task 4.2: 2024 Transaktionen importieren
1. Alle Transaktionen von Treasury-Adresse abrufen
2. Automatische Kategorisierung
3. Manuelle Review für unklare Fälle
4. Reconciliation mit bekannten Ausgaben

### Task 4.3: Monatliche Abschlüsse 2024
- Januar bis Dezember 2024
- Treasury Snapshots erstellen
- Berichte generieren

---

## Phase 5: 2025 Laufende Buchhaltung (Tag 7+)

### Task 5.1: Automatische Synchronisation
- Webhook für neue Transaktionen
- Täglicher Treasury Snapshot
- Wöchentlicher Bericht

### Task 5.2: Integration mit Foundation App
- Expense Requests synchronisieren
- Multi-Sig Compensation tracken
- Budget Tracking

---

## Technische Details

### Dependencies Backend
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.3",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "axios": "^1.6.0",
    "csv-parse": "^5.5.0",
    "pdfkit": "^0.14.0",
    "node-cron": "^3.0.2",
    "jsonwebtoken": "^9.0.2"
  }
}
```

### Dependencies Frontend
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "recharts": "^2.10.0",
    "@tanstack/react-table": "^8.10.0",
    "axios": "^1.6.0",
    "date-fns": "^2.30.0",
    "react-datepicker": "^4.24.0"
  }
}
```

### Environment Variables
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=aavegotchi_accounting
DB_USER=postgres
DB_PASSWORD=your_password

# APIs
POLYGONSCAN_API_KEY=your_key
COINGECKO_API_KEY=your_key

# JWT
JWT_SECRET=your_secret

# Foundation App
FOUNDATION_API_URL=http://localhost:3000
```

---

## Checkliste für Cursor

### Tag 1
- [ ] PostgreSQL installieren/konfigurieren
- [ ] Schema erstellen
- [ ] Basis-Daten einfügen (Kategorien)
- [ ] DB Connection testen

### Tag 2
- [ ] Express Server Setup
- [ ] Transactions CRUD
- [ ] Categories API
- [ ] Basic Error Handling

### Tag 3
- [ ] Reports API
- [ ] Polygonscan Integration
- [ ] CSV Import
- [ ] PDF Export

### Tag 4
- [ ] React App Setup (Vite)
- [ ] Dashboard Layout
- [ ] Summary Cards
- [ ] Basic Charts

### Tag 5
- [ ] Transaction Table
- [ ] Filter und Suche
- [ ] Import Dialog
- [ ] Export Buttons

### Tag 6
- [ ] 2024 Daten Import
- [ ] Kategorisierung Review
- [ ] Monatliche Snapshots
- [ ] Berichte generieren

### Tag 7+
- [ ] Automatische Sync
- [ ] Foundation Integration
- [ ] Alerts System
- [ ] Final Testing

---

## Wichtige Hinweise

1. **Alle Beträge in USDC als Basis** - Andere Token zu USD konvertieren zum Transaktionszeitpunkt

2. **Audit Trail** - Jede Änderung protokollieren (wer, wann, was)

3. **Reconciliation** - Blockchain als "Source of Truth", manuelle Einträge müssen abgeglichen werden

4. **Backup** - Tägliche DB Backups

5. **Security** - Admin-Only Zugriff, JWT Auth, Rate Limiting

---

*Plan erstellt für Cursor am 2024-02-05*
*Nach Deployment der Foundation App zu bearbeiten*
