import { useEffect, useRef, useState, useCallback } from "react";

export type WebSocketState = "connecting" | "connected" | "disconnected" | "error";

export function useWebSocket(url: string, onMessage: (data: unknown) => void) {
  const [state, setState] = useState<WebSocketState>("connecting");
  const ws = useRef<WebSocket | null>(null);
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  });

  useEffect(() => {
    if (!url) return;

    setState("connecting");
    const socket = new WebSocket(url);
    ws.current = socket;

    socket.onopen = () => {
      setState("connected");
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessageRef.current(data);
      } catch {
        // ignore parse errors
      }
    };

    socket.onclose = () => {
      setState("disconnected");
    };

    socket.onerror = () => {
      setState("error");
    };

    return () => {
      socket.close();
    };
  }, [url]);

  const send = useCallback((data: unknown) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(data));
    }
  }, []);

  return { state, send };
}
