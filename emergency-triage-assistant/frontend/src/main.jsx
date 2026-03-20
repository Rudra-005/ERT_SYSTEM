import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import PatientPortal from './pages/PatientPortal';
import PatientsView from './pages/PatientsView';
import UnauthorizedPage from './pages/UnauthorizedPage';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRole="doctor"><App /></ProtectedRoute>
          } />
          <Route path="/dashboard/patients" element={
            <ProtectedRoute allowedRole="doctor"><PatientsView /></ProtectedRoute>
          } />
          <Route path="/patient-portal" element={
            <ProtectedRoute allowedRole="patient"><PatientPortal /></ProtectedRoute>
          } />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
