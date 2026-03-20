import { createContext, useContext, useState } from 'react';

const USERS = {
  doctors: [
    { id: 'D001', name: 'Dr. Rajesh Kumar', password: 'doc123', dept: 'Emergency',   role: 'doctor' },
    { id: 'D002', name: 'Dr. Priya Sharma', password: 'doc456', dept: 'Cardiology',  role: 'doctor' },
  ],
  patients: [
    { id: 'P001', name: 'Amit Verma',   password: 'pat123', role: 'patient' },
    { id: 'P002', name: 'Sunita Mehta', password: 'pat456', role: 'patient' },
    { id: 'P003', name: 'Ravi Singh',   password: 'pat789', role: 'patient' },
    { id: 'P004', name: 'Neha Gupta',   password: 'pat321', role: 'patient' },
    { id: 'P005', name: 'Arjun Patel',  password: 'pat654', role: 'patient' },
    { id: 'P006', name: 'Kavya Reddy',  password: 'pat987', role: 'patient' },
  ],
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ert_auth')); } catch { return null; }
  });

  const login = (id, password, role) => {
    const list = role === 'doctor' ? USERS.doctors : USERS.patients;
    const found = list.find(u => u.id === id && u.password === password);
    if (!found) return false;
    const { password: _pw, ...safe } = found;
    localStorage.setItem('ert_auth', JSON.stringify(safe));
    setUser(safe);
    return true;
  };

  const logout = () => {
    localStorage.removeItem('ert_auth');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
