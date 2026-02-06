# Accounting App

A full-stack accounting application for managing income, expenses, and financial reports.

## Features

- 🔐 User authentication (JWT-based)
- 💰 Income and expense tracking
- 📊 Category management with custom icons and colors
- 📈 Financial reports and analytics
- 📱 Responsive modern UI
- 🔍 Transaction filtering and search

## Tech Stack

- **Backend**: Node.js, Express, SQLite
- **Frontend**: React, Vite, Recharts
- **Authentication**: JWT (JSON Web Tokens)
- **Database**: SQLite (easily migratable to PostgreSQL/MySQL)

## Project Structure

```
accounting-app/
├── backend/          # Express API server
│   ├── config/       # Database configuration
│   ├── middleware/   # Auth middleware
│   ├── routes/       # API routes
│   └── scripts/      # Database initialization
├── frontend/         # React application
│   └── src/
│       ├── components/   # React components
│       ├── context/      # React context (Auth)
│       └── services/     # API service
└── README.md
```

## Local Development Setup

### Prerequisites

- Node.js 16+ and npm
- Git

### Backend Setup

1. Navigate to backend directory:
```bash
cd accounting-app/backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Edit `.env` and set:
```
PORT=5000
JWT_SECRET=your-secret-key-change-this-in-production
NODE_ENV=development
```

5. Initialize database:
```bash
npm run init-db
```

6. Start development server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd accounting-app/frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## Production Deployment

### VPS Deployment Steps

#### 1. Server Setup

SSH into your VPS and install Node.js:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx (optional, for reverse proxy)
sudo apt install -y nginx
```

#### 2. Clone and Setup Project

```bash
# Clone your repository
git clone <your-repo-url> accounting-app
cd accounting-app

# Setup backend
cd backend
npm install --production
cp .env.example .env
# Edit .env with production values
npm run init-db

# Setup frontend
cd ../frontend
npm install
npm run build
```

#### 3. Configure Environment

Edit `backend/.env`:
```
PORT=5000
JWT_SECRET=<generate-a-strong-secret-key>
NODE_ENV=production
```

Generate a strong JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### 4. Start Backend with PM2

```bash
cd backend
pm2 start server.js --name accounting-api
pm2 save
pm2 startup  # Follow instructions to enable auto-start on boot
```

#### 5. Serve Frontend

**Option A: Using Nginx (Recommended)**

1. Build frontend:
```bash
cd frontend
npm run build
```

2. Create Nginx configuration:
```bash
sudo nano /etc/nginx/sites-available/accounting-app
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain or IP

    # Serve frontend
    root /path/to/accounting-app/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to backend
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

3. Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/accounting-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

**Option B: Using PM2 with serve**

```bash
sudo npm install -g serve
cd frontend
pm2 serve dist 3000 --name accounting-frontend --spa
pm2 save
```

#### 6. Setup SSL (Optional but Recommended)

Using Let's Encrypt with Certbot:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

#### 7. Firewall Configuration

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## Database Migration (PostgreSQL/MySQL)

To migrate from SQLite to PostgreSQL or MySQL:

1. Install the appropriate database driver:
```bash
# For PostgreSQL
npm install pg

# For MySQL
npm install mysql2
```

2. Update `backend/config/database.js` to use the new database
3. Update SQL queries if needed (SQLite syntax is mostly compatible)

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Transactions
- `GET /api/transactions` - Get all transactions (supports query params: startDate, endDate, categoryId, type)
- `GET /api/transactions/:id` - Get transaction by ID
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Reports
- `GET /api/reports/summary` - Get summary statistics
- `GET /api/reports/trends` - Get monthly trends

## Troubleshooting

### Backend won't start
- Check if port 5000 is available: `lsof -i :5000`
- Verify `.env` file exists and has correct values
- Check database file permissions: `ls -la backend/data/`

### Frontend can't connect to backend
- Verify backend is running: `pm2 list`
- Check CORS settings in `backend/server.js`
- Verify API URL in `frontend/src/services/api.js`

### Database errors
- Ensure database is initialized: `npm run init-db`
- Check file permissions on `backend/data/accounting.db`
- Verify SQLite3 is installed: `npm list sqlite3`

## Security Notes

- Change `JWT_SECRET` in production
- Use HTTPS in production
- Regularly backup the database file (`backend/data/accounting.db`)
- Keep dependencies updated: `npm audit`
- Use environment variables for sensitive data

## Backup

To backup your database:
```bash
cp backend/data/accounting.db backend/data/accounting.db.backup
```

## License

MIT
