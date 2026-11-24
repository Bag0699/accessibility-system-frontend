import { useEffect, useState, useCallback, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type { SessionPresenceResponse, TranscriptionMessageRequest } from '../types';

interface UseStompProps {
  sessionCode: string;
  onPresenceUpdate?: (connectedCount: number) => void;
}

export const useStomp = ({ sessionCode, onPresenceUpdate }: UseStompProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);
  const onPresenceUpdateRef = useRef(onPresenceUpdate);

  useEffect(() => {
    onPresenceUpdateRef.current = onPresenceUpdate;
  }, [onPresenceUpdate]);

  useEffect(() => {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws';
    const sockJsUrl = wsUrl.replace('ws://', 'http://').replace('wss://', 'https://').replace('/ws', '/ws-sockjs');

    const client = new Client({
      webSocketFactory: () => new SockJS(sockJsUrl),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        setIsConnected(true);
        console.log('[STOMP] Conectado exitosamente');

        if (sessionCode) {
          client.subscribe(`/topic/session/${sessionCode}/presence`, (message) => {
            if (!message.body) return;
            try {
              const payload: SessionPresenceResponse = JSON.parse(message.body);
              if (typeof payload.connectedCount === 'number') {
                onPresenceUpdateRef.current?.(payload.connectedCount);
              }
            } catch (err) {
              console.error('Error parseando presencia STOMP', err);
            }
          });
        }
      },
      onStompError: (frame) => {
        console.error('[STOMP] Error de Broker', frame.headers['message']);
        console.error('[STOMP] Detalles:', frame.body);
      },
      onWebSocketError: (event) => {
        console.error('[STOMP] Error de WebSocket', event);
      },
      onDisconnect: () => {
        setIsConnected(false);
        console.log('[STOMP] Desconectado');
      }
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
    };
  }, [sessionCode]);

  const sendTranscription = useCallback((text: string, startTime: number, endTime: number) => {
    if (!clientRef.current || !clientRef.current.connected) {
      console.warn('[STOMP] No conectado. No se pudo enviar el fragmento.');
      return;
    }

    const payload: TranscriptionMessageRequest = {
      text,
      startTime,
      endTime
    };

    clientRef.current.publish({
      destination: `/app/transcription/${sessionCode}`,
      body: JSON.stringify(payload),
    });
  }, [sessionCode]);

  return { isConnected, sendTranscription };
};
