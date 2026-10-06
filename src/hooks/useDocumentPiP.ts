import { useState, useCallback, useEffect } from 'react';

// Declaración de tipos para la API moderna Document Picture-in-Picture
declare global {
  interface Window {
    documentPictureInPicture?: {
      requestWindow(options?: { width?: number; height?: number; disallowReturnToOpener?: boolean }): Promise<Window>;
      window: Window | null;
    };
  }
}

export const useDocumentPiP = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [pipWindow, setPipWindow] = useState<Window | null>(null);

  useEffect(() => {
    // Si es Firefox, forzar false para que use el Canvas PiP nativo de video,
    // ignorando polyfills o implementaciones experimentales de Document PiP.
    const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');
    if (!isFirefox && 'documentPictureInPicture' in window) {
      setIsSupported(true);
    }
  }, []);

  const openPiP = useCallback(async (width = 680, height = 200) => {
    if (!isSupported || !window.documentPictureInPicture) return;

    try {
      // Solicitar ventana PiP con dimensiones tipo "barra de subtítulos"
      const pip = await window.documentPictureInPicture.requestWindow({
        width,
        height,
      });

      // Copiar TODOS los estilos: <link> de hojas externas y <style> inline
      // Usar cloneNode(true) garantiza que se copie el contenido completo
      Array.from(document.head.querySelectorAll('style, link[rel="stylesheet"]')).forEach(
        (node) => pip.document.head.appendChild(node.cloneNode(true))
      );

      // Configurar el <html> y <body> para que ocupen exactamente la ventana
      pip.document.documentElement.style.cssText = 'height:100%;margin:0;padding:0;overflow:hidden;';
      pip.document.body.style.cssText = 'height:100%;margin:0;padding:0;overflow:hidden;display:flex;flex-direction:column;';
      pip.document.title = 'Subtítulos en Vivo';

      // Sincronizar el estado cuando el usuario cierra la ventana PiP manualmente
      pip.addEventListener('pagehide', () => {
        setPipWindow(null);
      });

      setPipWindow(pip);
    } catch (error) {
      console.error('Error al abrir la ventana PiP:', error);
    }
  }, [isSupported]);

  const closePiP = useCallback(() => {
    if (pipWindow) {
      pipWindow.close();
      setPipWindow(null);
    }
  }, [pipWindow]);

  return {
    isSupported,
    isPiPOpen: !!pipWindow,
    pipWindow,
    openPiP,
    closePiP,
  };
};
