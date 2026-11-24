import { useEffect, useState, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Mic, MicOff, Square, Radio, AlertCircle, Loader2, ArrowLeft, History, Users, Copy, Check, FileText } from 'lucide-react';
import TeacherLayout from '../components/teacher/TeacherLayout';
import { useStomp } from '../hooks/useStomp';
import { useLiveTranscription } from '../hooks/useLiveTranscription';
import { sessionService } from '../services/sessionService';
import { transcriptionService } from '../services/transcriptionService';
import type { TranscriptionResponse } from '../types';

const TeacherLivePage = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const sessionCode = code || '';

  // Estados de la sesión y carga
  const [isLoading, setIsLoading] = useState(true);
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);
  const [courseName, setCourseName] = useState<string>('');
  const [connectedCount, setConnectedCount] = useState<number>(0);
  const [copiedCode, setCopiedCode] = useState(false);

  // Historial local de textos finales enviados
  const [transcripts, setTranscripts] = useState<TranscriptionResponse[]>([]);
  // Texto temporal parcial (aún procesándose)
  const [interimText, setInterimText] = useState<string>('');
  
  const endOfListRef = useRef<HTMLDivElement>(null);

  // Hook STOMP
  const { isConnected: isStompConnected, sendTranscription } = useStomp({
    sessionCode,
    onPresenceUpdate: setConnectedCount,
  });

  // Hook Transcripción de Audio
  const {
    isRecording,
    isReady: isDeepgramReady,
    error: audioError,
    startRecording,
    stopRecording
  } = useLiveTranscription({
    onFinalTranscript: (text, start, end) => {
      // 1. Limpiar texto temporal
      setInterimText('');
      
      // 2. Enviar a backend vía STOMP
      sendTranscription(text, start, end);
      
      // 3. Agregar a la UI local (usamos un ID temporal o fecha para la key)
      const newFragment: TranscriptionResponse = {
        id: crypto.randomUUID(),
        text,
        startTime: start,
        endTime: end
      };
      setTranscripts(prev => [...prev, newFragment]);
    },
    onInterimTranscript: (text) => {
      setInterimText(text);
    }
  });

  // Auto-scroll al final cuando llegan nuevos textos
  useEffect(() => {
    endOfListRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts, interimText]);

  // Cargar información de la sesión al montar el componente
  useEffect(() => {
    const initSession = async () => {
      try {
        setIsLoading(true);
        // 1. Verificar estado de la sesión
        const session = await sessionService.getSessionByCode(sessionCode);
        setIsSessionActive(session.isActive);
        setCourseName(session.courseName);

        // 2. Traer historial y conteo actual si la sesión sigue activa
        if (session.isActive) {
          const [history, presence] = await Promise.all([
            transcriptionService.getSessionTranscriptions(sessionCode),
            sessionService.getConnectedCount(sessionCode).catch(() => ({ connectedCount: 0 })),
          ]);
          setTranscripts(history);
          setConnectedCount(presence.connectedCount);
        } else {
          setConnectedCount(0);
        }
      } catch (error) {
        console.error('Error al cargar la sesión', error);
      } finally {
        setIsLoading(false);
      }
    };
    initSession();
  }, [sessionCode]);

  // Sincronizar conteo inicial al conectar STOMP para evitar ventana entre carga y suscripción
  useEffect(() => {
    if (!isStompConnected || !isSessionActive || !sessionCode) return;

    sessionService
      .getConnectedCount(sessionCode)
      .then((presence) => setConnectedCount(presence.connectedCount))
      .catch(() => {});
  }, [isStompConnected, isSessionActive, sessionCode]);

  const handleCopyCode = () => {
    if (!sessionCode) return;
    navigator.clipboard.writeText(sessionCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleEndSession = async () => {
    try {
      stopRecording();
      await sessionService.endSession(sessionCode);
      setIsSessionActive(false);
      // Opcional: navigate('/teacher/dashboard'); pero dejémoslo en la vista para que vea que finalizó
    } catch (error) {
      console.error('Error al finalizar la sesión:', error);
      alert('Hubo un problema al finalizar la sesión.');
    }
  };

  if (isLoading) {
    return (
      <TeacherLayout>
        <div className="flex flex-col h-screen max-h-screen bg-gray-50 items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
          <p className="text-gray-500 text-sm">Cargando sala...</p>
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout>
      <div className="flex flex-col h-screen max-h-screen bg-gray-50">
        
        {/* Cabecera de la Sala */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900 truncate max-w-sm">
                {courseName || 'Sala en Vivo'}
              </h1>
              <span className="bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded text-xs font-mono font-semibold tracking-wider shrink-0">
                {sessionCode}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                aria-label="Copiar código de sesión"
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                  copiedCode
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {copiedCode ? <Check aria-hidden="true" className="w-3 h-3" /> : <Copy aria-hidden="true" className="w-3 h-3" />}
                {copiedCode ? 'Copiado' : 'Copiar'}
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Los estudiantes están leyendo esta transcripción en tiempo real.
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Status indicators */}
            <div className="flex items-center gap-4 text-xs font-medium mr-2">
              {isSessionActive && (
                <span
                  aria-live="polite"
                  className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full font-semibold"
                >
                  <Users aria-hidden="true" className="w-3.5 h-3.5" />
                  {connectedCount} {connectedCount === 1 ? 'conectado' : 'conectados'}
                </span>
              )}
              <span className={`flex items-center gap-1.5 ${isStompConnected ? 'text-green-600' : 'text-orange-500'}`}>
                <span className={`w-2 h-2 rounded-full ${isStompConnected ? 'bg-green-500' : 'bg-orange-500'}`}></span>
                Servidor
              </span>
              <span className={`flex items-center gap-1.5 ${isDeepgramReady ? 'text-green-600' : 'text-gray-400'}`}>
                <span className={`w-2 h-2 rounded-full ${isDeepgramReady ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                IA
              </span>
            </div>

            {isSessionActive ? (
              <button
                onClick={handleEndSession}
                className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg text-sm font-semibold transition"
              >
                <Square className="w-4 h-4" />
                Finalizar Clase
              </button>
            ) : (
              <button
                onClick={() => navigate('/teacher/dashboard')}
                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver al Dashboard
              </button>
            )}
          </div>
        </header>

        {!isSessionActive && (
          <div className="bg-gray-800 text-white text-center py-2 text-sm font-medium">
            Esta sesión ha finalizado. El registro de audio está desactivado.
          </div>
        )}

        {audioError && isSessionActive && (
          <div className="mx-6 mt-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-start gap-3 border border-red-200">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="text-sm">{audioError}</p>
          </div>
        )}

        {/* Área de Transcripción */}
        <main className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {!isSessionActive ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                <History className="w-8 h-8 text-gray-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-700 mb-2">Clase Concluida</h2>
              <p className="text-center max-w-md mb-6">
                Esta sesión ya ha finalizado. Puedes consultar todo el registro de la transcripción y exportarlo en PDF desde el historial.
              </p>
              <Link
                to={`/teacher/history/${encodeURIComponent(sessionCode)}`}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                <FileText aria-hidden="true" className="w-4 h-4" />
                Ver transcripción y exportar PDF
              </Link>
            </div>
          ) : (
            <>
              {transcripts.length === 0 && !interimText && (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <Mic className="w-12 h-12 mb-3 text-gray-300" />
                  <p>Presiona "Iniciar Micrófono" para comenzar a transcribir.</p>
                </div>
              )}

              {transcripts.map((t, index) => (
                <div key={t.id || index} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 inline-block max-w-4xl w-full">
                  <p className="text-gray-800 text-lg leading-relaxed">{t.text}</p>
                </div>
              ))}

              {/* Texto intermedio (en proceso) */}
              {interimText && (
                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 inline-block max-w-4xl w-full opacity-80">
                  <p className="text-gray-600 text-lg leading-relaxed italic">{interimText}</p>
                </div>
              )}

              <div ref={endOfListRef} />
            </>
          )}
        </main>

        {/* Panel de Control Inferior */}
        <footer className="bg-white border-t border-gray-200 p-6 flex justify-center shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          {isSessionActive ? (
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`flex items-center gap-3 px-8 py-4 rounded-full text-base font-bold shadow-lg transition-all transform hover:scale-105 active:scale-95 ${
                isRecording 
                  ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/30' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30'
              }`}
            >
              {isRecording ? (
                <>
                  <MicOff className="w-6 h-6" />
                  Detener Micrófono
                  <Radio className="w-5 h-5 animate-pulse ml-2 text-red-200" />
                </>
              ) : (
                <>
                  <Mic className="w-6 h-6" />
                  Iniciar Micrófono
                </>
              )}
            </button>
          ) : (
            <div className="text-gray-500 font-medium">Sesión Finalizada</div>
          )}
        </footer>

      </div>
    </TeacherLayout>
  );
};

export default TeacherLivePage;
