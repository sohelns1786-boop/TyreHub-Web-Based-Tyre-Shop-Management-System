import { Navigate, useLocation } from 'react-router-dom';
import { getCurrentUser } from '../utils/auth';

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const token = localStorage.getItem('tyrehub_token');
  const user = getCurrentUser();

  if (!token || !user || user.role !== 'admin') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}
