import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { user, isLoggedIn, isAdmin, isDeveloper, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setDropdownOpen(false);
  };

  const getAvatarFallback = (username) =>
    username ? username.charAt(0).toUpperCase() : '?';

  return (
    <nav className="navbar">
      <div className="navbar-inner container">
        {/* Logo */}
        <Link to="/" className="navbar-logo" onClick={() => setMenuOpen(false)}>
          <span className="logo-icon">🎮</span>
          <span className="logo-text display-font">IndieHub</span>
        </Link>

        {/* Nav Links (desktop) */}
        <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          <NavLink to="/games" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={() => setMenuOpen(false)}>
            Discover
          </NavLink>
          <NavLink to="/games?sort=-avgRating" className="nav-link" onClick={() => setMenuOpen(false)}>
            Top Rated
          </NavLink>
          <NavLink to="/games?upcoming=true" className="nav-link" onClick={() => setMenuOpen(false)}>
            Upcoming
          </NavLink>
          {isDeveloper && (
            <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={() => setMenuOpen(false)}>
              Dev Studio
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/admin" className={({ isActive }) => isActive ? 'nav-link admin-link active' : 'nav-link admin-link'} onClick={() => setMenuOpen(false)}>
              ⚡ Admin
            </NavLink>
          )}
        </div>

        {/* Right side */}
        <div className="navbar-right">
          {isLoggedIn ? (
            <div className="user-menu" onMouseLeave={() => setDropdownOpen(false)}>
              <button
                className="user-avatar-btn"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-label="User menu"
              >
                {user.avatar ? (
                  <img src={user.avatar} alt={user.username} className="user-avatar-img" />
                ) : (
                  <span className="user-avatar-fallback">{getAvatarFallback(user.username)}</span>
                )}
                <span className="user-username">{user.username}</span>
                <span className="dropdown-arrow">▾</span>
              </button>

              {dropdownOpen && (
                <div className="user-dropdown animate-scale-in">
                  <div className="dropdown-header">
                    <p className="dropdown-username">{user.username}</p>
                    <span className={`badge badge-${user.role === 'admin' ? 'gold' : user.role === 'developer' ? 'cyan' : 'primary'}`}>
                      {user.role}
                    </span>
                  </div>
                  <div className="dropdown-divider" />
                  {isDeveloper && (
                    <Link to="/dashboard" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                      🎮 My Games
                    </Link>
                  )}
                  {isAdmin && (
                    <Link to="/admin" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                      ⚡ Admin Panel
                    </Link>
                  )}
                  <div className="dropdown-divider" />
                  <button className="dropdown-item danger" onClick={handleLogout}>
                    🚪 Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-ghost btn-sm">Sign In</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Join Free</Link>
            </div>
          )}

          {/* Hamburger */}
          <button
            className={`hamburger ${menuOpen ? 'open' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>
    </nav>
  );
}
