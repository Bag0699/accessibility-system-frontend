import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Página placeholder para el Dashboard del Docente.
 * Se implementará en el Paso 4.
 */
const TeacherDashboardPage = () => {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Dashboard Docente</h1>
        <p className="text-gray-500 mb-4">Hola, {user?.name} 👋 — (Paso 4: en construcción)</p>
        <button
          onClick={logout}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
};

/**
 * Redirige al login si se accede a la raíz.
 */
const RootRedirect = () => {
  const { isAuthenticated, role } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={role === 'TEACHER' ? '/teacher/dashboard' : '/student/join'} replace />;
};

export { TeacherDashboardPage, RootRedirect };
