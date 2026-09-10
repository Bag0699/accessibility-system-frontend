import { useEffect, useState, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type { TranscriptionResponse } from '../types';

interface UseStompSubscriptionProps {
  sessionCode: string;
  onNewTranscript?: (transcript: TranscriptionResponse) => void;
}

export const useStompSubscription = ({ sessionCode, onNewTranscript }: UseStompSubscriptionProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);

  const onNewTranscriptRef = useRef(onNewTranscript);

  // Mantener la referencia actualizada sin causar re-renders
  useEffect(() => {
    onNewTranscriptRef.current = onNewTranscript;
  }, [onNewTranscript]);

  useEffect(() => {
    if (!sessionCode) return;

    // Convertir ws://localhost:8080/ws a http://localhost:8080/ws-sockjs
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws';
    const sockJsUrl = wsUrl.replace('ws://', 'http://').replace('wss://', 'https://').replace('/ws', '/ws-sockjs');

    const client = new Client({
      webSocketFactory: () => new SockJS(sockJsUrl),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        setIsConnected(true);
        console.log(`[STOMP] Suscrito a /topic/session/${sessionCode}`);
        
        // Suscribirse al canal público de la sesión
        client.subscribe(`/topic/session/${sessionCode}`, (message) => {
          if (message.body) {
            try {
              const newTranscript: TranscriptionResponse = JSON.parse(message.body);
              if (onNewTranscriptRef.current) {
                onNewTranscriptRef.current(newTranscript);
              }
            } catch (err) {
              console.error('Error parseando mensaje STOMP', err);
            }
          }
        });
      },
      onStompError: (frame) => {
        console.error('[STOMP] Error de Broker', frame.headers['message']);
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

  return { isConnected };
};
