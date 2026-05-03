import { useState, useEffect } from 'react';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Medications.css';

const Medications = () => {
  const [meds, setMeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, token } = useAuth();

  useEffect(() => {
    if (user && token) {
      fetch(`/api/medications/user/${user._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          setMeds(data);
          setLoading(false);
        })
        .catch(err => console.error(err));
    }
  }, [user, token]);

  const toggleTaken = async (id, currentStatus) => {
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
        setMeds(meds.map(med => 
          med._id === id ? updatedMed : med
        ));
      }
    } catch (err) {
      console.error(err);
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
          {meds.map(med => (
            <div key={med._id} className={`med-list-item glass-panel ${med.taken ? 'taken' : ''}`}>
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
                onClick={() => toggleTaken(med._id, med.taken)}
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
          ))}
        </div>
      </div>
    </div>
  );
};

export default Medications;
