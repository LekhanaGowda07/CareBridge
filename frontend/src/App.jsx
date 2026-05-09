import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Medications from './pages/Medications';
import Symptoms from './pages/Symptoms';
import AIChatbot from './pages/AIChatbot';
import Login from './pages/Login';

function Layout({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  // if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

function App() {
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
          <Route path="/medications" element={<Layout><Medications /></Layout>} />
          <Route path="/symptoms" element={<Layout><Symptoms /></Layout>} />
          <Route path="/chatbot" element={<Layout><AIChatbot /></Layout>} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
export default App;
