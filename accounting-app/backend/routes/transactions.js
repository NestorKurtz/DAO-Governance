const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get all transactions for user
router.get('/', authenticateToken, (req, res) => {
  const { startDate, endDate, categoryId, type } = req.query;
  let query = `
    SELECT t.*, c.name as category_name, c.color as category_color, c.icon as category_icon
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    WHERE t.user_id = ?
  `;
  const params = [req.user.id];

  if (startDate) {
    query += ' AND t.date >= ?';
    params.push(startDate);
  }
  if (endDate) {
    query += ' AND t.date <= ?';
    params.push(endDate);
  }
  if (categoryId) {
    query += ' AND t.category_id = ?';
    params.push(categoryId);
  }
  if (type) {
    query += ' AND t.type = ?';
    params.push(type);
  }

  query += ' ORDER BY t.date DESC, t.created_at DESC';

  db.all(query, params, (err, transactions) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(transactions);
  });
});

// Get transaction by ID
router.get('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.get(`
    SELECT t.*, c.name as category_name, c.color as category_color, c.icon as category_icon
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    WHERE t.id = ? AND t.user_id = ?
  `, [id, req.user.id], (err, transaction) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json(transaction);
  });
});

// Create transaction
router.post('/', authenticateToken, [
  body('category_id').isInt().withMessage('Valid category ID is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('description').optional().trim(),
  body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
  body('date').isISO8601().withMessage('Valid date is required')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { category_id, amount, description, type, date } = req.body;

  // Verify category belongs to user and matches type
  db.get('SELECT * FROM categories WHERE id = ? AND user_id = ? AND type = ?',
    [category_id, req.user.id, type], (err, category) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!category) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    db.run('INSERT INTO transactions (user_id, category_id, amount, description, type, date) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, category_id, amount, description || null, type, date], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create transaction' });
      }

      db.get(`
        SELECT t.*, c.name as category_name, c.color as category_color, c.icon as category_icon
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        WHERE t.id = ?
      `, [this.lastID], (err, transaction) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        res.status(201).json(transaction);
      });
    });
  });
});

// Update transaction
router.put('/:id', authenticateToken, [
  body('category_id').optional().isInt(),
  body('amount').optional().isFloat({ min: 0.01 }),
  body('description').optional().trim(),
  body('date').optional().isISO8601()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { category_id, amount, description, date } = req.body;

  // First verify transaction belongs to user
  db.get('SELECT * FROM transactions WHERE id = ? AND user_id = ?', [id, req.user.id], (err, transaction) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // If category_id is being updated, verify it belongs to user and matches type
    if (category_id && category_id !== transaction.category_id) {
      db.get('SELECT * FROM categories WHERE id = ? AND user_id = ? AND type = ?',
        [category_id, req.user.id, transaction.type], (err, category) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        if (!category) {
          return res.status(400).json({ error: 'Invalid category' });
        }
        updateTransaction();
      });
    } else {
      updateTransaction();
    }

    function updateTransaction() {
      const updates = [];
      const values = [];

      if (category_id) {
        updates.push('category_id = ?');
        values.push(category_id);
      }
      if (amount !== undefined) {
        updates.push('amount = ?');
        values.push(amount);
      }
      if (description !== undefined) {
        updates.push('description = ?');
        values.push(description);
      }
      if (date) {
        updates.push('date = ?');
        values.push(date);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      values.push(id, req.user.id);

      db.run(`UPDATE transactions SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
        values, function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to update transaction' });
        }

        db.get(`
          SELECT t.*, c.name as category_name, c.color as category_color, c.icon as category_icon
          FROM transactions t
          JOIN categories c ON t.category_id = c.id
          WHERE t.id = ?
        `, [id], (err, transaction) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }
          res.json(transaction);
        });
      });
    }
  });
});

// Delete transaction
router.delete('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM transactions WHERE id = ? AND user_id = ?', [id, req.user.id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete transaction' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json({ message: 'Transaction deleted successfully' });
  });
});

module.exports = router;
