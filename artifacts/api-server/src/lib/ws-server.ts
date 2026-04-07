import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage, Server } from "http";
import { db, gamesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { applyMove, createInitialState, type Move, type Player } from "./yinsh-logic.js";
import { logger } from "./logger.js";

interface RoomClient {
  ws: WebSocket;
  role: Player | null;
  roomId: string;
}

const rooms = new Map<string, Set<RoomClient>>();

function getClientsForRoom(roomId: string): Set<RoomClient> {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set());
  }
  return rooms.get(roomId)!;
}

function broadcast(roomId: string, message: object, except?: WebSocket): void {
  const clients = getClientsForRoom(roomId);
  const payload = JSON.stringify(message);
  for (const client of clients) {
    if (client.ws !== except && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(payload);
    }
  }
}

function sendTo(client: RoomClient, message: object): void {
  if (client.ws.readyState === WebSocket.OPEN) {
    client.ws.send(JSON.stringify(message));
  }
}

function assignRole(roomId: string): Player {
  const clients = getClientsForRoom(roomId);
  const existingRoles = new Set([...clients].map(c => c.role).filter(Boolean));
  if (!existingRoles.has("white")) return "white";
  if (!existingRoles.has("black")) return "black";
  return "white";
}

export function attachWebSocketServer(server: Server): void {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws: WebSocket, _req: IncomingMessage) => {
    let roomClient: RoomClient | null = null;

    ws.on("message", async (raw: Buffer | string) => {
      try {
        const msg = JSON.parse(raw.toString());

        if (msg.type === "join") {
          const { roomId } = msg;
          if (!roomId) return;

          const [game] = await db.select().from(gamesTable).where(eq(gamesTable.id, roomId));
          if (!game) {
            ws.send(JSON.stringify({ type: "error", message: "Room not found" }));
            return;
          }

          const role = assignRole(roomId);
          const client: RoomClient = { ws, role: role as Player, roomId };
          roomClient = client;
          getClientsForRoom(roomId).add(client);

          let gameState = game.gameState ? JSON.parse(game.gameState) : createInitialState();

          if (game.status === "waiting") {
            if (role === "black") {
              await db.update(gamesTable).set({ status: "playing" }).where(eq(gamesTable.id, roomId));
              broadcast(roomId, {
                type: "state",
                gameState,
                currentPlayer: gameState.currentPlayer,
                status: "playing",
                winner: null,
                playerRole: "white",
              }, ws);
            }
          }

          sendTo(client, {
            type: "state",
            gameState,
            currentPlayer: gameState.currentPlayer,
            status: role === "black" ? "playing" : game.status,
            winner: game.winner,
            playerRole: role,
          });

          logger.info({ roomId, role }, "Client joined room");
          return;
        }

        if (msg.type === "move") {
          if (!roomClient) return;
          const { roomId, move } = msg as { roomId: string; move: Move };

          const [game] = await db.select().from(gamesTable).where(eq(gamesTable.id, roomId));
          if (!game) return;

          let gameState = game.gameState ? JSON.parse(game.gameState) : createInitialState();

          const result = applyMove(gameState, move, roomClient.role as Player);

          if (result.error) {
            sendTo(roomClient, { type: "error", message: result.error });
            return;
          }

          const newState = result.state;
          const updates: Partial<typeof gamesTable.$inferSelect> = {
            gameState: JSON.stringify(newState),
            currentPlayer: newState.currentPlayer,
          };
          if (newState.winner) {
            updates.winner = newState.winner;
            updates.status = "finished";
          }

          await db.update(gamesTable).set(updates).where(eq(gamesTable.id, roomId));

          const stateMsg = {
            type: "state",
            gameState: newState,
            currentPlayer: newState.currentPlayer,
            status: newState.winner ? "finished" : "playing",
            winner: newState.winner,
          };

          broadcast(roomId, stateMsg);
          return;
        }
      } catch (err) {
        logger.error({ err }, "WebSocket message error");
      }
    });

    ws.on("close", () => {
      if (roomClient) {
        const clients = getClientsForRoom(roomClient.roomId);
        clients.delete(roomClient);
        logger.info({ roomId: roomClient.roomId, role: roomClient.role }, "Client left room");
      }
    });

    ws.on("error", (err) => {
      logger.error({ err }, "WebSocket error");
    });
  });

  logger.info("WebSocket server attached at /ws");
}
