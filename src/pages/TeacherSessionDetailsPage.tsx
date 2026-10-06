import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Download, FileText, Loader2, Calendar } from 'lucide-react';
import jsPDF from 'jspdf';
import TeacherLayout from '../components/teacher/TeacherLayout';
import { transcriptionService } from '../services/transcriptionService';
import type { SessionResponse, TranscriptionResponse } from '../types';

const TeacherSessionDetailsPage = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  const [sessionInfo, setSessionInfo] = useState<SessionResponse | null>(null);
  const [transcripts, setTranscripts] = useState<TranscriptionResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Referencia invisible para pintar y exportar a PDF (si usáramos html2canvas),
  // pero usaremos el método addText de jsPDF para que sea texto real seleccionable.

  useEffect(() => {
    if (!code) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Obtener la información de la sesión desde el historial completo (para obviar la restricción de isActive=true)
        const allSessions = await transcriptionService.getAllTeacherSessions();
        const foundSession = allSessions.find((s) => s.code === code);
        
        if (!foundSession) {
          alert('No se encontró la sesión solicitada.');
          navigate('/teacher/history');
          return;
        }

        setSessionInfo(foundSession);

        // Obtener transcripciones
        const data = await transcriptionService.getSessionTranscriptions(code);
        setTranscripts(data);
      } catch (error) {
        console.error('Error al cargar detalle de sesión', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [code, navigate]);

  const filteredTranscripts = transcripts.filter(t => 
    t.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Función para formatear el timestamp a formato mm:ss
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleExportPDF = () => {
    if (!sessionInfo) return;

    const doc = new jsPDF();
    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    let cursorY = 20;

    // Título y Metadatos
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(`Transcripción de Clase`, margin, cursorY);
    
    cursorY += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Curso: ${sessionInfo.courseName}`, margin, cursorY);
    cursorY += 7;
    doc.text(`Código de Sesión: ${sessionInfo.code}`, margin, cursorY);
    cursorY += 7;
    const dateStr = new Date(sessionInfo.createdAt).toLocaleString();
    doc.text(`Fecha: ${dateStr}`, margin, cursorY);
    
    cursorY += 15;
    
    // Separador
    doc.setLineWidth(0.5);
    doc.line(margin, cursorY - 5, pageWidth - margin, cursorY - 5);

    doc.setFontSize(11);
    
    // Si no hay transcripciones
    if (transcripts.length === 0) {
      doc.text('No hubo transcripciones registradas en esta clase.', margin, cursorY + 10);
    } else {
      transcripts.forEach((t) => {
        const timeStr = `[${formatTime(t.startTime || 0)}]`;
        // Dividir el texto largo en líneas que quepan en la página
        const textLines = doc.splitTextToSize(`${timeStr} ${t.text}`, pageWidth - margin * 2);
        
        // Comprobar si necesitamos nueva página
        if (cursorY + (textLines.length * 5) > doc.internal.pageSize.getHeight() - 15) {
          doc.addPage();
          cursorY = 20; // reset cursor
        }
        
        doc.text(textLines, margin, cursorY);
        cursorY += textLines.length * 5 + 3; // +3 de espaciado entre párrafos
      });
    }

    doc.save(`Transcripcion_${sessionInfo.courseName.replace(/\s+/g, '_')}_${sessionInfo.code}.pdf`);
  };

  return (
    <TeacherLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header con botón regresar */}
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
          <button
            onClick={() => navigate('/teacher/history')}
            className="p-2 -ml-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isLoading ? 'Cargando...' : sessionInfo?.courseName}
            </h1>
            {!isLoading && sessionInfo && (
              <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(sessionInfo.createdAt).toLocaleDateString()}
                </span>
                <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                  {sessionInfo.code}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Controles: Buscador y PDF */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar en la transcripción..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <button
            onClick={handleExportPDF}
            disabled={isLoading || transcripts.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center"
          >
            <Download className="w-4 h-4" />
            Exportar PDF
          </button>
        </div>

        {/* Visor de Transcripción */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden min-h-[400px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
              <p className="text-gray-500">Cargando transcripción...</p>
            </div>
          ) : transcripts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center p-6">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 max-w-sm">No se generaron transcripciones durante esta sesión.</p>
            </div>
          ) : filteredTranscripts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center p-6">
              <Search className="w-12 h-12 text-gray-300 mb-4" />
              <p className="text-gray-500">No hay coincidencias para "{searchTerm}"</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto p-4 sm:p-6 space-y-4">
              {filteredTranscripts.map((t, idx) => (
                <div key={t.id || idx} className="flex gap-4 group">
                  {/* Timestamp col */}
                  <div className="shrink-0 pt-1">
                    <span className="text-xs font-mono font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded">
                      {formatTime(t.startTime || 0)}
                    </span>
                  </div>
                  {/* Text col */}
                  <div className="flex-1">
                    <p className="text-gray-800 leading-relaxed">
                      {searchTerm ? (
                        /* Highlight logic (simple case-insensitive split) */
                        t.text.split(new RegExp(`(${searchTerm})`, 'gi')).map((part, i) => 
                          part.toLowerCase() === searchTerm.toLowerCase() ? (
                            <mark key={i} className="bg-yellow-200 text-yellow-900 rounded px-1">{part}</mark>
                          ) : (
                            <span key={i}>{part}</span>
                          )
                        )
                      ) : (
                        t.text
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </TeacherLayout>
  );
};

export default TeacherSessionDetailsPage;
