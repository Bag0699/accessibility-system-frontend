import { useEffect, useState, useCallback } from "react";
import { Plus, BookOpen, Clock, ChevronRight, Radio } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import TeacherLayout from "../components/teacher/TeacherLayout";
import CreateSessionModal from "../components/teacher/CreateSessionModal";
import type { CourseResponse, SessionResponse } from "../types";
import { courseService } from "../services/courseService";
import { transcriptionService } from "../services/transcriptionService";

const TeacherDashboardPage = () => {
  const { user } = useAuth();

  const [courses, setCourses] = useState<CourseResponse[]>([]);
  const [recentSessions, setRecentSessions] = useState<SessionResponse[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const loadCourses = useCallback(async () => {
    try {
      setIsLoadingCourses(true);
      const data = await courseService.getCourses();
      setCourses(data);
    } catch {
      // silencioso: si falla, la lista queda vacía
    } finally {
      setIsLoadingCourses(false);
    }
  }, []);

  const loadRecentSessions = useCallback(async () => {
    try {
      setIsLoadingSessions(true);
      const sessions = await transcriptionService.getAllTeacherSessions();
      setRecentSessions(sessions.slice(0, 5));
    } catch {
      // silencioso
    } finally {
      setIsLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    loadCourses();
    loadRecentSessions();
  }, [loadCourses, loadRecentSessions]);

  const handleCourseCreated = (course: CourseResponse) => {
    setCourses((prev) => [course, ...prev]);
  };

  const handleSessionCreated = (session: SessionResponse) => {
    setRecentSessions((prev) => [session, ...prev.filter((s) => s.id !== session.id)].slice(0, 5));
  };

  const formatDate = (isoDate: string) => {
    return new Date(isoDate).toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (isoDate: string) => {
    return new Date(isoDate).toLocaleTimeString("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <TeacherLayout>
      <div className="p-8">
        {/* Encabezado con saludo y botón */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Hola, {user?.name?.split(" ")[0]}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {courses.length === 0
                ? "Crea tu primer curso para comenzar."
                : `Tienes ${courses.length} curso${courses.length !== 1 ? "s" : ""} registrado${courses.length !== 1 ? "s" : ""}.`}
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Crear nueva sesión
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna Izquierda: Sesiones Recientes */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-800">
                Sesiones Recientes
              </h2>
              <a
                href="/teacher/history"
                className="text-sm text-blue-600 hover:underline"
              >
                Ver todas
              </a>
            </div>

            {isLoadingSessions ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-16 bg-gray-100 rounded-xl animate-pulse"
                  />
                ))}
              </div>
            ) : recentSessions.length === 0 ? (
              <div className="bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center">
                <BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Aún no tienes sesiones.</p>
                <button
                  onClick={() => setShowModal(true)}
                  className="mt-3 text-sm text-blue-600 hover:underline font-medium"
                >
                  Crear la primera sesión
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {recentSessions.map((session) => (
                  <div
                    key={session.id}
                    className="bg-white rounded-xl border border-gray-200 px-4 py-3.5 flex items-center gap-4 hover:border-blue-300 transition-colors group"
                  >
                    <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                      <BookOpen className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {session.courseName}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-400">
                          {formatDate(session.createdAt)},{" "}
                          {formatTime(session.createdAt)}
                        </span>
                      </div>
                    </div>
                    {session.isActive ? (
                      <span className="flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded-full shrink-0">
                        <Radio className="w-3 h-3 animate-pulse" />
                        En Vivo
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full shrink-0">
                        Finalizada
                      </span>
                    )}
                    <a
                      href={`/teacher/session/${session.code}`}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 group-hover:text-gray-500 transition"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Columna Derecha: Mis Cursos */}
          <div>
            <h2 className="text-base font-semibold text-gray-800 mb-4">
              Mis Cursos
            </h2>

            {isLoadingCourses ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-12 bg-gray-100 rounded-xl animate-pulse"
                  />
                ))}
              </div>
            ) : courses.length === 0 ? (
              <div className="bg-white rounded-xl border border-dashed border-gray-300 p-6 text-center">
                <p className="text-xs text-gray-400">Aún no tienes cursos.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center justify-between group hover:border-blue-300 transition-colors"
                  >
                    <p className="text-sm font-medium text-gray-700 truncate">
                      {course.name}
                    </p>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 shrink-0 transition" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de creación de sesión */}
      {showModal && (
        <CreateSessionModal
          courses={courses}
          onClose={() => setShowModal(false)}
          onSessionCreated={handleSessionCreated}
          onCourseCreated={handleCourseCreated}
        />
      )}
    </TeacherLayout>
  );
};

export default TeacherDashboardPage;
