import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pill, Activity, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const { user, token } = useAuth();
  const [medications, setMedications] = useState([]);
  const [recentSymptoms, setRecentSymptoms] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (user && token) {
      fetch(`/api/medications/user/${user._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setMedications(data));
        
      fetch(`/api/symptoms/user/${user._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setRecentSymptoms(data));
    }
  }, [user, token]);

  if (!user) return <div className="dashboard-container" style={{ padding: '32px' }}>Loading dashboard...</div>;

  const pendingMeds = medications.filter(m => !m.taken);
  
  return (
    <div className="dashboard-container">
      <header className="page-header">
        <div>
          <h1>Welcome back, {user.name.split(' ')[0]}</h1>
          <p>Here is your recovery overview for today.</p>
        </div>
        <div className="date-display">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
      </header>

      <div className="grid-3">
        {/* Status Card */}
        <div className="glass-card status-card">
          <div className="card-header">
            <h3>Recovery Status</h3>
            <span className="badge badge-success">On Track</span>
          </div>
          <div className="status-info">
            <div className="info-row">
              <span>Condition:</span>
              <strong>{user.condition}</strong>
            </div>
            <div className="info-row">
              <span>Days since discharge:</span>
              <strong>3 Days</strong>
            </div>
          </div>
        </div>

        {/* Medication Summary */}
        <div className="glass-card meds-summary-card">
          <div className="card-header">
            <h3>Medications Today</h3>
            <Pill className="icon-primary" />
          </div>
          <div className="meds-stats">
            <div className="stat">
              <span className="stat-value">{medications.length - pendingMeds.length}/{medications.length}</span>
              <span className="stat-label">Taken</span>
            </div>
          </div>
          <button className="btn btn-primary w-full mt-4" onClick={() => navigate('/medications')}>View Schedule</button>
        </div>

        {/* AI Insight Card */}
        <div className="glass-card ai-insight-card">
          <div className="card-header">
            <h3>CareBridge Insight</h3>
            <div className="ai-indicator"></div>
          </div>
          <p className="insight-text">
            "Your symptom reports indicate some shortness of breath yesterday. I've sent a summary to Dr. Chen. Please make sure to rest and avoid exertion today."
          </p>
        </div>
      </div>

      <div className="grid-2 mt-6">
        {/* Upcoming Medications */}
        <div className="glass-card">
          <h3>Next Medications</h3>
          <div className="med-list">
            {pendingMeds.length > 0 ? pendingMeds.map(med => (
              <div key={med.id} className="med-item flex-between">
                <div className="med-details">
                  <h4>{med.name}</h4>
                  <p>{med.dosage} • {med.time}</p>
                </div>
                <button className="btn btn-outline btn-sm">Mark Taken</button>
              </div>
            )) : (
              <div className="empty-state">
                <CheckCircle2 color="var(--color-success)" size={32} />
                <p>All caught up for now!</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Symptoms */}
        <div className="glass-card">
          <h3>Recent Symptoms</h3>
          <div className="symptom-list">
            {recentSymptoms.slice(0, 2).map(sym => (
              <div key={sym.id} className="symptom-item">
                <div className="flex-between">
                  <h4>{sym.type}</h4>
                  {sym.actionNeeded && <AlertTriangle size={16} color="var(--color-accent)" />}
                </div>
                <p>{sym.severity} • {new Date(sym.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
