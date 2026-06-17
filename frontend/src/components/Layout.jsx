import { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">TW</div>
          <div className="sidebar-brand-text">
            <h2>Technician</h2>
            <small>Work Allocation System</small>
          </div>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
            <span className="nav-icon">&#9632;</span>
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/tasks" className={({ isActive }) => isActive ? 'active' : ''}>
            <span className="nav-icon">&#9776;</span>
            <span>Tasks</span>
          </NavLink>
          {user?.role === 'admin' && (
            <NavLink to="/tasks/create" className={({ isActive }) => isActive ? 'active' : ''}>
              <span className="nav-icon">+</span>
              <span>Create Task</span>
            </NavLink>
          )}
          {user?.role === 'admin' && (
            <NavLink to="/users" className={({ isActive }) => isActive ? 'active' : ''}>
              <span className="nav-icon">&#9783;</span>
              <span>Users</span>
            </NavLink>
          )}
        </nav>
        <div className="sidebar-footer">
          <button className="theme-toggle" onClick={toggleTheme}>
            {theme === 'light' ? '\u263E' : '\u2600'} <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
          </button>
          <div className="sidebar-user">
            <div className="sidebar-avatar">{user?.name?.[0]?.toUpperCase() || 'U'}</div>
            <div className="sidebar-user-info">
              <div className="user-name">{user?.name}</div>
              <div className="user-role">{user?.role === 'admin' ? 'System Admin' : user?.role}</div>
            </div>
          </div>
          <button onClick={logout} className="btn btn-sm sidebar-logout-btn">
            <span className="logout-icon">&#10149;</span> Sign Out
          </button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
