import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { SkeletonPage } from './Skeleton';

export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <SkeletonPage />;
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
