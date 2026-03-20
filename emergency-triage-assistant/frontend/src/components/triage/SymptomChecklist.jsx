export default function SymptomChecklist({ symptoms, onChange }) {
  const symptomGroups = {
    CARDIAC: ['Chest Pain', 'Palpitations', 'Shortness of Breath', 'Arm Pain'],
    NEUROLOGICAL: ['Headache', 'Dizziness', 'Confusion', 'Vision Changes', 'Slurred Speech'],
    ABDOMINAL: ['Nausea', 'Vomiting', 'Abdominal Pain', 'Diarrhea'],
    RESPIRATORY: ['Wheezing', 'Coughing Blood', 'Difficulty Breathing'],
    OTHER: ['Fever', 'Sweating', 'Weakness', 'Syncope (fainting)'],
  };

  const toggleSymptom = (symptom) => {
    if (symptoms.includes(symptom)) {
      onChange(symptoms.filter(s => s !== symptom));
    } else {
      onChange([...symptoms, symptom]);
    }
  };

  const groupColors = {
    CARDIAC: '#ef4444',
    NEUROLOGICAL: '#8b5cf6',
    ABDOMINAL: '#f59e0b',
    RESPIRATORY: '#06b6d4',
    OTHER: '#6b7280',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {Object.entries(symptomGroups).map(([group, items]) => (
        <div key={group}>
          <p style={{ 
            color: groupColors[group], 
            fontSize: '11px', 
            fontWeight: 700, 
            textTransform: 'uppercase', 
            letterSpacing: '0.05em',
            marginBottom: '8px' 
          }}>
            {group}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
            {items.map(symptom => {
              const isChecked = symptoms.includes(symptom);
              return (
                <label
                  key={symptom}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 12px',
                    background: isChecked ? `${groupColors[group]}15` : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isChecked ? groupColors[group] : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleSymptom(symptom)}
                    style={{
                      width: '16px',
                      height: '16px',
                      cursor: 'pointer',
                      accentColor: groupColors[group],
                    }}
                  />
                  <span style={{ 
                    color: isChecked ? '#e5e7eb' : '#9ca3af', 
                    fontSize: '13px',
                    fontWeight: isChecked ? 600 : 400,
                  }}>
                    {symptom}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
