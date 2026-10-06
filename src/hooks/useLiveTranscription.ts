import { useState, useRef, useCallback } from 'react';
import { api } from '../services/api';

export interface TranscriptResult {
  text: string;
  isFinal: boolean;
  start: number;
  duration: number;
}

interface UseLiveTranscriptionProps {
  onFinalTranscript: (text: string, start: number, end: number) => void;
  onInterimTranscript: (text: string) => void;
}

export const useLiveTranscription = ({ onFinalTranscript, onInterimTranscript }: UseLiveTranscriptionProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    try {
      setError(null);

      const tokenResponse = await api
        .get<{ token?: string }>('/transcription/token')
        .catch((err: unknown) => {
          const message = (err as { response?: { data?: { message?: string } } })
            ?.response?.data?.message;
          throw new Error(message ?? 'No se pudo obtener el token temporal de transcripción.');
        });
      const ephemeralToken = tokenResponse.data.token?.trim();
      if (!ephemeralToken) {
        throw new Error('El servidor no devolvió un token temporal para la transcripción.');
      }

      // 1. Solicitar acceso al micrófono
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      // 2. Conectar a Deepgram vía WebSocket
      // Parámetros: español, formato inteligente, resultados parciales rápidos
      const deepgramUrl = 'wss://api.deepgram.com/v1/listen?model=nova-2&language=es&smart_format=true&interim_results=true';
      
      // Truco oficial de Deepgram para WebSockets en navegadores: enviar el token como subprotocolo
      const socket = new WebSocket(deepgramUrl, ['token', ephemeralToken]);
      socketRef.current = socket;

      socket.onopen = () => {
        setIsReady(true);
        console.log('[Deepgram] Conectado');
        
        // 3. Iniciar el MediaRecorder cuando Deepgram esté listo
        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.addEventListener('dataavailable', (event) => {
          if (event.data.size > 0 && socket.readyState === WebSocket.OPEN) {
            socket.send(event.data);
          }
        });

        // Enviar fragmentos cada 250ms para latencia baja
        mediaRecorder.start(250);
        setIsRecording(true);
      };

      socket.onmessage = (message) => {
        const received = JSON.parse(message.data);
        const transcript = received.channel?.alternatives[0]?.transcript;
        
        if (transcript && transcript.trim().length > 0) {
          const start = received.start;
          const duration = received.duration;
          const end = start + duration;
          const isFinal = received.is_final;

          if (isFinal) {
            onFinalTranscript(transcript, start, end);
          } else {
            onInterimTranscript(transcript);
          }
        }
      };

      socket.onclose = () => {
        setIsReady(false);
        console.log('[Deepgram] Desconectado');
        stopRecording();
      };

      socket.onerror = (err) => {
        console.error('[Deepgram] Error:', err);
        setError("Error en la conexión con Deepgram.");
      };

    } catch (err: unknown) {
      console.error(err);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      setError((err as Error).message || "Error al acceder al micrófono.");
      setIsRecording(false);
    }
  }, [onFinalTranscript, onInterimTranscript]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      // Enviar mensaje vacío de cierre a Deepgram (opcional pero recomendado)
      socketRef.current.send(JSON.stringify({ type: 'CloseStream' }));
      socketRef.current.close();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsRecording(false);
    setIsReady(false);
  }, []);

  return {
    isRecording,
    isReady,
    error,
    startRecording,
    stopRecording
  };
};
