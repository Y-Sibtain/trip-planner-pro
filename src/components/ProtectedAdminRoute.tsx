import { Navigate } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

export const ProtectedAdminRoute = ({ children }: ProtectedAdminRouteProps) => {
  const { isAdmin, loading } = useAdmin();

  console.log('ProtectedAdminRoute - isAdmin:', isAdmin, 'loading:', loading);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!isAdmin) {
    console.log('Not admin, redirecting to home');
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};