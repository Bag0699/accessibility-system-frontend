import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, Clock3, History, Loader2 } from 'lucide-react';
import StudentLayout from '../components/student/StudentLayout';
import { sessionService } from '../services/sessionService';
import type { StudentHistoryResponse } from '../types';

const formatDate = (date: string) =>
  new Date(date).toLocaleString('es-PE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

const StudentHistoryPage = () => {
  const [sessions, setSessions] = useState<StudentHistoryResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setError(null);
        const history = await sessionService.getStudentHistory();
        setSessions(history);
      } catch (err: unknown) {
        const message = (err as { response?: { data?: { message?: string } } })
          ?.response?.data?.message;
        setError(message ?? 'No se pudo cargar tu historial. Intenta nuevamente.');
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, []);

  return (
    <StudentLayout>
      <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-gray-900">Historial de clases</h1>
          <p className="text-gray-500 mt-1">Consulta las clases a las que te has unido.</p>
        </header>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
            <p className="text-gray-500">Cargando historial...</p>
          </div>
        ) : error ? (
          <div role="alert" className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
            {error}
          </div>
        ) : sessions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
            <History className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-gray-900">Aún no tienes clases en tu historial</h2>
            <p className="text-gray-500 text-sm mt-1">Las clases a las que te unas aparecerán aquí.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <Link
                key={`${session.sessionId}-${session.joinedAt}`}
                to={`/student/history/${encodeURIComponent(session.code)}`}
                aria-label={`Ver transcripción de ${session.courseName}, código ${session.code}`}
                className="block bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm hover:border-blue-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-gray-900">{session.courseName}</h2>
                    <p className="text-sm text-gray-500 mt-1">Docente: {session.teacherName}</p>
                  </div>
                  <span className="font-mono text-sm bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg self-start">
                    {session.code}
                  </span>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
                  <p className="flex items-center gap-2">
                    <CalendarClock className="w-4 h-4 text-blue-500 shrink-0" />
                    Te uniste: {formatDate(session.joinedAt)}
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock3 className="w-4 h-4 text-gray-400 shrink-0" />
                    Finalizó: {formatDate(session.endedAt)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </StudentLayout>
  );
};

export default StudentHistoryPage;
