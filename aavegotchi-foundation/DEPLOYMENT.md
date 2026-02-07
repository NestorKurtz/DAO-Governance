# Aavegotchi Foundation – Coolify Deployment

## Coolify settings (Hostinger VPS)

| Setting | Value |
|---------|-------|
| **Build Pack** | Dockerfile |
| **Base Directory** | `aavegotchi-foundation` |
| **Branch** | `main` |
| **Port** | 3000 |

## Why use Dockerfile

- Nixpacks can fail with "failed to detect application type" for this repo layout.
- Using the Dockerfile guarantees a working Node.js build and `server.js` validation.

## Environment variables

Configure in Coolify:

- `PORT` – 3000 (default)
- `NODE_ENV` – production

## Volume for database

The app stores `assessments.db` in the working directory. For persistence, mount a volume at `/app` (may require adjusting DB path in code).

## Domain / Landing page

### Root domain (aavegotchidao.cloud)

1. In Coolify → **Resources** → **AavegotchiDAO > production**:
2. **Delete** the red DAO-Governance resource (`nestor-kurtz/-d-a-o--governance:main`, sslip.io-URL) if it is broken or unused.
3. **Edit** the aavegotchi-foundation app → **Domains**:
   - Add `aavegotchidao.cloud`
   - Add `www.aavegotchidao.cloud` (optional)
4. Root (`https://aavegotchidao.cloud`) will show the home page (index.html) with prominent link to Nominations.

### Existing subdomains

- `assess.aavegotchidao.cloud` → /assess.html
- `nominate.aavegotchidao.cloud` → /nominate.html
- etc.
