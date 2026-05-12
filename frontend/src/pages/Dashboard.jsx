import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pill, Activity, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { medications as mockMeds, recentSymptoms as mockSymptoms } from '../mockData';
import './Dashboard.css';

const Dashboard = () => {
  const { user, token, updateUser } = useAuth();
  const [medications, setMedications] = useState([]);
  const [recentSymptoms, setRecentSymptoms] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(null);
  const [vitals, setVitals] = useState({ bp: '120/80', hr: '72', weight: '165' });
  const [notification, setNotification] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const vitalsRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Show a mock notification after 5 seconds
    const timer = setTimeout(() => {
      setNotification({
        title: "Medication Reminder",
        message: "It's time for your Atorvastatin (40mg).",
        type: "med"
      });
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (user) {
      setEditedUser({ ...user });
      if (user.vitals) {
        setVitals(user.vitals);
      }
    }
  }, [user]);

  useEffect(() => {
    if (user && token) {
      // Only call backend when we have a real user id and a non-mock token
      if (user && user._id && token && token !== 'mock_token') {
        const medsController = new AbortController();
        const medsTimeout = setTimeout(() => medsController.abort(), 3000);

      fetch(`/api/medications/user/${user._id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        signal: medsController.signal
      })
        .then(res => res.json())
        .then(data => {
          clearTimeout(medsTimeout);
          if (Array.isArray(data)) setMedications(data);
        })
        .catch(() => {
          clearTimeout(medsTimeout);
        });
        
      const sympController = new AbortController();
      const sympTimeout = setTimeout(() => sympController.abort(), 3000);

        fetch(`/api/symptoms/user/${user._id}`, {
          headers: { 'Authorization': `Bearer ${token}` },
          signal: sympController.signal
        })
          .then(res => res.json())
          .then(data => {
            clearTimeout(sympTimeout);
            if (Array.isArray(data)) setRecentSymptoms(data);
          })
          .catch(() => {
            clearTimeout(sympTimeout);
          });

      return () => {
        clearTimeout(medsTimeout);
        clearTimeout(sympTimeout);
      };
      } else {
        // Fallback to mock data when no real user/token available
        setMedications(mockMeds);
        setRecentSymptoms(mockSymptoms);
      }
    }
  }, [user, token]);

  const handleSaveVitals = async () => {
    if (!token || token === 'mock_token') {
      setNotification({ title: "Demo Mode", message: "Vitals cannot be saved in demo mode.", type: "warning" });
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch(`/api/users/${user._id}/vitals`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ vitals })
      });
      if (res.ok) {
        const updatedUser = await res.json();
        updateUser(updatedUser);
        setNotification({
          title: "Vitals Updated",
          message: "Your health data has been securely saved.",
          type: "success"
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCallNurse = () => {
    setIsCalling(true);
    // Auto-close calling screen after 5 seconds
    setTimeout(() => setIsCalling(false), 5000);
  };

  if (!user) return <div className="dashboard-container" style={{ padding: '32px' }}>Loading dashboard...</div>;

  const pendingMeds = medications.filter(m => !m.taken);
  
  return (
    <div className="dashboard-container">
      {showGuide && (
        <div className="guide-modal-overlay glass-panel animate-fade-in">
          <div className="guide-content glass-card animate-slide-up">
            <div className="modal-header">
              <h2>Post-Surgery Recovery Guide</h2>
              <button className="close-btn" onClick={() => setShowGuide(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <section className="guide-section">
                <h3>Phase 1: Weeks 1-2</h3>
                <ul>
                  <li><strong>Activity:</strong> Light walking only. No lifting &gt; 5 lbs.</li>
                  <li><strong>Wound Care:</strong> Keep incision dry. No baths or pools.</li>
                  <li><strong>Diet:</strong> Low sodium (&lt; 2000mg/day). High fiber.</li>
                </ul>
              </section>
              <section className="guide-section warning">
                <h3>⚠️ When to Call Immediately</h3>
                <ul>
                  <li>Sudden shortness of breath</li>
                  <li>Fever over 101°F</li>
                  <li>Redness or drainage from incision</li>
                  <li>Rapid weight gain (&gt; 2lbs in 24h)</li>
                </ul>
              </section>
              <section className="guide-section">
                <h3>Phase 2: Weeks 3-6</h3>
                <ul>
                  <li>Gradually increase walking to 15-20 minutes.</li>
                  <li>Begin cardiac rehab if prescribed by Dr. Chen.</li>
                  <li>Drive only when off narcotic pain meds.</li>
                </ul>
              </section>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setShowGuide(false)}>I Understand</button>
            </div>
          </div>
        </div>
      )}

      {isCalling && (
        <div className="calling-overlay glass-panel animate-fade-in flex-center flex-column">
          <div className="pulse-circle">
             <Activity size={48} color="white" />
          </div>
          <h2 className="mt-6">Calling Dr. Chen's Office...</h2>
          <p>Connecting you to the recovery nurse line.</p>
          <button className="btn btn-accent mt-6" onClick={() => setIsCalling(false)}>End Call</button>
        </div>
      )}

      {notification && (
        <div className="notification-toast glass-panel animate-slide-in">
          <div className="flex-between">
            <div className="flex-center gap-3">
               <div className="icon-circle primary sm"><Pill size={16} /></div>
               <div>
                 <h4 className="m-0">{notification.title}</h4>
                 <p className="m-0 text-xs">{notification.message}</p>
               </div>
            </div>
            <button className="close-btn" onClick={() => setNotification(null)}>&times;</button>
          </div>
        </div>
      )}

      <header className="page-header">
        {isEditing ? (
          <div className="edit-form glass-panel" style={{ padding: '20px', width: '100%', marginBottom: '24px' }}>
            <h3>Edit Profile</h3>
            <div className="grid-2">
              <div className="input-group">
                <label className="input-label">Name</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={editedUser?.name || ''} 
                  onChange={(e) => setEditedUser({...editedUser, name: e.target.value})}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Condition</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={editedUser?.condition || ''} 
                  onChange={(e) => setEditedUser({...editedUser, condition: e.target.value})}
                />
              </div>
              <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                <label className="input-label">Profile Photo URL</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="https://..."
                  value={editedUser?.avatar || ''} 
                  onChange={(e) => setEditedUser({...editedUser, avatar: e.target.value})}
                />
              </div>
            </div>
            <div className="flex-center gap-4 mt-4" style={{ gap: '12px' }}>
              <button className="btn btn-primary" onClick={() => { updateUser(editedUser); setIsEditing(false); }}>Save Changes</button>
              <button className="btn btn-outline" onClick={() => setIsEditing(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <>
            <div>
              <div className="flex-between" style={{ alignItems: 'center', gap: '16px' }}>
                <h1>Welcome back, {user.name.split(' ')[0]}</h1>
                <button className="btn btn-glass btn-sm" onClick={() => setIsEditing(true)}>Edit Profile</button>
              </div>
              <p>Here is your recovery overview for today.</p>
            </div>
            <div className="date-display">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
          </>
        )}
      </header>

      <div className="grid-3">
        {/* Health Score Gauge */}
        <div className="glass-card health-score-card flex-center flex-column">
          <div className="gauge-container">
            <svg viewBox="0 0 100 100" className="health-gauge">
              <circle className="gauge-base" cx="50" cy="50" r="45" />
              <circle className="gauge-progress" cx="50" cy="50" r="45" style={{ strokeDashoffset: 'calc(283 - (283 * 85) / 100)' }} />
            </svg>
            <div className="gauge-text">
              <span className="score-value">85</span>
              <span className="score-label">Health Score</span>
            </div>
          </div>
          <p className="mt-4 text-center text-sm">
            <strong>+2%</strong> from yesterday. Your activity is increasing!
          </p>
        </div>

        {/* Medication Summary */}
        <div className="glass-card meds-summary-card">
          <div className="card-header">
            <h3>Medication Tracker</h3>
            <div className="icon-circle primary">
              <Pill size={20} />
            </div>
          </div>
          <div className="meds-stats">
            <div className="stat-large">
              <span className="value">{medications.length - pendingMeds.length}</span>
              <span className="separator">/</span>
              <span className="total">{medications.length}</span>
            </div>
            <span className="label">Medications Taken Today</span>
          </div>
          <div className="mini-meds-grid mt-4">
            {medications.map((m, idx) => (
              <div key={idx} className={`dot ${m.taken ? 'filled' : 'empty'}`} title={m.name}></div>
            ))}
          </div>
          <button className="btn btn-primary w-full mt-6" onClick={() => navigate('/medications')}>Manage Schedule</button>
        </div>

        {/* AI Insight Card */}
        <div className="glass-card ai-insight-card glow-primary">
          <div className="card-header">
            <h3>Smart Health Insight</h3>
            <div className="pulse-indicator"></div>
          </div>
          <div className="ai-message-bubble">
            <p className="insight-text">
              "Great job on your morning walk! Your heart rate variability is improving. Based on your lisinopril schedule, your next dose is due in **2 hours**."
            </p>
          </div>
          <button className="btn btn-glass w-full mt-4" onClick={() => navigate('/chatbot')}>Ask CareBridge</button>
        </div>
      </div>

      <div className="grid-3 mt-6">
        {/* Vitals Tracker */}
        <div className="glass-card vitals-card" ref={vitalsRef}>
          <h3>Daily Vitals</h3>
          <div className="vitals-inputs mt-4">
            <div className="vital-input">
              <span className="label">Blood Pressure</span>
              <input type="text" value={vitals.bp} onChange={(e) => setVitals({...vitals, bp: e.target.value})} className="vital-field" />
              <span className="unit">mmHg</span>
            </div>
            <div className="vital-input">
              <span className="label">Heart Rate</span>
              <input type="text" value={vitals.hr} onChange={(e) => setVitals({...vitals, hr: e.target.value})} className="vital-field" />
              <span className="unit">BPM</span>
            </div>
            <div className="vital-input">
              <span className="label">Weight</span>
              <input type="text" value={vitals.weight} onChange={(e) => setVitals({...vitals, weight: e.target.value})} className="vital-field" />
              <span className="unit">lbs</span>
            </div>
          </div>
          <button 
            className="btn btn-primary btn-sm w-full mt-4" 
            onClick={handleSaveVitals}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Vitals'}
          </button>
        </div>

        {/* Quick Actions */}
        <div className="glass-card quick-actions-card">
          <h3>Quick Actions</h3>
          <div className="actions-grid mt-4">
            <button className="action-btn" onClick={() => navigate('/symptoms')}>
              <div className="icon-wrap warning"><AlertTriangle size={20} /></div>
              <span>Log Symptom</span>
            </button>
            <button className="action-btn" onClick={() => vitalsRef.current.scrollIntoView({ behavior: 'smooth' })}>
              <div className="icon-wrap primary"><Activity size={20} /></div>
              <span>Report Vital</span>
            </button>
            <button className="action-btn" style={{ borderColor: 'var(--color-accent)' }} onClick={handleCallNurse}>
              <div className="icon-wrap accent"><Activity size={20} /></div>
              <span>Call Nurse</span>
            </button>
          </div>
        </div>

        {/* Health Education */}
        <div className="glass-card education-card">
          <h3>Recovery Tips</h3>
          <div className="tip-list mt-4">
            <div className="tip-item">
               <CheckCircle2 size={16} color="var(--color-success)" />
               <span>Drinking 8 glasses of water today?</span>
            </div>
            <div className="tip-item">
               <CheckCircle2 size={16} color="var(--color-success)" />
               <span>Incision area looks clean?</span>
            </div>
          </div>
          <button className="btn btn-outline btn-sm w-full mt-4" onClick={() => setShowGuide(true)}>Read Full Guide</button>
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
