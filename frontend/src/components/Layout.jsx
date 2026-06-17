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
          <h2>TechWorkFlow</h2>
          <small>Work Allocation System</small>
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
          <div className="user-name">{user?.name}</div>
          <div className="user-role">{user?.role}</div>
          <button onClick={logout} className="btn btn-sm" style={{ marginTop: '0.6rem', width: '100%', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.08)' }}>
            Logout
          </button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
