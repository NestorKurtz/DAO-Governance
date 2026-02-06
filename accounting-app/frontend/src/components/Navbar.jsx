import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Navbar.css'

function Navbar() {
  const { user, logout } = useAuth()
  const location = useLocation()

  if (!user) return null

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          💰 Accounting App
        </Link>
        <div className="navbar-links">
          <Link 
            to="/" 
            className={location.pathname === '/' ? 'active' : ''}
          >
            Dashboard
          </Link>
          <Link 
            to="/transactions" 
            className={location.pathname === '/transactions' ? 'active' : ''}
          >
            Transactions
          </Link>
          <Link 
            to="/categories" 
            className={location.pathname === '/categories' ? 'active' : ''}
          >
            Categories
          </Link>
          <Link 
            to="/reports" 
            className={location.pathname === '/reports' ? 'active' : ''}
          >
            Reports
          </Link>
          <div className="navbar-user">
            <span>{user.username}</span>
            <button onClick={logout} className="btn-logout">Logout</button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
