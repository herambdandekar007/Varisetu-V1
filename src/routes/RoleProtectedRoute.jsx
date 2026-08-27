import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RoleProtectedRoute({ allowedRoles }) {
  const { role } = useAuth();
  const roleId = typeof role === 'string' ? role : role?.id;

  if (!roleId) {
    return <Navigate to="/select-role" replace />;
  }

  if (!allowedRoles.includes(roleId)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
