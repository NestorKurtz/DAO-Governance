import { useState, useEffect } from 'react'
import Navbar from './Navbar'
import api from '../services/api'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import './Reports.css'

const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe', '#43e97b', '#fa709a', '#fee140', '#30cfd0', '#330867']

function Reports() {
  const [summary, setSummary] = useState(null)
  const [trends, setTrends] = useState({})
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  })

  useEffect(() => {
    fetchData()
  }, [dateRange])

  const fetchData = async () => {
    try {
      const params = new URLSearchParams()
      if (dateRange.startDate) params.append('startDate', dateRange.startDate)
      if (dateRange.endDate) params.append('endDate', dateRange.endDate)

      const [summaryRes, trendsRes] = await Promise.all([
        api.get(`/reports/summary?${params.toString()}`),
        api.get('/reports/trends?months=12')
      ])
      setSummary(summaryRes.data)
      setTrends(trendsRes.data)
    } catch (err) {
      console.error('Error fetching reports:', err)
    } finally {
      setLoading(false)
    }
  }

  const trendsData = Object.entries(trends).map(([month, data]) => ({
    month,
    income: data.income || 0,
    expense: data.expense || 0,
    balance: (data.income || 0) - (data.expense || 0)
  }))

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
        <h1 className="page-title">Reports</h1>

        <div className="card filters-card">
          <h3>Date Range</h3>
          <div className="filters-grid">
            <div className="form-group">
              <label>Start Date</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>End Date</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              />
            </div>
          </div>
        </div>

        {summary && (
          <>
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

            <div className="reports-grid">
              <div className="card chart-card">
                <h2>Monthly Trends</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="income" stroke="#28a745" strokeWidth={2} />
                    <Line type="monotone" dataKey="expense" stroke="#dc3545" strokeWidth={2} />
                    <Line type="monotone" dataKey="balance" stroke="#17a2b8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="card chart-card">
                <h2>Income by Category</h2>
                {summary.incomeByCategory.length === 0 ? (
                  <p className="empty-state">No income data</p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={summary.incomeByCategory}
                        dataKey="total"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label
                      >
                        {summary.incomeByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="card chart-card">
                <h2>Expenses by Category</h2>
                {summary.expenseByCategory.length === 0 ? (
                  <p className="empty-state">No expense data</p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={summary.expenseByCategory}
                        dataKey="total"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label
                      >
                        {summary.expenseByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="card chart-card">
                <h2>Category Comparison</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[...summary.incomeByCategory.slice(0, 5), ...summary.expenseByCategory.slice(0, 5)]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="total" fill="#667eea" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}

export default Reports
