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
        <h2>TechWorkFlow</h2>
        <nav>
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
            <span>&#9632;</span> <span>Dashboard</span>
          </NavLink>
          <NavLink to="/tasks" className={({ isActive }) => isActive ? 'active' : ''}>
            <span>&#9776;</span> <span>Tasks</span>
          </NavLink>
          {user?.role === 'admin' && (
            <NavLink to="/tasks/create" className={({ isActive }) => isActive ? 'active' : ''}>
              <span>+</span> <span>Create Task</span>
            </NavLink>
          )}
          {user?.role === 'admin' && (
            <NavLink to="/users" className={({ isActive }) => isActive ? 'active' : ''}>
              <span>&#9783;</span> <span>Users</span>
            </NavLink>
          )}
        </nav>
        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === 'light' ? '\u263E Dark Mode' : '\u2600 Light Mode'}
        </button>
        <div className="user-info">
          <div><strong>{user?.name}</strong></div>
          <div className="role">{user?.role}</div>
          <button onClick={logout} className="btn btn-sm btn-outline" style={{ marginTop: '0.5rem', color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}>Logout</button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
