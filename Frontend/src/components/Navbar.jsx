import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo">
          <span className="logo-symbol">🌱</span>
          <span className="logo-text">Nexora</span>
        </Link>

        <button
          className={`hamburger ${isOpen ? 'active' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </button>

        <div className={`nav-menu ${isOpen ? 'active' : ''}`}>
          <nav className="nav">
            <Link to="/" className={`nav-link ${isActive('/')}`} onClick={() => setIsOpen(false)}>
              Dashboard
            </Link>

            {user?.role === 'student' && (
              <>
                <Link to="/tasks" className={`nav-link ${isActive('/tasks')}`} onClick={() => setIsOpen(false)}>
                  Tasks
                </Link>
                <Link to="/quizzes" className={`nav-link ${isActive('/quizzes')}`} onClick={() => setIsOpen(false)}>
                  Quizzes
                </Link>
                <Link to="/learning" className={`nav-link ${isActive('/learning')}`} onClick={() => setIsOpen(false)}>
                  Learning
                </Link>
                <Link to="/games" className={`nav-link ${isActive('/games')}`} onClick={() => setIsOpen(false)}>
                  Games
                </Link>
                <Link to="/leaderboard" className={`nav-link ${isActive('/leaderboard')}`} onClick={() => setIsOpen(false)}>
                  Leaderboard
                </Link>
              </>
            )}

            {user?.role === 'teacher' && (
              <>
                <Link to="/tasks" className={`nav-link ${isActive('/tasks')}`} onClick={() => setIsOpen(false)}>
                  Tasks
                </Link>
                <Link to="/quizzes" className={`nav-link ${isActive('/quizzes')}`} onClick={() => setIsOpen(false)}>
                  Quizzes
                </Link>
                <Link to="/learning" className={`nav-link ${isActive('/learning')}`} onClick={() => setIsOpen(false)}>
                  Learning
                </Link>
                <Link to="/users" className={`nav-link ${isActive('/users')}`} onClick={() => setIsOpen(false)}>
                  Users
                </Link>
                <Link to="/performance" className={`nav-link ${isActive('/performance')}`} onClick={() => setIsOpen(false)}>
                  Performance
                </Link>
                <Link to="/leaderboard" className={`nav-link ${isActive('/leaderboard')}`} onClick={() => setIsOpen(false)}>
                  Leaderboard
                </Link>
              </>
            )}

            {user?.role === 'admin' && (
              <>
                <Link to="/users" className={`nav-link ${isActive('/users')}`} onClick={() => setIsOpen(false)}>
                  Users
                </Link>
                <Link to="/tasks" className={`nav-link ${isActive('/tasks')}`} onClick={() => setIsOpen(false)}>
                  Tasks
                </Link>
                <Link to="/quizzes" className={`nav-link ${isActive('/quizzes')}`} onClick={() => setIsOpen(false)}>
                  Quizzes
                </Link>
                <Link to="/learning" className={`nav-link ${isActive('/learning')}`} onClick={() => setIsOpen(false)}>
                  Learning
                </Link>
                <Link to="/performance" className={`nav-link ${isActive('/performance')}`} onClick={() => setIsOpen(false)}>
                  Performance
                </Link>
                <Link to="/leaderboard" className={`nav-link ${isActive('/leaderboard')}`} onClick={() => setIsOpen(false)}>
                  Leaderboard
                </Link>
              </>
            )}
          </nav>

          <div className="user-info">
            {user?.role === 'student' && (
              <span className="points-text">
                {user.points || 0} pts
              </span>
            )}
            <span className="user-name">{user?.name}</span>
            <button onClick={handleLogout} className="logout-link">
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

