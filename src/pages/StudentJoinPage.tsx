import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2, MonitorPlay } from 'lucide-react';
import StudentLayout from '../components/student/StudentLayout';
import { sessionService } from '../services/sessionService';

const StudentJoinPage = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return;

    try {
      setError(null);
      setIsLoading(true);
      // El endpoint registra la asistencia y devuelve la sesión.
      const session = await sessionService.joinSession(cleanCode);
      
      if (!session.isActive) {
        setError('Esta sesión ya ha finalizado.');
        return;
      }

      // Si todo está bien, redirigimos a la sala
      navigate(`/student/session/${cleanCode}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'No se pudo encontrar la sesión. Verifica el código e intenta de nuevo.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <StudentLayout>
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
          
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <MonitorPlay className="w-8 h-8 text-blue-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Unirse a una Clase</h1>
          <p className="text-gray-500 text-sm mb-8">
            Ingresa el código proporcionado por tu docente para ver los subtítulos en tiempo real.
          </p>

          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Ej. A8X-92M"
                required
                maxLength={8}
                className="w-full text-center text-2xl font-mono tracking-widest uppercase border border-gray-300 rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition placeholder:text-gray-300"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-left">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading || !code.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3.5 px-4 rounded-xl transition flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Ingresar a la sala
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </StudentLayout>
  );
};

export default StudentJoinPage;
