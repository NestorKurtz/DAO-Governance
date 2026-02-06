#!/bin/bash

# Accounting App Deployment Script
# Run this script on your VPS server

set -e

echo "🚀 Starting Accounting App Deployment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo -e "${GREEN}✓${NC} Node.js found: $(node --version)"

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    sudo npm install -g pm2
fi

echo -e "${GREEN}✓${NC} PM2 found"

# Navigate to project directory
cd "$(dirname "$0")"

# Backend setup
echo -e "\n${YELLOW}Setting up backend...${NC}"
cd backend

if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Please edit backend/.env and set JWT_SECRET and other values${NC}"
fi

echo "📦 Installing backend dependencies..."
npm install --production

echo "🗄️  Initializing database..."
npm run init-db

echo -e "${GREEN}✓${NC} Backend setup complete"

# Frontend setup
echo -e "\n${YELLOW}Setting up frontend...${NC}"
cd ../frontend

echo "📦 Installing frontend dependencies..."
npm install

echo "🏗️  Building frontend..."
npm run build

echo -e "${GREEN}✓${NC} Frontend build complete"

# Start services with PM2
echo -e "\n${YELLOW}Starting services with PM2...${NC}"

cd ../backend
pm2 start server.js --name accounting-api || pm2 restart accounting-api

cd ../frontend
if command -v serve &> /dev/null; then
    pm2 start serve --name accounting-frontend -- -s dist -l 3000 || pm2 restart accounting-frontend
else
    echo "📦 Installing serve..."
    sudo npm install -g serve
    pm2 start serve --name accounting-frontend -- -s dist -l 3000
fi

# Save PM2 configuration
pm2 save

echo -e "\n${GREEN}✓${NC} Deployment complete!"
echo -e "\n${YELLOW}Next steps:${NC}"
echo "1. Edit backend/.env and set JWT_SECRET"
echo "2. Configure Nginx (see README.md)"
echo "3. Setup SSL certificate (optional)"
echo -e "\n${GREEN}Services running:${NC}"
pm2 list

echo -e "\n${YELLOW}Useful commands:${NC}"
echo "  pm2 logs accounting-api        # View API logs"
echo "  pm2 logs accounting-frontend   # View frontend logs"
echo "  pm2 restart all                # Restart all services"
echo "  pm2 stop all                   # Stop all services"
