import { useState, useEffect, useCallback, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { useGetGame } from "@workspace/api-client-react";
import YinshBoard from "@/components/YinshBoard";
import { useWebSocket } from "@/lib/websocket";
import {
  createInitialState,
  findRows,
  getEntityAt,
  isValidCell,
  type GameState,
  type HexCoord,
  type PlayerColor,
} from "@/lib/yinsh";
import { useToast } from "@/hooks/use-toast";

type Phase = "setup" | "playing" | "row-removal" | "ring-removal" | "finished";

interface ServerGameState {
  phase: Phase;
  board?: Record<string, { type: string; player?: string }>;
  currentPlayer: PlayerColor;
  ringsPlaced?: { white: number; black: number };
  ringsOnBoard?: { white: number; black: number };
  ringsCaptured?: { white: number; black: number };
  pendingRows?: HexCoord[][];
  pendingRowPlayer?: PlayerColor | null;
  winner?: PlayerColor | null;
}

function serverStateToClientState(ss: ServerGameState): GameState {
  const rings: { color: PlayerColor; q: number; r: number }[] = [];
  const markers: { color: PlayerColor; q: number; r: number }[] = [];

  if (ss.board) {
    for (const [key, cell] of Object.entries(ss.board)) {
      if (!cell || cell.type === "empty") continue;
      const [q, r] = key.split(",").map(Number);
      if (cell.type === "ring" && cell.player) {
        rings.push({ color: cell.player as PlayerColor, q, r });
      } else if (cell.type === "marker" && cell.player) {
        markers.push({ color: cell.player as PlayerColor, q, r });
      }
    }
  }

  return {
    phase: ss.phase === "row-removal" ? "rowRemovalRing" : ss.phase === "ring-removal" ? "rowRemovalRing" : ss.phase as "setup" | "playing" | "rowRemovalRing" | "rowRemovalMarkers" | "finished",
    turn: ss.currentPlayer,
    rings,
    markers,
    whiteRingsCaptured: ss.ringsCaptured?.white ?? 0,
    blackRingsCaptured: ss.ringsCaptured?.black ?? 0,
    ringsPlaced: (ss.ringsPlaced?.white ?? 0) + (ss.ringsPlaced?.black ?? 0),
    selectedRing: null,
    pendingRemovalRows: ss.pendingRows ?? [],
    selectedRemovalRow: null,
  };
}

export default function Game() {
  const [, params] = useRoute("/game/:roomId");
  const [, setLocation] = useLocation();
  const roomId = params?.roomId ?? "";
  const { toast } = useToast();

  const [gameState, setGameState] = useState<GameState>(createInitialState());
  const [serverPhase, setServerPhase] = useState<string>("setup");
  const [serverPendingRows, setServerPendingRows] = useState<HexCoord[][]>([]);
  const [serverPendingRowPlayer, setServerPendingRowPlayer] = useState<PlayerColor | null>(null);
  const [myColor, setMyColor] = useState<PlayerColor | null>(null);
  const [roomStatus, setRoomStatus] = useState<"waiting" | "playing" | "finished">("waiting");
  const [winner, setWinner] = useState<PlayerColor | null>(null);
  const [highlightRow, setHighlightRow] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const wsRef = useRef<{ send: (d: unknown) => void } | null>(null);
  const joinedRef = useRef(false);

  const { data: gameData } = useGetGame(roomId, {
    query: { enabled: !!roomId },
  });

  const wsUrl = (() => {
    if (typeof window === "undefined") return "";
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${proto}//${window.location.host}/ws`;
  })();

  const handleMessage = useCallback(
    (data: unknown) => {
      const msg = data as {
        type: string;
        gameState?: ServerGameState;
        currentPlayer?: PlayerColor;
        status?: string;
        winner?: PlayerColor | null;
        playerRole?: PlayerColor;
        message?: string;
      };

      if (msg.type === "state") {
        if (msg.playerRole && !myColor) {
          setMyColor(msg.playerRole);
        }
        if (msg.status) setRoomStatus(msg.status as "waiting" | "playing" | "finished");
        if (msg.winner !== undefined) setWinner(msg.winner ?? null);

        if (msg.gameState) {
          const gs = msg.gameState;
          setServerPhase(gs.phase);
          setServerPendingRows(gs.pendingRows ?? []);
          setServerPendingRowPlayer(gs.pendingRowPlayer ?? null);
          const clientState = serverStateToClientState(gs);
          setGameState(clientState);
        }
      }

      if (msg.type === "error") {
        toast({ title: "Error", description: msg.message ?? "Unknown error", variant: "destructive" });
      }
    },
    [myColor, toast]
  );

  const { send, state: wsState } = useWebSocket(wsUrl, handleMessage);
  wsRef.current = { send };

  useEffect(() => {
    if (wsState === "connected" && roomId && !joinedRef.current) {
      joinedRef.current = true;
      send({ type: "join", roomId });
    }
  }, [wsState, roomId, send]);

  function sendMove(move: object) {
    wsRef.current?.send({ type: "move", roomId, move });
  }

  function handleCellClick(q: number, r: number) {
    if (!myColor) return;
    if (roomStatus !== "playing") return;

    const isMyTurn = gameState.turn === myColor;

    if (serverPhase === "setup") {
      if (!isMyTurn) return;
      const entity = getEntityAt(gameState, q, r);
      if (entity.type !== "none") return;
      sendMove({ type: "place-ring", q, r });
      return;
    }

    if (serverPhase === "playing") {
      if (!isMyTurn) return;
      const entity = getEntityAt(gameState, q, r);

      if (!gameState.selectedRing) {
        if (entity.type === "ring" && entity.color === myColor) {
          setGameState((prev) => ({ ...prev, selectedRing: { q, r } }));
        }
        return;
      }

      const sel = gameState.selectedRing;
      if (q === sel.q && r === sel.r) {
        setGameState((prev) => ({ ...prev, selectedRing: null }));
        return;
      }

      if (entity.type === "ring" && entity.color === myColor) {
        setGameState((prev) => ({ ...prev, selectedRing: { q, r } }));
        return;
      }

      sendMove({ type: "move-ring", fromQ: sel.q, fromR: sel.r, toQ: q, toR: r });
      setGameState((prev) => ({ ...prev, selectedRing: null }));
      return;
    }

    if (serverPhase === "row-removal") {
      if (serverPendingRowPlayer !== myColor) return;

      if (serverPendingRows.length === 1) {
        setHighlightRow(0);
        sendMove({ type: "remove-row", rowIndex: 0 });
        setHighlightRow(null);
        return;
      }

      const clickedRowIndex = serverPendingRows.findIndex((row) =>
        row.some((c) => c.q === q && c.r === r)
      );
      if (clickedRowIndex >= 0) {
        setHighlightRow(clickedRowIndex);
        sendMove({ type: "remove-row", rowIndex: clickedRowIndex });
        setHighlightRow(null);
      }
      return;
    }

    if (serverPhase === "ring-removal") {
      if (serverPendingRowPlayer !== myColor) return;
      const entity = getEntityAt(gameState, q, r);
      if (entity.type === "ring" && entity.color === myColor) {
        sendMove({ type: "remove-ring", q, r });
      }
      return;
    }
  }

  function handleResign() {
    sendMove({ type: "resign" });
  }

  async function handleCopyLink() {
    const url = window.location.href;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const isMyTurn = myColor !== null && gameState.turn === myColor;
  const whiteRingsCaptured = gameState.whiteRingsCaptured;
  const blackRingsCaptured = gameState.blackRingsCaptured;

  function getStatusText(): string {
    if (roomStatus === "finished" || serverPhase === "finished") {
      return winner ? `${winner === "white" ? "White" : "Black"} wins!` : "Game over";
    }
    if (roomStatus === "waiting") return "Waiting for opponent...";
    if (!myColor) return "Connecting...";

    if (serverPhase === "setup") {
      const total = gameState.ringsPlaced;
      return isMyTurn
        ? `Place your ring (${10 - total} left total)`
        : "Opponent is placing a ring...";
    }
    if (serverPhase === "row-removal") {
      if (serverPendingRowPlayer === myColor) {
        return serverPendingRows.length > 1
          ? "Click a row to remove 5 markers"
          : "Removing your 5-marker row...";
      }
      return "Opponent is removing a row...";
    }
    if (serverPhase === "ring-removal") {
      if (serverPendingRowPlayer === myColor) {
        return "Click one of your rings to remove it";
      }
      return "Opponent is removing a ring...";
    }
    return isMyTurn ? "Your turn" : "Opponent's turn";
  }

  const myRingsCaptured = myColor === "white" ? whiteRingsCaptured : blackRingsCaptured;
  const opRingsCaptured = myColor === "white" ? blackRingsCaptured : whiteRingsCaptured;

  if (!roomId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Invalid room.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <button
          onClick={() => setLocation("/")}
          className="text-lg font-serif font-semibold"
          style={{ color: "hsl(38, 92%, 55%)" }}
          data-testid="link-home"
        >
          YINSH
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyLink}
            data-testid="button-copy-link"
            className="px-4 py-2 rounded-md text-sm border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
          >
            {copied ? "Copied!" : "Copy link"}
          </button>
          {roomStatus === "playing" && serverPhase !== "finished" && (
            <button
              onClick={handleResign}
              data-testid="button-resign"
              className="px-4 py-2 rounded-md text-sm border border-destructive/40 text-destructive hover:bg-destructive/10 transition-colors"
            >
              Resign
            </button>
          )}
        </div>
      </header>

      {/* Main layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Sidebar */}
        <aside className="lg:w-64 flex-shrink-0 border-b lg:border-b-0 lg:border-r border-border p-5 space-y-6">
          {/* Status */}
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-medium">
              Status
            </div>
            <div
              data-testid="text-status"
              className="text-sm font-medium leading-relaxed"
              style={{
                color:
                  serverPhase === "finished" || roomStatus === "finished"
                    ? "hsl(38, 92%, 55%)"
                    : isMyTurn && roomStatus === "playing"
                    ? "hsl(38, 92%, 55%)"
                    : "hsl(220, 15%, 88%)",
              }}
            >
              {getStatusText()}
            </div>
          </div>

          {/* Role */}
          {myColor && (
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-medium">
                You play
              </div>
              <div className="flex items-center gap-2" data-testid="text-my-color">
                <div
                  className="w-5 h-5 rounded-full border-2"
                  style={{
                    backgroundColor:
                      myColor === "white" ? "rgba(240,240,245,0.9)" : "rgba(20,25,40,0.9)",
                    borderColor:
                      myColor === "white" ? "rgba(255,255,255,0.7)" : "rgba(130,145,175,0.7)",
                  }}
                />
                <span className="text-sm font-medium capitalize">{myColor}</span>
              </div>
            </div>
          )}

          {/* Score */}
          {myColor && (
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-3 font-medium">
                Rings captured
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between" data-testid="score-you">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full border-[1.5px]"
                      style={{
                        backgroundColor:
                          myColor === "white" ? "rgba(240,240,245,0.15)" : "rgba(20,25,40,0.15)",
                        borderColor:
                          myColor === "white" ? "rgba(235,235,245,0.9)" : "rgba(130,145,175,0.85)",
                      }}
                    />
                    <span className="text-sm text-muted-foreground">You</span>
                  </div>
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-3 h-3 rounded-full border"
                        style={{
                          backgroundColor:
                            i < myRingsCaptured
                              ? "hsl(38, 92%, 55%)"
                              : "transparent",
                          borderColor:
                            i < myRingsCaptured
                              ? "hsl(38, 92%, 55%)"
                              : "rgba(255,255,255,0.2)",
                        }}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between" data-testid="score-opponent">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full border-[1.5px]"
                      style={{
                        backgroundColor:
                          myColor !== "white" ? "rgba(240,240,245,0.15)" : "rgba(20,25,40,0.15)",
                        borderColor:
                          myColor !== "white" ? "rgba(235,235,245,0.9)" : "rgba(130,145,175,0.85)",
                      }}
                    />
                    <span className="text-sm text-muted-foreground">Opponent</span>
                  </div>
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-3 h-3 rounded-full border"
                        style={{
                          backgroundColor:
                            i < opRingsCaptured
                              ? "hsl(38, 92%, 55%)"
                              : "transparent",
                          borderColor:
                            i < opRingsCaptured
                              ? "hsl(38, 92%, 55%)"
                              : "rgba(255,255,255,0.2)",
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Phase indicator */}
          {roomStatus === "playing" && (
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-medium">
                Phase
              </div>
              <div className="text-sm capitalize text-foreground/80" data-testid="text-phase">
                {serverPhase === "setup"
                  ? "Ring placement"
                  : serverPhase === "playing"
                  ? "Game"
                  : serverPhase === "row-removal"
                  ? "Remove row"
                  : serverPhase === "ring-removal"
                  ? "Remove ring"
                  : serverPhase}
              </div>
            </div>
          )}
        </aside>

        {/* Board area */}
        <main className="flex-1 flex items-center justify-center p-4 overflow-hidden relative">
          {/* Waiting overlay */}
          {roomStatus === "waiting" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10"
              style={{ backgroundColor: "rgba(14, 18, 26, 0.92)" }}>
              <div className="text-center space-y-5 max-w-sm mx-auto px-6">
                <div
                  className="text-2xl font-serif font-semibold"
                  style={{ color: "hsl(38, 92%, 55%)" }}
                >
                  Waiting for opponent
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Share this link with your friend to start the game.
                </p>
                <div className="rounded-lg border border-border p-3 text-sm text-muted-foreground font-mono break-all select-all">
                  {typeof window !== "undefined" ? window.location.href : ""}
                </div>
                <button
                  onClick={handleCopyLink}
                  data-testid="button-copy-link-waiting"
                  className="w-full py-3 px-6 rounded-lg text-sm font-semibold transition-all"
                  style={{
                    backgroundColor: "hsl(38, 92%, 55%)",
                    color: "hsl(220, 25%, 8%)",
                  }}
                >
                  {copied ? "Copied!" : "Copy link"}
                </button>
              </div>
            </div>
          )}

          {/* Winner overlay */}
          {(serverPhase === "finished" || roomStatus === "finished") && winner && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center z-10"
              style={{ backgroundColor: "rgba(14, 18, 26, 0.93)" }}
            >
              <div className="text-center space-y-5 max-w-sm mx-auto px-6">
                <div
                  className="text-3xl font-serif font-semibold"
                  style={{ color: "hsl(38, 92%, 55%)" }}
                  data-testid="text-winner"
                >
                  {winner === myColor ? "You win!" : "Opponent wins"}
                </div>
                <p className="text-muted-foreground text-sm">
                  {winner === "white" ? "White" : "Black"} captured 3 rings.
                </p>
                <button
                  onClick={() => setLocation("/")}
                  className="w-full py-3 px-6 rounded-lg text-sm font-semibold"
                  style={{
                    backgroundColor: "hsl(38, 92%, 55%)",
                    color: "hsl(220, 25%, 8%)",
                  }}
                  data-testid="button-new-game"
                >
                  New game
                </button>
              </div>
            </div>
          )}

          {/* Board */}
          <div className="w-full h-full" style={{ maxWidth: "600px", maxHeight: "600px" }}>
            <YinshBoard
              state={gameState}
              myColor={myColor}
              onCellClick={handleCellClick}
              pendingRows={serverPendingRows}
              highlightRow={highlightRow}
            />
          </div>
        </main>
      </div>

      {/* Connection status */}
      {wsState !== "connected" && (
        <div className="fixed bottom-4 right-4 px-3 py-2 rounded-md text-xs"
          style={{ backgroundColor: "hsl(220, 22%, 13%)", color: "hsl(220, 15%, 55%)", border: "1px solid hsl(220, 20%, 18%)" }}
          data-testid="text-ws-status">
          {wsState === "connecting" ? "Connecting..." : wsState === "disconnected" ? "Disconnected" : "Connection error"}
        </div>
      )}
    </div>
  );
}
