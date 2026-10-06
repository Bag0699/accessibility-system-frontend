import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { Settings, Loader2, ArrowLeft, Radio, ExternalLink } from 'lucide-react';
import StudentLayout from '../components/student/StudentLayout';
import { useStompSubscription } from '../hooks/useStompSubscription';
import { useDocumentPiP } from '../hooks/useDocumentPiP';
import { useCanvasPiP } from '../hooks/useCanvasPiP';
import { sessionService } from '../services/sessionService';
import { transcriptionService } from '../services/transcriptionService';
import type { TranscriptionResponse } from '../types';

type Theme = 'light' | 'dark' | 'high-contrast';
type FontSize = 'text-lg' | 'text-2xl' | 'text-4xl';
type FontFamily = 'font-sans' | 'font-serif' | 'font-mono';

// ---------------------------------------------------------------------------
// Componente de subtítulos para la ventana PiP de CHROMIUM (Document PiP)
// ---------------------------------------------------------------------------
interface PiPSubtitleViewProps {
  transcripts: TranscriptionResponse[];
  courseName: string;
  isConnected: boolean;
  theme: Theme;
  fontSize: FontSize;
  fontFamily: FontFamily;
}

const PiPSubtitleView = ({ transcripts, courseName, isConnected, theme, fontSize, fontFamily }: PiPSubtitleViewProps) => {
  // Solo mostrar los últimos 3 fragmentos para simular subtítulos "en vivo"
  const recentLines = transcripts.slice(-3);

  const bgStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  };

  // Barra de estado mínima (5% de la altura)
  const statusBarStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '4px 12px',
    fontSize: '11px',
    opacity: 0.7,
    background: theme === 'high-contrast' ? '#000' : theme === 'dark' ? 'rgba(17,24,39,0.95)' : 'rgba(0,0,0,0.75)',
    color: theme === 'high-contrast' ? '#facc15' : '#fff',
    flexShrink: 0,
  };

  // Área de subtítulos: ocupa el espacio restante, texto al fondo
  const subtitleAreaStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    padding: '8px 16px 14px',
    background: theme === 'high-contrast'
      ? '#000'
      : theme === 'dark'
        ? 'rgba(17,24,39,0.97)'
        : 'rgba(0,0,0,0.82)',
    overflow: 'hidden',
  };

  const lineWrapperStyle: React.CSSProperties = {
    textAlign: 'center',
    lineHeight: 1.45,
  };

  // Colores de texto según tema
  const textColor = theme === 'high-contrast' ? '#facc15' : '#ffffff';
  const oldTextColor = theme === 'high-contrast' ? 'rgba(250,204,21,0.45)' : 'rgba(255,255,255,0.45)';

  // Mapa de tamaños de fuente a valores CSS reales
  const fontSizeMap: Record<FontSize, string> = {
    'text-lg': '18px',
    'text-2xl': '24px',
    'text-4xl': '36px',
  };

  const fontFamilyMap: Record<FontFamily, string> = {
    'font-sans': 'ui-sans-serif, system-ui, sans-serif',
    'font-serif': 'ui-serif, Georgia, serif',
    'font-mono': 'ui-monospace, Consolas, monospace',
  };

  return (
    <div style={bgStyle}>
      {/* Barra de estado mínima */}
      <div style={statusBarStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%',
            background: isConnected ? '#22c55e' : '#ef4444',
            display: 'inline-block',
          }} />
          <span>{courseName}</span>
        </div>
        <span style={{ opacity: 0.5 }}>BAG Accesibilidad</span>
      </div>

      {/* Área de subtítulos */}
      <div style={subtitleAreaStyle}>
        {recentLines.length === 0 ? (
          <div style={{ ...lineWrapperStyle, color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>
            Esperando subtítulos...
          </div>
        ) : (
          recentLines.map((t, idx) => {
            const isLatest = idx === recentLines.length - 1;
            return (
              <div key={t.id || idx} style={lineWrapperStyle}>
                <span style={{
                  fontFamily: fontFamilyMap[fontFamily],
                  fontSize: fontSizeMap[fontSize],
                  color: isLatest ? textColor : oldTextColor,
                  // Sombra para legibilidad sobre cualquier fondo
                  textShadow: '0 1px 4px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,0.8)',
                  fontWeight: isLatest ? 600 : 400,
                  transition: 'color 0.3s ease',
                }}>
                  {t.text}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------

const StudentLivePage = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const sessionCode = code || '';

  // Estados de carga e info de sesión
  const [isLoading, setIsLoading] = useState(true);
  const [courseName, setCourseName] = useState('');
  const [isSessionActive, setIsSessionActive] = useState(true);

  // Textos y suscripción
  const [transcripts, setTranscripts] = useState<TranscriptionResponse[]>([]);
  const endOfListRef = useRef<HTMLDivElement>(null);

  // Estados de Accesibilidad
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>('light');
  const [fontSize, setFontSize] = useState<FontSize>('text-2xl');
  const [fontFamily, setFontFamily] = useState<FontFamily>('font-sans');

  // STOMP Hook
  const { isConnected } = useStompSubscription({
    sessionCode,
    onNewTranscript: (newTranscript) => {
      setTranscripts((prev) => {
        // Evitar duplicados si llega el mismo STOMP event
        if (prev.find(t => t.id === newTranscript.id)) return prev;
        return [...prev, newTranscript];
      });
    },
    onSessionEnded: () => {
      setIsSessionActive(false);
    }
  });

  // Hook de Chromium (Document PiP)
  const docPiP = useDocumentPiP();
  
  // Hook de Firefox/Safari (Canvas PiP Fallback)
  const canvasPiP = useCanvasPiP({
    transcripts,
    courseName,
    isConnected,
    theme,
    fontSize,
    fontFamily
  });

  const isSupported = docPiP.isSupported || canvasPiP.isSupported;
  const isPiPOpen = docPiP.isPiPOpen || canvasPiP.isPiPOpen;

  const openPiP = (width = 700, height = 180) => {
    if (docPiP.isSupported) {
      docPiP.openPiP(width, height);
    } else if (canvasPiP.isSupported) {
      canvasPiP.openPiP();
    }
  };

  const closePiP = () => {
    if (docPiP.isPiPOpen) docPiP.closePiP();
    if (canvasPiP.isPiPOpen) canvasPiP.closePiP();
  };

  // Init Data
  useEffect(() => {
    const initSession = async () => {
      try {
        setIsLoading(true);
        const session = await sessionService.getSessionByCode(sessionCode);
        setCourseName(session.courseName);
        setIsSessionActive(session.isActive);

        const history = await transcriptionService.getSessionTranscriptions(sessionCode);
        setTranscripts(history);
      } catch (error) {
        console.error('Error al cargar la sesión', error);
        alert('La sesión no existe o ha ocurrido un error.');
        navigate('/student/join');
      } finally {
        setIsLoading(false);
      }
    };
    initSession();
  }, [sessionCode, navigate]);

  // Auto-scroll (solo hace scroll si no está leyendo algo antiguo, pero para simplificar, forzamos scroll por ahora)
  useEffect(() => {
    endOfListRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts]);

  // Funciones de Accesibilidad (Estilos dinámicos)
  const getThemeClasses = () => {
    switch (theme) {
      case 'dark': return 'bg-gray-900 text-gray-100';
      case 'high-contrast': return 'bg-black text-yellow-400'; // Amarillo sobre negro
      default: return 'bg-white text-gray-900'; // Light
    }
  };

  const getContainerThemeClasses = () => {
    switch (theme) {
      case 'dark': return 'bg-gray-800 border-gray-700';
      case 'high-contrast': return 'bg-black border-yellow-500 border-2';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  // Extraer el renderizado de la lista de subtítulos
  const renderTranscripts = () => (
    <main className="flex-1 overflow-y-auto p-4 sm:p-8 flex flex-col items-center w-full">
      <div className="w-full max-w-4xl space-y-6">
        {transcripts.length === 0 ? (
          <div className="text-center opacity-50 mt-20">
            <p className="text-lg">Aún no hay subtítulos en esta sesión.</p>
          </div>
        ) : (
          transcripts.map((t, idx) => (
            <div key={t.id || idx} className={`p-4 sm:p-6 rounded-2xl shadow-sm transition-all duration-300 ${getContainerThemeClasses()}`}>
              <p className={`leading-relaxed ${fontSize} ${fontFamily}`}>
                {t.text}
              </p>
            </div>
          ))
        )}
        <div ref={endOfListRef} className="h-4" />
      </div>
    </main>
  );

  if (isLoading) {
    return (
      <StudentLayout>
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
          <p className="text-gray-500">Conectando a la clase...</p>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className={`flex-1 flex flex-col relative transition-colors duration-300 ${getThemeClasses()} ${isPiPOpen ? 'opacity-50' : ''}`}>
        
        {/* Cabecera / Status */}
        <div className={`px-6 py-3 flex items-center justify-between border-b shrink-0 ${theme === 'high-contrast' ? 'border-yellow-500' : 'border-gray-200/20'}`}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/student/join')}
              className={`p-2 rounded-lg transition-colors ${theme === 'high-contrast' ? 'hover:bg-yellow-900/30' : 'hover:bg-gray-200/50'}`}
              title="Salir de la sala"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-bold text-lg leading-tight truncate max-w-xs sm:max-w-md">{courseName}</h1>
              <div className="flex items-center gap-2 text-xs mt-0.5 opacity-80">
                {isSessionActive ? (
                  <>
                    <Radio className={`w-3 h-3 ${isConnected ? 'animate-pulse text-green-500' : 'text-orange-500'}`} />
                    <span>{isConnected ? 'Recibiendo subtítulos en vivo' : 'Conectando al servidor...'}</span>
                  </>
                ) : (
                  <span>Sesión finalizada</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Botón Picture-in-Picture */}
            {isSupported && !isPiPOpen && (
              <button
                onClick={() => openPiP(700, 180)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-colors border ${
                  theme === 'high-contrast'
                    ? 'border-yellow-500 hover:bg-yellow-900/30 text-yellow-400'
                    : 'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
                title="Abrir en ventana flotante (Picture-in-Picture)"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="hidden sm:inline">Modo Flotante</span>
              </button>
            )}

            <button
              onClick={() => setIsSettingsOpen(true)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-colors border ${
                theme === 'high-contrast' 
                  ? 'border-yellow-500 hover:bg-yellow-900/30 text-yellow-400' 
                  : 'border-gray-300 hover:bg-gray-200/50 text-current'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Accesibilidad</span>
            </button>
          </div>
        </div>

        {/* Zona de Subtítulos (Main Window o Placeholder) */}
        {!isPiPOpen ? (
          renderTranscripts()
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <ExternalLink className="w-12 h-12 mb-4 opacity-50" />
            <h2 className="text-xl font-medium mb-2">Subtítulos en modo flotante</h2>
            <p className="opacity-70 mb-6 max-w-sm">
              Has sacado los subtítulos a una ventana independiente para mantenerlos siempre visibles sobre tus otras aplicaciones.
            </p>
            <button
              onClick={closePiP}
              className={`px-4 py-2 rounded-lg font-medium transition-colors border ${
                theme === 'high-contrast' ? 'border-yellow-500 text-yellow-400' : 'bg-gray-800 text-white hover:bg-gray-900'
              }`}
            >
              Regresar a esta pestaña
            </button>
          </div>
        )}

        {/* Renderizado en la Ventana Flotante (Solo para Chromium) */}
        {docPiP.isPiPOpen && docPiP.pipWindow && createPortal(
          <PiPSubtitleView
            transcripts={transcripts}
            courseName={courseName}
            isConnected={isConnected}
            theme={theme}
            fontSize={fontSize}
            fontFamily={fontFamily}
          />,
          docPiP.pipWindow.document.body
        )}

        {/* Drawer de Configuración de Accesibilidad */}
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsSettingsOpen(false)}
            />
            
            {/* Panel */}
            <div className="relative w-full max-w-sm h-full bg-white shadow-2xl flex flex-col animate-slide-in-right">
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Ajustes de Lectura</h2>
                <button onClick={() => setIsSettingsOpen(false)} className="text-gray-400 hover:text-gray-700">
                  <ArrowLeft className="w-5 h-5 rotate-180" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8 text-gray-800">
                
                {/* Tamaño de texto */}
                <section>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Tamaño de Texto</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setFontSize('text-lg')}
                      className={`py-3 rounded-lg border font-medium transition ${fontSize === 'text-lg' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      A (Normal)
                    </button>
                    <button
                      onClick={() => setFontSize('text-2xl')}
                      className={`py-3 rounded-lg border font-medium text-lg transition ${fontSize === 'text-2xl' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      A (Grande)
                    </button>
                    <button
                      onClick={() => setFontSize('text-4xl')}
                      className={`py-3 rounded-lg border font-bold text-2xl transition ${fontSize === 'text-4xl' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      A (Max)
                    </button>
                  </div>
                </section>

                {/* Tema / Contraste */}
                <section>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Contraste visual</h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => setTheme('light')}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition ${theme === 'light' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <span className="font-medium text-gray-900">Claro (Predeterminado)</span>
                      <div className="w-6 h-6 rounded-full bg-white border border-gray-300"></div>
                    </button>
                    <button
                      onClick={() => setTheme('dark')}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition ${theme === 'dark' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <span className="font-medium text-gray-900">Oscuro</span>
                      <div className="w-6 h-6 rounded-full bg-gray-900 border border-gray-600"></div>
                    </button>
                    <button
                      onClick={() => setTheme('high-contrast')}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition ${theme === 'high-contrast' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <span className="font-medium text-gray-900">Alto Contraste</span>
                      <div className="w-6 h-6 rounded-full bg-black border-2 border-yellow-400"></div>
                    </button>
                  </div>
                </section>

                {/* Tipo de fuente */}
                <section>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Tipo de Letra</h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => setFontFamily('font-sans')}
                      className={`w-full px-4 py-3 text-left rounded-lg border font-sans font-medium transition ${fontFamily === 'font-sans' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}
                    >
                      Sans-serif (Limpia)
                    </button>
                    <button
                      onClick={() => setFontFamily('font-serif')}
                      className={`w-full px-4 py-3 text-left rounded-lg border font-serif font-medium transition ${fontFamily === 'font-serif' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}
                    >
                      Serif (Tradicional)
                    </button>
                    <button
                      onClick={() => setFontFamily('font-mono')}
                      className={`w-full px-4 py-3 text-left rounded-lg border font-mono font-medium transition ${fontFamily === 'font-mono' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-700 hover:border-gray-300'}`}
                    >
                      Monospaciada (Dislexia / Clara)
                    </button>
                  </div>
                </section>
              </div>
            </div>
          </div>
        )}

      </div>
    </StudentLayout>
  );
};

export default StudentLivePage;
