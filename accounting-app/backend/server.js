require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/reports', require('./routes/reports'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Accounting API is running' });
});

// Treasury balance (org-wide: total income - total expenses)
// Used by expense submissions page. Public for cross-app integration.
app.get('/api/treasury', (req, res) => {
  db.get(`
    SELECT
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as totalIncome,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as totalExpense
    FROM transactions
  `, (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    const totalIncome = parseFloat(row?.totalIncome || 0);
    const totalExpense = parseFloat(row?.totalExpense || 0);
    res.json({
      balance: totalIncome - totalExpense,
      totalIncome,
      totalExpense,
      currency: 'USD'
    });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed');
    }
    process.exit(0);
  });
});
