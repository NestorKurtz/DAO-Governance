# Aavegotchi Foundation - Node.js Backend
# For Coolify/Hostinger deployment

FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --omit=dev

# Copy application
COPY . .

# Validate server.js syntax at build time (fail fast if corrupted/truncated)
RUN node -c server.js

# Create data directory for persistent storage (mount volume here)
RUN mkdir -p /app/data

# Use /app/data for database when DATABASE_PATH not set (Coolify volume mount)
ENV DATABASE_PATH=/app/data/assessments.db
ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "server.js"]
