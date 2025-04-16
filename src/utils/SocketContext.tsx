import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { API_URL } from "../config/api";

const SocketContext = createContext<Socket | null>(null);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const socketRef = useRef<Socket | null>(null);
  const [_isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Determina se estamos em produção (HTTPS)
    const isProduction = window.location.protocol === 'https:';
    
    // Ajusta a URL do socket baseado no ambiente
    const socketUrl = isProduction 
      ? API_URL.replace('http://', 'https://').replace('/api/v1', '')
      : API_URL.replace('/api/v1', '');

    // Cria uma nova instância do socket
    socketRef.current = io(socketUrl, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      secure: isProduction, // Força HTTPS em produção
      transports: ['websocket', 'polling'],
    });

    // Eventos do socket
    socketRef.current.on("connect", () => {
      console.log("🔌 Socket conectado");
      setIsConnected(true);
    });

    socketRef.current.on("disconnect", () => {
      console.log("🔌 Socket desconectado");
      setIsConnected(false);
    });

    socketRef.current.on("reconnect", (attemptNumber) => {
      console.log(`🔌 Socket reconectado após ${attemptNumber} tentativas`);
      setIsConnected(true);
    });

    socketRef.current.on("reconnect_error", (error) => {
      console.error("❌ Erro na reconexão:", error);
    });

    socketRef.current.on("reconnect_failed", () => {
      console.error("❌ Falha na reconexão após todas as tentativas");
    });

    // Limpeza ao desmontar
    return () => {
      if (socketRef.current) {
        socketRef.current.off("connect");
        socketRef.current.off("disconnect");
        socketRef.current.off("reconnect");
        socketRef.current.off("reconnect_error");
        socketRef.current.off("reconnect_failed");
        socketRef.current.disconnect();
      }
    };
  }, []);

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const socket = useContext(SocketContext);
  if (!socket) {
    throw new Error("useSocket deve ser usado dentro de um SocketProvider");
  }
  return socket;
};
