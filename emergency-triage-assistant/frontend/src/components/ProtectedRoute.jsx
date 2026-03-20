import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRole }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/" replace />;
  if (user.role !== allowedRole) return <Navigate to="/unauthorized" replace />;
  return children;
}
