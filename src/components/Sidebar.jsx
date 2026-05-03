import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Pill, Activity, MessageSquare, LogOut, Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return (
    <aside className="sidebar glass-panel">
      <div className="sidebar-header">
        <div className="logo-container">
          <Activity className="logo-icon" size={32} color="var(--color-primary)" />
          <h2>CareBridge</h2>
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/dashboard" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/medications" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
          <Pill size={20} />
          <span>Medications</span>
        </NavLink>
        <NavLink to="/symptoms" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
          <Activity size={20} />
          <span>Symptoms</span>
        </NavLink>
        <NavLink to="/chatbot" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
          <MessageSquare size={20} />
          <span>AI Assistant</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <button onClick={toggleTheme} className="theme-toggle-btn nav-item" style={{ border: 'none', background: 'transparent', width: '100%', cursor: 'pointer', padding: '12px 16px', color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
        </button>

        {user && (
          <div className="user-profile">
            <img src={user.avatar || 'https://i.pravatar.cc/150'} alt="User Avatar" className="avatar" />
            <div className="user-info">
              <span className="user-name">{user.name}</span>
              <span className="user-status">{user.condition}</span>
            </div>
          </div>
        )}
        <button onClick={() => { logout(); navigate('/login'); }} className="logout-btn" style={{ border: 'none', background: 'transparent', cursor: 'pointer', width: '100%' }}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
