import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FileText, Calendar, Search, Loader2 } from 'lucide-react';
import TeacherLayout from '../components/teacher/TeacherLayout';
import { courseService } from '../services/courseService';
import { transcriptionService } from '../services/transcriptionService';
import type { CourseResponse, SessionResponse } from '../types';

const formatDate = (isoDate: string) =>
  new Date(isoDate).toLocaleString('es-PE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

const TeacherHistoryPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCourseId = searchParams.get('courseId') ?? '';

  const [courses, setCourses] = useState<CourseResponse[]>([]);
  const [sessions, setSessions] = useState<SessionResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    courseService
      .getCourses()
      .then(setCourses)
      .catch((err) => console.error('Error al cargar cursos', err));
  }, []);

  useEffect(() => {
    let isCurrent = true;

    const fetchHistory = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = selectedCourseId
          ? await transcriptionService.getCourseHistory(selectedCourseId)
          : await transcriptionService.getAllTeacherSessions();
        if (!isCurrent) return;
        setSessions(data);
      } catch (err) {
        if (!isCurrent) return;
        console.error('Error al cargar historial', err);
        setError('No se pudo cargar el historial de sesiones.');
        setSessions([]);
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    };

    fetchHistory();
    return () => {
      isCurrent = false;
    };
  }, [selectedCourseId]);

  const handleCourseChange = (courseId: string) => {
    if (courseId) {
      setSearchParams({ courseId });
    } else {
      setSearchParams({});
    }
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredSessions = sessions.filter((session) =>
    session.courseName.toLowerCase().includes(normalizedSearch) ||
    session.code.toLowerCase().includes(normalizedSearch)
  );

  return (
    <TeacherLayout>
      <div className="max-w-6xl mx-auto space-y-6 p-4 sm:p-8">
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Historial de Clases</h1>
            <p className="text-gray-500 mt-1">Revisa y exporta las transcripciones de tus sesiones pasadas</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <select
              aria-label="Filtrar por curso"
              value={selectedCourseId}
              onChange={(e) => handleCourseChange(e.target.value)}
              className="w-full sm:w-56 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <option value="">Todos los cursos</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>

            <div className="relative w-full sm:w-72">
              <Search aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="search"
                aria-label="Buscar por curso o código"
                placeholder="Buscar por curso o código..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
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
        ) : filteredSessions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar aria-hidden="true" className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No hay sesiones</h3>
            <p className="text-gray-500">
              {searchTerm || selectedCourseId
                ? 'No se encontraron resultados para el filtro seleccionado.'
                : 'Aún no has impartido ninguna clase.'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
                  <tr>
                    <th scope="col" className="px-6 py-4">Curso</th>
                    <th scope="col" className="px-6 py-4">Código</th>
                    <th scope="col" className="px-6 py-4">Fecha</th>
                    <th scope="col" className="px-6 py-4">Estado</th>
                    <th scope="col" className="px-6 py-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredSessions.map((session) => (
                    <tr key={session.code} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{session.courseName}</td>
                      <td className="px-6 py-4">
                        <span className="font-mono bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {session.code}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                        {formatDate(session.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        {session.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                            En vivo
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            Finalizada
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => navigate(`/teacher/history/${encodeURIComponent(session.code)}`)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                        >
                          <FileText aria-hidden="true" className="w-4 h-4" />
                          Ver Transcripción
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </TeacherLayout>
  );
};

export default TeacherHistoryPage;
