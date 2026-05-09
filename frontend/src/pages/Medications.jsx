import { useState, useEffect } from 'react';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { medications as mockMeds } from '../mockData';
import './Medications.css';

const Medications = () => {
  const [meds, setMeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, token } = useAuth();

  useEffect(() => {
    // If we have a logged-in user, try backend; otherwise use mock data.
    if (user && user._id && token && token !== 'mock_token') {
      const headers = { 'Authorization': `Bearer ${token}` };
      fetch(`/api/medications/user/${user._id}`, { headers })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data) && data.length > 0) setMeds(data);
          else setMeds(mockMeds);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setMeds(mockMeds);
          setLoading(false);
        });
    } else {
      // Fallback to mock data when no real user/token available
      setMeds(mockMeds);
      setLoading(false);
    }
  }, [user, token]);

  const toggleTaken = async (id, currentStatus) => {
    // Support mock data (no token) by updating locally, and backend when available.
    const key = id;
    // Optimistic UI update
    setMeds(prev => prev.map(m => {
      const mid = m._id || m.id;
      if (mid === key) return { ...m, taken: !currentStatus };
      return m;
    }));

    // If no token, no user, or running in mock token mode, keep local change only
    if (!token || token === 'mock_token' || !user || !user._id) return;

    try {
      const res = await fetch(`/api/medications/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ taken: !currentStatus })
      });

      if (res.ok) {
        const updatedMed = await res.json();
        setMeds(prev => prev.map(m => {
          const mid = m._id || m.id;
          return mid === id ? updatedMed : m;
        }));
      } else {
        // Revert optimistic change on failure
        setMeds(prev => prev.map(m => {
          const mid = m._id || m.id;
          if (mid === key) return { ...m, taken: currentStatus };
          return m;
        }));
      }
    } catch (err) {
      console.error(err);
      setMeds(prev => prev.map(m => {
        const mid = m._id || m.id;
        if (mid === key) return { ...m, taken: currentStatus };
        return m;
      }));
    }
  };

  if (loading) return <div className="meds-container" style={{ padding: '32px' }}>Loading medications...</div>;

  const pendingCount = meds.filter(m => !m.taken).length;

  return (
    <div className="meds-container">
      <header className="page-header">
        <div>
          <h1>Medication Schedule</h1>
          <p>Track your daily prescriptions and supplements.</p>
        </div>
      </header>

      {pendingCount > 0 && (
        <div className="alert-box warning mb-6">
          <AlertCircle size={24} />
          <div>
            <h4>Reminder</h4>
            <p>You have {pendingCount} medication(s) to take today.</p>
          </div>
        </div>
      )}

      <div className="glass-card full-height">
        <div className="meds-list-full">
          {meds.map(med => {
            const medId = med._id || med.id || `${med.name}-${med.time}`;
            return (
            <div key={medId} className={`med-list-item glass-panel ${med.taken ? 'taken' : ''}`}>
              <div className="med-info">
                <div className="med-time">
                  <Clock size={16} />
                  <span>{med.time}</span>
                </div>
                <div className="med-name-details">
                  <h3>{med.name}</h3>
                  <p>{med.dosage} • {med.frequency}</p>
                  <span className="badge badge-primary">{med.type}</span>
                </div>
              </div>
              <button 
                className={`btn ${med.taken ? 'btn-outline' : 'btn-primary'}`}
                onClick={() => toggleTaken(medId, med.taken)}
              >
                {med.taken ? (
                  <>
                    <CheckCircle2 size={18} />
                    Taken
                  </>
                ) : (
                  'Mark as Taken'
                )}
              </button>
            </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Medications;
