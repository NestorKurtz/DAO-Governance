# Skill: PM2 Scheduled Workers

## Purpose
Configures PM2 to run scraper scripts on schedule alongside the main API. Handles cron, logging, monitoring, and Coolify deployment.

## Ecosystem Config Pattern

Add scraper workers to `ecosystem.config.js`:

```js
module.exports = {
  apps: [
    // === Existing ===
    {
      name: 'accounting-api',
      script: './backend/server.js',
      // ... existing config
    },

    // === Scraper Workers ===
    {
      name: 'scraper-treasury-snapshot',
      script: './backend/scripts/scraper-treasury.js',
      cron_restart: '0 2 * * *',        // Daily at 2:00 AM UTC
      autorestart: false,                // Don't restart after cron run completes
      watch: false,
      env: { NODE_ENV: 'production' },
      error_file: './logs/scraper-treasury-error.log',
      out_file: './logs/scraper-treasury.log',
      max_memory_restart: '512M',
      // Kill if stuck longer than 10 minutes
      kill_timeout: 600000,
    },
    {
      name: 'scraper-transactions',
      script: './backend/scripts/scraper-transactions.js',
      cron_restart: '*/30 * * * *',      // Every 30 minutes
      autorestart: false,
      watch: false,
      env: { NODE_ENV: 'production' },
      error_file: './logs/scraper-txs-error.log',
      out_file: './logs/scraper-txs.log',
      max_memory_restart: '512M',
      kill_timeout: 600000,
    },
    {
      name: 'scraper-prices',
      script: './backend/scripts/scraper-prices.js',
      cron_restart: '15 * * * *',        // Every hour at :15
      autorestart: false,
      watch: false,
      env: { NODE_ENV: 'production' },
      error_file: './logs/scraper-prices-error.log',
      out_file: './logs/scraper-prices.log',
      max_memory_restart: '256M',
    },
  ],
};
```

## Key PM2 Cron Concepts

### `autorestart: false` for Cron Jobs
- Script runs, completes, exits
- PM2 does NOT restart it (unlike a daemon)
- `cron_restart` triggers the next run

### `autorestart: true` for Daemons
- Use for long-running processes (API server, WebSocket listeners)
- PM2 restarts on crash

### Cron Expressions
```
┌───────────── minute (0-59)
│ ┌───────────── hour (0-23)
│ │ ┌───────────── day of month (1-31)
│ │ │ ┌───────────── month (1-12)
│ │ │ │ ┌───────────── day of week (0-7, 0=Sun)
│ │ │ │ │
* * * * *
```

| Schedule | Expression | Use Case |
|----------|-----------|----------|
| Every 30 min | `*/30 * * * *` | Transaction scraper |
| Hourly at :15 | `15 * * * *` | Price resolver |
| Daily 2 AM | `0 2 * * *` | Treasury snapshots |
| Weekly Monday 3 AM | `0 3 * * 1` | Backfill / reconciliation |

## Script Pattern for Cron Jobs

Scripts should run and exit (not loop):

```js
// scripts/scraper-treasury.js
require('dotenv').config();
const logger = require('../config/logger');

async function main() {
  logger.info('Treasury snapshot scraper started');

  try {
    // 1. Scrape data
    // 2. Process and store
    // 3. Update scraper_state
    logger.info('Treasury snapshot complete');
  } catch (err) {
    logger.error(`Scraper failed: ${err.message}`, { stack: err.stack });
    process.exitCode = 1;
  } finally {
    // Always close DB connection
    closeDb();
  }
}

main();
```

## PM2 Commands

```bash
# Start all apps from ecosystem
pm2 start ecosystem.config.js

# Start only scrapers
pm2 start ecosystem.config.js --only scraper-treasury-snapshot
pm2 start ecosystem.config.js --only scraper-transactions

# Manual trigger (don't wait for cron)
pm2 restart scraper-treasury-snapshot

# View logs
pm2 logs scraper-treasury-snapshot --lines 50
pm2 logs scraper-transactions --lines 50

# Monitor all processes
pm2 monit

# Status overview
pm2 status

# Save process list (survives reboot)
pm2 save
pm2 startup    # generates system startup script
```

## Log Rotation

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

## Coolify / Docker Integration

### Option A: PM2 inside Docker
```dockerfile
FROM node:20-slim
WORKDIR /app
COPY . .
RUN npm ci --production
RUN npm install -g pm2
CMD ["pm2-runtime", "ecosystem.config.js"]
```

`pm2-runtime` keeps container alive and manages child processes.

### Option B: Separate containers (Coolify-native)
- API container: `node backend/server.js`
- Scraper container: `pm2-runtime ecosystem.config.js --only scraper-treasury-snapshot,scraper-transactions,scraper-prices`
- Coolify captures container stdout/stderr as logs

### Option C: Coolify scheduled tasks
- Some Coolify plans support cron-like scheduled container runs
- Each scraper = separate service with cron trigger
- Pro: isolated, no PM2 needed. Con: cold start overhead per run.

## Health Check Pattern

Expose scraper status via API endpoint:

```js
// routes/scrapers.js
router.get('/api/scraper-status', auth, (req, res) => {
  const states = db.prepare(`
    SELECT source, chain, last_block, records_total, updated_at
    FROM scraper_state
    ORDER BY updated_at DESC
  `).all();

  const stale = states.filter(s => {
    const age = Date.now() - new Date(s.updated_at).getTime();
    return age > 2 * 60 * 60 * 1000; // older than 2 hours
  });

  res.json({
    states,
    healthy: stale.length === 0,
    stale: stale.map(s => `${s.source}/${s.chain}`),
  });
});
```

## Rules
- Use `autorestart: false` for cron jobs – they should run and exit
- Use `pm2-runtime` in Docker, not `pm2 start`
- Always `pm2 save` after changing process list
- Set `kill_timeout` for scrapers that might hang on API calls
- Log rotation is mandatory – scraper logs grow fast
- Monitor `scraper_state.updated_at` to detect stale scrapers
- Stagger cron times (don't run everything at :00) to avoid API rate conflicts
