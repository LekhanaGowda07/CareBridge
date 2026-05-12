import { useState, useEffect } from 'react';
import { PlusCircle, Activity, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Symptoms.css';

const Symptoms = () => {
  const [symptoms, setSymptoms] = useState([]);
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [type, setType] = useState('Pain Level');
  const [severity, setSeverity] = useState('Mild');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    // Only call backend when we have a real user id and a non-mock token
    if (user && user._id && token && token !== 'mock_token') {
      fetch(`/api/symptoms/user/${user._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setSymptoms(data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [user, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    const newSymptom = {
      type,
      severity,
      notes,
      actionNeeded: severity === 'Severe',
      user: user._id
    };

    // If no real token, add locally
    if (!token || token === 'mock_token') {
      const localSym = { ...newSymptom, _id: Date.now().toString(), date: new Date().toISOString() };
      setSymptoms([localSym, ...symptoms]);
      setShowForm(false);
      setType('Pain Level');
      setSeverity('Mild');
      setNotes('');
      return;
    }

    try {
      const res = await fetch('/api/symptoms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newSymptom)
      });
      if (res.ok) {
        const savedSymptom = await res.json();
        setSymptoms([savedSymptom, ...symptoms]);
        setShowForm(false);
        setType('Pain Level');
        setSeverity('Mild');
        setNotes('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="symptoms-container" style={{ padding: '32px' }}>Loading symptoms...</div>;

  return (
    <div className="symptoms-container">
      <header className="page-header">
        <div>
          <h1>Symptom Tracker</h1>
          <p>Log your daily symptoms to keep your care team informed.</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          <PlusCircle size={18} />
          {showForm ? 'Cancel' : 'Log New Symptom'}
        </button>
      </header>

      {showForm && (
        <div className="glass-card mb-6 slide-down">
          <h3>Log a Symptom</h3>
          <form onSubmit={handleSubmit} className="symptom-form">
            <div className="grid-2">
              <div className="input-group">
                <label className="input-label">Symptom Type</label>
                <select 
                  className="input-field"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option>Pain Level</option>
                  <option>Fatigue</option>
                  <option>Shortness of Breath</option>
                  <option>Nausea</option>
                  <option>Fever</option>
                  <option>Other</option>
                </select>
              </div>
              
              <div className="input-group">
                <label className="input-label">Severity</label>
                <select 
                  className="input-field"
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                >
                  <option>Mild</option>
                  <option>Moderate</option>
                  <option>Severe</option>
                </select>
              </div>
            </div>
            
            <div className="input-group">
              <label className="input-label">Additional Notes</label>
              <textarea 
                className="input-field" 
                rows="3" 
                placeholder="How are you feeling exactly?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              ></textarea>
            </div>
            
            <button type="submit" className="btn btn-primary mt-4">Save Entry</button>
          </form>
        </div>
      )}

      <div className="timeline-container glass-card">
        <h3>History</h3>
        <div className="timeline">
          {symptoms.map(sym => {
            const symId = sym._id || sym.id || `${sym.type}-${sym.date}`;
            return (
            <div key={symId} className="timeline-item">
              <div className="timeline-marker">
                <Activity size={16} />
              </div>
              <div className="timeline-content glass-panel">
                <div className="flex-between">
                  <div className="timeline-header">
                    <h4>{sym.type}</h4>
                    <span className={`badge ${sym.severity === 'Severe' ? 'badge-warning' : 'badge-primary'}`}>
                      {sym.severity}
                    </span>
                  </div>
                  <span className="timeline-date">
                    {new Date(sym.date).toLocaleString([], {month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
                <p className="timeline-notes">{sym.notes}</p>
                
                {sym.actionNeeded && sym.aiResponse && (
                  <div className="ai-response-box">
                    <AlertTriangle size={16} color="var(--color-warning)" />
                    <span><strong>CareBridge:</strong> {sym.aiResponse}</span>
                  </div>
                )}
              </div>
            </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Symptoms;
