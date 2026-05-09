import { createContext, useState, useEffect, useContext } from 'react';
import { userData as mockUser } from '../mockData';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If we have a token, we could fetch user profile here.
    // For now, if we have a token, we'll try fetching the users and assume logged in.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    // Always try to fetch users to provide a default logged-in experience
    fetch('/api/users', { signal: controller.signal })
      .then(res => res.json())
      .then(users => {
        clearTimeout(timeoutId);
        if (users && users.length > 0) {
          setUser(users[0]);
          if (!token) setToken('mock_token');
        } else {
          setUser(mockUser);
          if (!token) setToken('mock_token');
        }
      })
      .catch(err => {
        clearTimeout(timeoutId);
        console.error('User fetch failed or timed out, using mock data:', err.message);
        setUser(mockUser);
        if (!token) setToken('mock_token');
      })
      .finally(() => setLoading(false));

    return () => clearTimeout(timeoutId);
  }, [token]);

  const login = async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');
    
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('token', data.token);
  };

  const register = async (userData) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Registration failed');
    
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('token', data.token);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  const updateUser = async (newUserData) => {
    // If not a mock user, try to update backend
    if (user && user._id && token && token !== 'mock_token') {
      try {
        const res = await fetch(`/api/users/${user._id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(newUserData)
        });
        if (res.ok) {
          const updatedUser = await res.json();
          setUser(updatedUser);
          return;
        }
      } catch (err) {
        console.error('Failed to update user on backend', err);
      }
    }
    // Fallback to local state update if mock or backend failed
    setUser(prev => ({ ...prev, ...newUserData }));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
