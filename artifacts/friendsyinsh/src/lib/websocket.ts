import { useEffect, useRef, useState, useCallback } from "react";

export type WebSocketState = "connecting" | "connected" | "disconnected" | "error";

export function useWebSocket(url: string, onMessage: (data: any) => void) {
  const [state, setState] = useState<WebSocketState>("connecting");
  const ws = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    if (ws.current) {
      ws.current.close();
    }
    
    setState("connecting");
    const socket = new WebSocket(url);
    ws.current = socket;

    socket.onopen = () => {
      setState("connected");
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (err) {
        console.error("Failed to parse ws message", err);
      }
    };

    socket.onclose = () => {
      setState("disconnected");
    };

    socket.onerror = () => {
      setState("error");
    };
  }, [url, onMessage]);

  useEffect(() => {
    connect();
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connect]);

  const send = useCallback((data: any) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(data));
    } else {
      console.warn("Cannot send message, WebSocket not open.");
    }
  }, []);

  return { state, send, reconnect: connect };
}
