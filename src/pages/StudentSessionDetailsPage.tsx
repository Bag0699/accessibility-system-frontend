import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarClock, Clock3, FileText, Loader2, Search } from 'lucide-react';
import StudentLayout from '../components/student/StudentLayout';
import { sessionService } from '../services/sessionService';
import { transcriptionService } from '../services/transcriptionService';
import type { StudentHistoryResponse, TranscriptionResponse } from '../types';

const formatDate = (date: string) =>
  new Date(date).toLocaleString('es-PE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const remainingSeconds = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainingSeconds}`;
};

const StudentSessionDetailsPage = () => {
  const { code = '' } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<StudentHistoryResponse | null>(null);
  const [transcripts, setTranscripts] = useState<TranscriptionResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    const loadSessionDetails = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [sessionDetails, sessionTranscripts] = await Promise.all([
          sessionService.getStudentSessionByCode(code),
          transcriptionService.getSessionTranscriptions(code),
        ]);
        if (!isCurrent) return;
        setSession(sessionDetails);
        setTranscripts(sessionTranscripts);
      } catch (err: unknown) {
        if (!isCurrent) return;
        const message = (err as { response?: { data?: { message?: string } } })
          ?.response?.data?.message;
        setError(message ?? 'No se pudo cargar la transcripción de esta sesión.');
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    };

    if (code) loadSessionDetails();
    else {
      setError('No se indicó el código de la sesión.');
      setIsLoading(false);
    }

    return () => {
      isCurrent = false;
    };
  }, [code]);

  const normalizedSearch = searchTerm.trim().toLocaleLowerCase();
  const filteredTranscripts = transcripts.filter((transcript) =>
    transcript.text.toLocaleLowerCase().includes(normalizedSearch),
  );

  return (
    <StudentLayout>
      <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6">
        <header className="flex items-start gap-3 border-b border-gray-200 pb-4">
          <button
            type="button"
            onClick={() => navigate('/student/history')}
            aria-label="Volver al historial"
            className="p-2 -ml-2 rounded-lg text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-900">
              {isLoading ? 'Cargando sesión...' : session?.courseName ?? 'Detalle de sesión'}
            </h1>
            {session && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500 mt-2">
                <span className="flex items-center gap-1.5">
                  <CalendarClock className="w-4 h-4" />
                  Te uniste: {formatDate(session.joinedAt)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock3 className="w-4 h-4" />
                  Finalizó: {formatDate(session.endedAt)}
                </span>
                <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                  {session.code}
                </span>
              </div>
            )}
            {session && <p className="text-sm text-gray-500 mt-1">Docente: {session.teacherName}</p>}
          </div>
        </header>

        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="search"
            aria-label="Buscar en la transcripción"
            placeholder="Buscar en la transcripción..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            disabled={isLoading || Boolean(error)}
          />
        </div>

        <section aria-label="Transcripción de la clase" className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden min-h-96">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center min-h-96 text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
              Cargando transcripción...
            </div>
          ) : error ? (
            <div role="alert" className="m-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          ) : transcripts.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-96 text-center p-6">
              <FileText className="w-10 h-10 text-gray-300 mb-3" />
              <p className="text-gray-700 font-medium">Esta sesión no tiene transcripciones.</p>
            </div>
          ) : filteredTranscripts.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-96 text-center p-6">
              <Search className="w-10 h-10 text-gray-300 mb-3" />
              <p className="text-gray-700 font-medium">No hay coincidencias para “{searchTerm}”.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-[65vh] overflow-y-auto p-4 sm:p-6">
              {filteredTranscripts.map((transcript, index) => (
                <article key={transcript.id || index} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                  <span className="shrink-0 h-fit text-xs font-mono font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {formatTime(transcript.startTime || 0)}
                  </span>
                  <p className="flex-1 text-gray-800 leading-relaxed">{transcript.text}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </StudentLayout>
  );
};

export default StudentSessionDetailsPage;
