import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Pill, Activity, MessageSquare, LogOut, Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [showProfileInfo, setShowProfileInfo] = useState(false);
  const { user, token, logout } = useAuth();
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
        <button onClick={toggleTheme} className="theme-toggle-btn nav-item glass-panel" style={{ border: 'none', background: 'var(--glass-bg)', width: '100%', cursor: 'pointer', padding: '12px 16px', color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
        </button>

        {user && (
          <div className="user-profile-container" style={{ position: 'relative' }}>
            {showProfileInfo && (
              <div className="profile-popover glass-panel animate-fade-in" style={{ 
                position: 'absolute', 
                bottom: '80px', 
                left: '0', 
                width: '100%', 
                padding: '16px',
                zIndex: 100,
                borderBottomLeftRadius: '4px'
              }}>
                <div className="popover-header" style={{ marginBottom: '12px', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
                  <h4 style={{ margin: 0 }}>Patient Account</h4>
                </div>
                <div className="popover-body" style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div className="info-item"><strong>Email:</strong> {user.email}</div>
                  <div className="info-item"><strong>Member Since:</strong> May 2026</div>
                  <div className="info-item"><strong>Last Checkup:</strong> 2 days ago</div>
                  <button className="btn btn-outline btn-sm w-full mt-2" onClick={() => setShowProfileInfo(false)}>Close</button>
                </div>
              </div>
            )}
            
            <div 
              className="user-profile glass-panel" 
              style={{ padding: '12px', cursor: 'pointer', border: showProfileInfo ? '1px solid var(--color-primary)' : 'var(--glass-border)' }}
              onClick={() => setShowProfileInfo(!showProfileInfo)}
            >
              <img src={user.avatar || 'https://i.pravatar.cc/150'} alt="User Avatar" className="avatar" />
              <div className="user-info">
                <span className="user-name">{user.name}</span>
                <span className="user-status">{user.condition}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
