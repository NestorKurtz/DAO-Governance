# Quick Start – Test the Accounting App Locally

Run these steps **in your terminal** (PowerShell, Command Prompt, or VS Code terminal).  
Each step says **where** to run it (which folder) and **what** to run.

---

## 1. Backend (API server)

**Where:** Open a terminal and go into the backend folder.

```bash
cd accounting-app/backend
```

If you're already in `DAO-Governance`:
```bash
cd accounting-app\backend
```

**Then run:**

```bash
# Install dependencies (first time only)
npm install

# Create .env (first time only). If you don't have .env.example, create .env with:
# PORT=5000
# JWT_SECRET=any-random-string-for-testing
# NODE_ENV=development

# Create the database and tables (first time only)
npm run init-db

# Start the API
npm start
```

Leave this terminal open. The API runs at **http://localhost:5000**.

---

## 2. Frontend (web app)

**Where:** Open a **second** terminal and go into the frontend folder.

```bash
cd accounting-app/frontend
```

**Then run:**

```bash
# Install dependencies (first time only)
npm install

# Start the dev server
npm run dev
```

Leave this terminal open. The app runs at **http://localhost:3000** (Vite will show the exact URL).

---

## 3. Test in the browser

1. Open **http://localhost:3000** in your browser.
2. Click **Sign up** and create an account (username, email, password).
3. After login you can:
   - **Dashboard** – see summary (empty at first).
   - **Categories** – add income/expense categories (e.g. “Salary”, “Food”).
   - **Transactions** – add income and expenses, pick category and date.
   - **Reports** – see charts and breakdowns.

---

## Where to put each command (summary)

| What you do              | Where to run the command        |
|---------------------------|---------------------------------|
| Backend install & start   | Terminal 1 → `accounting-app/backend` |
| Frontend install & start  | Terminal 2 → `accounting-app/frontend` |
| Open the app              | Browser → http://localhost:3000      |

---

## If you don't have a `.env` file

In `accounting-app/backend` create a file named `.env` with:

```
PORT=5000
JWT_SECRET=my-secret-key-for-testing
NODE_ENV=development
```

Then run `npm run init-db` and `npm start` again.

---

## Troubleshooting

- **“Cannot find module”**  
  Run `npm install` in the folder where the error appears (backend or frontend).

- **Port already in use**  
  Change `PORT=5000` in backend `.env` to another port (e.g. `5001`). Frontend proxy in `vite.config.js` points to port 5000 by default; if you change the backend port, update the proxy target in `frontend/vite.config.js` to match.

- **API not responding**  
  Make sure the first terminal is still running `npm start` in `accounting-app/backend` and that you see “Server running on port 5000”.

- **Blank page or wrong path**  
  Use the URL Vite prints in the second terminal (usually http://localhost:3000).
