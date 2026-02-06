const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get summary statistics
router.get('/summary', authenticateToken, (req, res) => {
  const { startDate, endDate } = req.query;
  let dateFilter = '';
  const params = [req.user.id];

  if (startDate && endDate) {
    dateFilter = ' AND date >= ? AND date <= ?';
    params.push(startDate, endDate);
  }

  const queries = {
    totalIncome: `SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND type = 'income'${dateFilter}`,
    totalExpense: `SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE user_id = ? AND type = 'expense'${dateFilter}`,
    incomeByCategory: `
      SELECT c.name, c.color, c.icon, SUM(t.amount) as total
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ? AND t.type = 'income'${dateFilter}
      GROUP BY c.id
      ORDER BY total DESC
    `,
    expenseByCategory: `
      SELECT c.name, c.color, c.icon, SUM(t.amount) as total
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ? AND t.type = 'expense'${dateFilter}
      GROUP BY c.id
      ORDER BY total DESC
    `
  };

  const results = {};

  // Get total income
  db.get(queries.totalIncome, params, (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    results.totalIncome = parseFloat(row.total);

    // Get total expense
    db.get(queries.totalExpense, params, (err, row) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      results.totalExpense = parseFloat(row.total);
      results.balance = results.totalIncome - results.totalExpense;

      // Get income by category
      db.all(queries.incomeByCategory, params, (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        results.incomeByCategory = rows.map(r => ({
          ...r,
          total: parseFloat(r.total)
        }));

        // Get expense by category
        db.all(queries.expenseByCategory, params, (err, rows) => {
          if (err) return res.status(500).json({ error: 'Database error' });
          results.expenseByCategory = rows.map(r => ({
            ...r,
            total: parseFloat(r.total)
          }));

          res.json(results);
        });
      });
    });
  });
});

// Get monthly trends
router.get('/trends', authenticateToken, (req, res) => {
  const { months = 12 } = req.query;
  const userId = req.user.id;

  const query = `
    SELECT 
      strftime('%Y-%m', date) as month,
      type,
      SUM(amount) as total
    FROM transactions
    WHERE user_id = ?
      AND date >= date('now', '-' || ? || ' months')
    GROUP BY month, type
    ORDER BY month ASC
  `;

  db.all(query, [userId, months], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    const trends = {};
    rows.forEach(row => {
      if (!trends[row.month]) {
        trends[row.month] = { income: 0, expense: 0 };
      }
      trends[row.month][row.type] = parseFloat(row.total);
    });

    res.json(trends);
  });
});

module.exports = router;
