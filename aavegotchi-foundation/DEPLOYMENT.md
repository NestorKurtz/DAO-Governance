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

## Domain

Configure `aavegotchidao.cloud` in Coolify as the public domain.
