import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, History, LogOut, MonitorPlay, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface StudentLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { label: 'Unirse a clase', icon: MonitorPlay, to: '/student/join' },
  { label: 'Historial', icon: History, to: '/student/history' },
  { label: 'Ajustes', icon: Settings, to: '/student/settings' },
];

const StudentLayout = ({ children }: StudentLayoutProps) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="flex items-center gap-2 px-5 py-5 border-b border-gray-100">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gray-900 text-sm">ClaseAccesible</span>
        </div>

        <div className="px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">
              {user?.name?.charAt(0).toUpperCase() ?? 'E'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-400">Estudiante</p>
            </div>
          </div>
        </div>

        <nav aria-label="Navegación del estudiante" className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ label, icon: Icon, to }) => {
            const isActive = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white font-medium'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-auto">{children}</main>
    </div>
  );
};

export default StudentLayout;
