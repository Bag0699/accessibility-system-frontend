import { useState } from 'react';
import { X, ChevronDown, Check, Copy, Loader2 } from 'lucide-react';
import type { CourseResponse, SessionResponse } from '../../types';
import { courseService } from '../../services/courseService';
import { sessionService } from '../../services/sessionService';

interface CreateSessionModalProps {
  courses: CourseResponse[];
  onClose: () => void;
  onSessionCreated: (session: SessionResponse) => void;
  onCourseCreated: (course: CourseResponse) => void;
}

type Step = 'configure' | 'created';

const CreateSessionModal = ({
  courses,
  onClose,
  onSessionCreated,
  onCourseCreated,
}: CreateSessionModalProps) => {
  const [step, setStep] = useState<Step>('configure');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Formulario Paso 1
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [newCourseName, setNewCourseName] = useState('');
  const [createNewCourse, setCreateNewCourse] = useState(courses.length === 0);

  // Resultado Paso 2
  const [createdSession, setCreatedSession] = useState<SessionResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      let courseId = selectedCourseId;

      // Si eligió crear nuevo curso, lo creamos primero
      if (createNewCourse) {
        if (!newCourseName.trim()) {
          setError('El nombre del curso es obligatorio.');
          setIsLoading(false);
          return;
        }
        const newCourse = await courseService.createCourse(newCourseName.trim());
        onCourseCreated(newCourse);
        courseId = newCourse.id;
      } else if (!courseId) {
        setError('Selecciona un curso o crea uno nuevo.');
        setIsLoading(false);
        return;
      }

      const session = await sessionService.createSession(courseId);
      setCreatedSession(session);
      onSessionCreated(session);
      setStep('created');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Error al crear la sesión. Inténtalo de nuevo.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (!createdSession) return;
    navigator.clipboard.writeText(createdSession.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">

        {/* Header del Modal */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            {step === 'configure' ? 'Crear Nueva Sesión' : 'Sesión Creada Exitosamente'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── PASO 1: Configurar ── */}
        {step === 'configure' && (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            <p className="text-sm text-gray-500">Configura los detalles de tu próxima clase accesible.</p>

            {/* Toggle nuevo / existente */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCreateNewCourse(false)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition ${
                  !createNewCourse
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                Curso existente
              </button>
              <button
                type="button"
                onClick={() => setCreateNewCourse(true)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition ${
                  createNewCourse
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                + Nuevo curso
              </button>
            </div>

            {/* Selector de curso existente */}
            {!createNewCourse && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                  Curso o asignatura
                </label>
                <div className="relative">
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white pr-8"
                  >
                    <option value="">Selecciona un curso</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Input nuevo curso */}
            {createNewCourse && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                  Nombre del nuevo curso
                </label>
                <input
                  type="text"
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                  placeholder="Ej. Introducción a la Termodinámica"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Crear sesión'}
              </button>
            </div>
          </form>
        )}

        {/* ── PASO 2: Sesión Creada ── */}
        {step === 'created' && createdSession && (
          <div className="px-6 py-5 space-y-5">
            <div className="flex items-center justify-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-sm text-center text-gray-500">
              Comparte el código con tus estudiantes para que se unan a la clase.
            </p>

            {/* Tarjeta con código */}
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block"></span>
                  LISTO PARA INICIAR
                </span>
              </div>
              <p className="font-semibold text-gray-800 text-sm mb-3">{createdSession.courseName}</p>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">
                  Código de acceso
                </p>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-2xl font-bold tracking-widest text-gray-900">
                    {createdSession.code}
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition ${
                      copied
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <a
                href={`/teacher/session/${createdSession.code}`}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold text-center transition"
              >
                ▶ Iniciar transcripción en vivo
              </a>
              <button
                onClick={onClose}
                className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition"
              >
                Cancelar y volver al Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateSessionModal;
