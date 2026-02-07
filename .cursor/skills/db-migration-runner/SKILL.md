# Skill: DB Migration Runner

## Purpose
Manages database schema changes through versioned migration files. Supports SQLite (current) with a path to PostgreSQL.

## Migration File Convention

```
backend/database/migrations/
  001_initial_schema.sql
  002_add_treasury_snapshots.sql
  003_add_scraper_state.sql
  004_add_budgets.sql
```

Each file contains `-- UP` and `-- DOWN` sections:

```sql
-- UP
CREATE TABLE treasury_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date DATE NOT NULL UNIQUE,
  ghst_balance REAL DEFAULT 0,
  usdc_balance REAL DEFAULT 0,
  dai_balance REAL DEFAULT 0,
  matic_balance REAL DEFAULT 0,
  total_usd REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- DOWN
DROP TABLE IF EXISTS treasury_snapshots;
```

## Migration State Table

```sql
CREATE TABLE IF NOT EXISTS migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Runner Logic (`scripts/migrate.js`)

```js
// 1. Read all files from migrations/ sorted by name
// 2. Query migrations table for already-applied
// 3. Run unapplied in order, within transactions
// 4. Record each in migrations table

function migrate(direction = 'up') {
  const files = fs.readdirSync(MIGRATIONS_DIR).sort();
  const applied = db.prepare('SELECT name FROM migrations').all().map(r => r.name);

  for (const file of files) {
    if (direction === 'up' && applied.includes(file)) continue;
    if (direction === 'down' && !applied.includes(file)) continue;

    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    const section = direction === 'up'
      ? sql.split('-- DOWN')[0].replace('-- UP', '')
      : sql.split('-- DOWN')[1];

    db.transaction(() => {
      db.exec(section.trim());
      if (direction === 'up') {
        db.prepare('INSERT INTO migrations (name) VALUES (?)').run(file);
      } else {
        db.prepare('DELETE FROM migrations WHERE name = ?').run(file);
      }
    })();

    console.log(`${direction.toUpperCase()}: ${file}`);
  }
}
```

## SQLite-Specific Constraints

- **No ALTER COLUMN** – must recreate table (CREATE new → copy data → DROP old → RENAME)
- **No DROP COLUMN** before SQLite 3.35 – use table recreation pattern
- **No concurrent writers** – WAL mode helps but migrations should run exclusively
- **Foreign keys off by default** – always `PRAGMA foreign_keys = ON` after connection

## PostgreSQL Migration Path

When migrating from SQLite to PostgreSQL:
- Replace `AUTOINCREMENT` → `SERIAL` or `GENERATED ALWAYS AS IDENTITY`
- Replace `datetime('now')` → `NOW()`
- Replace `INTEGER` booleans → `BOOLEAN`
- Replace `JSON` text fields → `JSONB`
- Add proper `CREATE INDEX CONCURRENTLY` for large tables

## npm Scripts

```json
{
  "migrate": "node scripts/migrate.js up",
  "migrate:down": "node scripts/migrate.js down",
  "migrate:status": "node scripts/migrate.js status"
}
```

## Rules
- Never modify an already-applied migration. Create a new one instead.
- Always test DOWN before pushing UP.
- Name migrations descriptively: `005_add_chain_field_to_transactions.sql`
- Keep migrations small and focused – one concern per file.
