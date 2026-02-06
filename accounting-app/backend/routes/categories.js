const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get all categories for user
router.get('/', authenticateToken, (req, res) => {
  db.all('SELECT * FROM categories WHERE user_id = ? ORDER BY name', [req.user.id], (err, categories) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(categories);
  });
});

// Create category
router.post('/', authenticateToken, [
  body('name').trim().notEmpty().withMessage('Category name is required'),
  body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
  body('color').optional().isString(),
  body('icon').optional().isString()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, type, color = '#3B82F6', icon = '💰' } = req.body;

  db.run('INSERT INTO categories (user_id, name, type, color, icon) VALUES (?, ?, ?, ?, ?)',
    [req.user.id, name, type, color, icon], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint')) {
        return res.status(400).json({ error: 'Category already exists' });
      }
      return res.status(500).json({ error: 'Failed to create category' });
    }

    db.get('SELECT * FROM categories WHERE id = ?', [this.lastID], (err, category) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.status(201).json(category);
    });
  });
});

// Update category
router.put('/:id', authenticateToken, [
  body('name').optional().trim().notEmpty(),
  body('color').optional().isString(),
  body('icon').optional().isString()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { name, color, icon } = req.body;

  const updates = [];
  const values = [];

  if (name) {
    updates.push('name = ?');
    values.push(name);
  }
  if (color) {
    updates.push('color = ?');
    values.push(color);
  }
  if (icon) {
    updates.push('icon = ?');
    values.push(icon);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  values.push(id, req.user.id);

  db.run(`UPDATE categories SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
    values, function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to update category' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    db.get('SELECT * FROM categories WHERE id = ?', [id], (err, category) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(category);
    });
  });
});

// Delete category
router.delete('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM categories WHERE id = ? AND user_id = ?', [id, req.user.id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete category' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json({ message: 'Category deleted successfully' });
  });
});

module.exports = router;
