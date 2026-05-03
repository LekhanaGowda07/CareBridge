import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      if (isRegistering) {
        await register({ email, password, name });
      } else {
        await login(email, password);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card glass-panel">
        <div className="login-header">
          <div className="logo-icon-wrap">
            <Activity size={40} color="var(--color-primary)" />
          </div>
          <h2>Welcome to CareBridge</h2>
          <p>{isRegistering ? 'Create your patient account' : 'Sign in to your patient dashboard'}</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="alert-box warning mb-4" style={{ color: 'var(--color-accent)', fontSize: '0.9rem', marginBottom: '16px' }}>{error}</div>}

          {isRegistering && (
            <div className="input-group">
              <label className="input-label">Full Name</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="input-group">
            <label className="input-label">Email Address</label>
            <input 
              type="email" 
              className="input-field" 
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="input-group">
            <label className="input-label">Password</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary w-full mt-4">
            {isRegistering ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="login-footer mt-4" style={{ textAlign: 'center', marginTop: '16px' }}>
          <p style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
            {isRegistering ? 'Already have an account?' : "Don't have an account?"}
            <button 
              type="button" 
              className="forgot-link" 
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}
              onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
            >
              {isRegistering ? 'Sign In' : 'Create one'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
