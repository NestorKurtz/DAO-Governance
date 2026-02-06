import { useState, useEffect } from 'react'
import Navbar from './Navbar'
import api from '../services/api'
import CategoryModal from './CategoryModal'
import './Categories.css'

function Categories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories')
      setCategories(response.data)
    } catch (err) {
      console.error('Error fetching categories:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category? All associated transactions will be deleted.')) return

    try {
      await api.delete(`/categories/${id}`)
      fetchCategories()
    } catch (err) {
      alert('Failed to delete category')
    }
  }

  const handleEdit = (category) => {
    setEditingCategory(category)
    setShowModal(true)
  }

  const handleModalClose = () => {
    setShowModal(false)
    setEditingCategory(null)
    fetchCategories()
  }

  const incomeCategories = categories.filter(cat => cat.type === 'income')
  const expenseCategories = categories.filter(cat => cat.type === 'expense')

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="loading">Loading...</div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Categories</h1>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + Add Category
          </button>
        </div>

        <div className="categories-grid">
          <div className="card">
            <h2>💰 Income Categories</h2>
            {incomeCategories.length === 0 ? (
              <p className="empty-state">No income categories. Create one!</p>
            ) : (
              <div className="categories-list">
                {incomeCategories.map(category => (
                  <div key={category.id} className="category-card income">
                    <div className="category-header">
                      <div className="category-icon-large" style={{ color: category.color }}>
                        {category.icon}
                      </div>
                      <div className="category-info">
                        <h3>{category.name}</h3>
                        <span className="category-type">Income</span>
                      </div>
                    </div>
                    <div className="category-actions">
                      <button
                        className="btn-edit"
                        onClick={() => handleEdit(category)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(category.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <h2>💸 Expense Categories</h2>
            {expenseCategories.length === 0 ? (
              <p className="empty-state">No expense categories. Create one!</p>
            ) : (
              <div className="categories-list">
                {expenseCategories.map(category => (
                  <div key={category.id} className="category-card expense">
                    <div className="category-header">
                      <div className="category-icon-large" style={{ color: category.color }}>
                        {category.icon}
                      </div>
                      <div className="category-info">
                        <h3>{category.name}</h3>
                        <span className="category-type">Expense</span>
                      </div>
                    </div>
                    <div className="category-actions">
                      <button
                        className="btn-edit"
                        onClick={() => handleEdit(category)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(category.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <CategoryModal
          category={editingCategory}
          onClose={handleModalClose}
        />
      )}
    </>
  )
}

export default Categories
