import { useState, useEffect, useRef, useCallback } from 'react';
import type { TranscriptionResponse } from '../types';

type Theme = 'light' | 'dark' | 'high-contrast';
type FontSize = 'text-lg' | 'text-2xl' | 'text-4xl';
type FontFamily = 'font-sans' | 'font-serif' | 'font-mono';

interface UseCanvasPiPProps {
  transcripts: TranscriptionResponse[];
  courseName: string;
  isConnected: boolean;
  theme: Theme;
  fontSize: FontSize;
  fontFamily: FontFamily;
}

export const useCanvasPiP = ({
  transcripts,
  courseName,
  isConnected,
  theme,
  fontSize,
  fontFamily,
}: UseCanvasPiPProps) => {
  const [isSupported, setIsSupported] = useState(false);
  const [isPiPOpen, setIsPiPOpen] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Inicializar elementos ocultos en memoria
  useEffect(() => {
    const video = document.createElement('video');
    
    // Verificar soporte de Video Picture-in-Picture
    if ('requestPictureInPicture' in video) {
      setIsSupported(true);
    }

    const canvas = document.createElement('canvas');
    // Resolución típica de barra de subtítulos
    canvas.width = 800;
    canvas.height = 200;
    
    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;
    video.controls = false; // Intentar sugerir al navegador que no ponga controles

    canvasRef.current = canvas;
    videoRef.current = video;

    const handleLeavePiP = () => setIsPiPOpen(false);
    video.addEventListener('leavepictureinpicture', handleLeavePiP);

    return () => {
      video.removeEventListener('leavepictureinpicture', handleLeavePiP);
      if (document.pictureInPictureElement === video) {
        if (typeof document.exitPictureInPicture === 'function') {
          document.exitPictureInPicture().catch(console.error);
        }
      }
      if (document.body.contains(video)) {
        document.body.removeChild(video);
      }
    };
  }, []);

  // Motor de Renderizado en Canvas (se ejecuta cuando cambian los datos o estilos)
  useEffect(() => {
    if (!isPiPOpen || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Limpiar y Fondo
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = theme === 'high-contrast' ? '#000000' : 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Barra de estado superior (Minimalista)
    ctx.fillStyle = theme === 'high-contrast' ? '#111' : 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, 30);
    
    // Indicador de conexión y curso
    ctx.fillStyle = isConnected ? '#22c55e' : '#ef4444';
    ctx.beginPath();
    ctx.arc(20, 15, 4, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.fillStyle = theme === 'high-contrast' ? '#facc15' : '#ffffff';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${courseName} (Canvas PiP)`, 32, 15);

    // 3. Configurar tipografía para los subtítulos
    const sizeMap = { 'text-lg': 22, 'text-2xl': 28, 'text-4xl': 38 };
    const fontMap = { 
      'font-sans': 'sans-serif', 
      'font-serif': 'serif', 
      'font-mono': 'monospace' 
    };
    
    const currentSize = sizeMap[fontSize];
    ctx.font = `bold ${currentSize}px ${fontMap[fontFamily]}`;
    ctx.textAlign = 'center';
    
    // Configurar color y sombra para máxima legibilidad
    ctx.fillStyle = theme === 'high-contrast' ? '#facc15' : '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;

    // 4. Dibujar los últimos subtítulos
    const recentLines = transcripts.slice(-2); // En canvas es mejor mostrar poco
    
    if (recentLines.length === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.shadowColor = 'transparent';
      ctx.fillText('Esperando subtítulos...', canvas.width / 2, canvas.height / 2 + 10);
      return;
    }

    // Helper para auto-wrap del texto en el lienzo
    const wrapText = (text: string, maxWidth: number): string[] => {
      const words = text.split(' ');
      const lines = [];
      let currentLine = words[0];

      for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = ctx.measureText(currentLine + ' ' + word).width;
        if (width < maxWidth) {
          currentLine += ' ' + word;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }
      lines.push(currentLine);
      return lines;
    };

    let cursorY = canvas.height - 20; // Empezar desde abajo hacia arriba
    const maxWidth = canvas.width - 60;

    // Dibujar en orden inverso (de abajo hacia arriba)
    for (let i = recentLines.length - 1; i >= 0; i--) {
      const lines = wrapText(recentLines[i].text, maxWidth).reverse();
      
      // Aplicar opacidad si no es la línea más reciente
      if (i < recentLines.length - 1) {
        ctx.fillStyle = theme === 'high-contrast' ? 'rgba(250,204,21,0.5)' : 'rgba(255,255,255,0.5)';
      }

      for (const line of lines) {
        ctx.fillText(line, canvas.width / 2, cursorY);
        cursorY -= (currentSize * 1.4); // Salto de línea
      }
      cursorY -= 10; // Espaciado extra entre fragmentos
    }

  }, [transcripts, theme, fontSize, fontFamily, isPiPOpen, courseName, isConnected]);

  const openPiP = useCallback(async () => {
    if (!isSupported || !canvasRef.current || !videoRef.current) return;

    try {
      // 0. Firefox exige que el <video> esté en el DOM para poder invocar requestPictureInPicture.
      if (!document.body.contains(videoRef.current)) {
        videoRef.current.style.position = 'fixed';
        videoRef.current.style.top = '0';
        videoRef.current.style.opacity = '0';
        videoRef.current.style.pointerEvents = 'none';
        document.body.appendChild(videoRef.current);
      }

      // 1. Forzar un pintado inicial. Si el canvas está vacío, captureStream no emite frames,
      // lo que causa que video.play() se quede esperando infinitamente (deadlock).
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }

      // 2. Capturar el lienzo como un MediaStream (flujo en vivo a 25fps)
      const stream = canvasRef.current.captureStream(25);
      
      // 3. Conectar stream al video y reproducir
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      
      // 4. Solicitar PiP al navegador
      await videoRef.current.requestPictureInPicture();
      setIsPiPOpen(true);
    } catch (error) {
      console.error('Error al abrir Canvas PiP en Firefox:', error);
    }
  }, [isSupported]);

  const closePiP = useCallback(() => {
    if (document.pictureInPictureElement === videoRef.current) {
      document.exitPictureInPicture().catch(console.error);
    }
    setIsPiPOpen(false);
  }, []);

  return {
    isSupported,
    isPiPOpen,
    openPiP,
    closePiP,
  };
};
