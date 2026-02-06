import { useState, useEffect } from 'react'
import Navbar from './Navbar'
import api from '../services/api'
import { format } from 'date-fns'
import './Dashboard.css'

function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [recentTransactions, setRecentTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [summaryRes, transactionsRes] = await Promise.all([
        api.get('/reports/summary'),
        api.get('/transactions?limit=10')
      ])
      setSummary(summaryRes.data)
      setRecentTransactions(transactionsRes.data.slice(0, 5))
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

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
        <h1 className="page-title">Dashboard</h1>
        
        {summary && (
          <div className="summary-cards">
            <div className="summary-card income">
              <div className="card-icon">💰</div>
              <div className="card-content">
                <h3>Total Income</h3>
                <p className="amount">${summary.totalIncome.toFixed(2)}</p>
              </div>
            </div>
            
            <div className="summary-card expense">
              <div className="card-icon">💸</div>
              <div className="card-content">
                <h3>Total Expenses</h3>
                <p className="amount">${summary.totalExpense.toFixed(2)}</p>
              </div>
            </div>
            
            <div className={`summary-card balance ${summary.balance >= 0 ? 'positive' : 'negative'}`}>
              <div className="card-icon">{summary.balance >= 0 ? '✅' : '⚠️'}</div>
              <div className="card-content">
                <h3>Balance</h3>
                <p className="amount">${summary.balance.toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}

        <div className="dashboard-grid">
          <div className="card">
            <h2>Recent Transactions</h2>
            {recentTransactions.length === 0 ? (
              <p className="empty-state">No transactions yet. Add your first transaction!</p>
            ) : (
              <div className="transactions-list">
                {recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="transaction-item">
                    <div className="transaction-icon" style={{ backgroundColor: transaction.category_color }}>
                      {transaction.category_icon}
                    </div>
                    <div className="transaction-details">
                      <div className="transaction-name">{transaction.category_name}</div>
                      <div className="transaction-meta">
                        {transaction.description || 'No description'} • {format(new Date(transaction.date), 'MMM dd, yyyy')}
                      </div>
                    </div>
                    <div className={`transaction-amount ${transaction.type}`}>
                      {transaction.type === 'income' ? '+' : '-'}${parseFloat(transaction.amount).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {summary && (
            <div className="card">
              <h2>Top Categories</h2>
              <div className="categories-breakdown">
                <div className="category-section">
                  <h3>Income</h3>
                  {summary.incomeByCategory.length === 0 ? (
                    <p className="empty-state">No income categories</p>
                  ) : (
                    summary.incomeByCategory.slice(0, 5).map((cat) => (
                      <div key={cat.name} className="category-item">
                        <div className="category-info">
                          <span className="category-icon" style={{ color: cat.color }}>
                            {cat.icon}
                          </span>
                          <span>{cat.name}</span>
                        </div>
                        <span className="category-amount">${cat.total.toFixed(2)}</span>
                      </div>
                    ))
                  )}
                </div>
                
                <div className="category-section">
                  <h3>Expenses</h3>
                  {summary.expenseByCategory.length === 0 ? (
                    <p className="empty-state">No expense categories</p>
                  ) : (
                    summary.expenseByCategory.slice(0, 5).map((cat) => (
                      <div key={cat.name} className="category-item">
                        <div className="category-info">
                          <span className="category-icon" style={{ color: cat.color }}>
                            {cat.icon}
                          </span>
                          <span>{cat.name}</span>
                        </div>
                        <span className="category-amount">${cat.total.toFixed(2)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default Dashboard
