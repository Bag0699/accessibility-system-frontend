import jsPDF from 'jspdf';
import type { TranscriptionResponse } from '../types';

export interface ExportTranscriptionPdfOptions {
  courseName: string;
  code: string;
  metadataLines: string[];
  transcripts: TranscriptionResponse[];
  emptyMessage?: string;
}

/**
 * Formatea una marca de tiempo en segundos a formato mm:ss.
 */
export function formatTranscriptTime(seconds: number): string {
  const safeSeconds = Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
  const minutes = Math.floor(safeSeconds / 60).toString().padStart(2, '0');
  const remainingSeconds = Math.floor(safeSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainingSeconds}`;
}

function sanitizeFileSegment(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[\\/:*?"<>|]/g, '');
}

/**
 * Genera y descarga un archivo PDF con los metadatos y la transcripción de una sesión.
 */
export function exportTranscriptionPdf({
  courseName,
  code,
  metadataLines,
  transcripts,
  emptyMessage = 'No hubo transcripciones registradas en esta clase.',
}: ExportTranscriptionPdfOptions): void {
  const doc = new jsPDF();
  const margin = 15;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const maxContentWidth = pageWidth - margin * 2;
  let cursorY = 20;

  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Transcripción de Clase', margin, cursorY);

  cursorY += 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');

  for (const line of metadataLines) {
    const wrapped = doc.splitTextToSize(line, maxContentWidth) as string[];
    if (cursorY + wrapped.length * 6 > pageHeight - 20) {
      doc.addPage();
      cursorY = 20;
    }
    doc.text(wrapped, margin, cursorY);
    cursorY += wrapped.length * 6 + 1;
  }

  cursorY += 8;
  doc.setLineWidth(0.5);
  doc.line(margin, cursorY - 5, pageWidth - margin, cursorY - 5);

  doc.setFontSize(11);

  if (transcripts.length === 0) {
    doc.text(emptyMessage, margin, cursorY + 10);
  } else {
    for (const transcript of transcripts) {
      const timeStr = `[${formatTranscriptTime(transcript.startTime || 0)}]`;
      const textLines = doc.splitTextToSize(
        `${timeStr} ${transcript.text}`,
        maxContentWidth,
      ) as string[];

      if (cursorY + textLines.length * 5 > pageHeight - 15) {
        doc.addPage();
        cursorY = 20;
      }

      doc.text(textLines, margin, cursorY);
      cursorY += textLines.length * 5 + 3;
    }
  }

  const safeCourse = sanitizeFileSegment(courseName) || 'Clase';
  const safeCode = sanitizeFileSegment(code) || 'sesion';
  doc.save(`Transcripcion_${safeCourse}_${safeCode}.pdf`);
}
