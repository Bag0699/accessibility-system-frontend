import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { Role } from '../../types';

interface ProtectedRouteProps {
  allowedRole?: Role;
}

/**
 * Ruta protegida: redirige al login si el usuario no está autenticado.
 * Si se especifica `allowedRole`, verifica que el rol coincida.
 */
const ProtectedRoute = ({ allowedRole }: ProtectedRouteProps) => {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && role !== allowedRole) {
    // Redirige al dashboard correcto si el rol no coincide
    return <Navigate to={role === 'TEACHER' ? '/teacher/dashboard' : '/student/join'} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
