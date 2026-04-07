import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage, Server } from "http";
import { db, gamesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { applyMove, createInitialState, type Move, type Player } from "./yinsh-logic.js";
import { logger } from "./logger.js";

interface RoomClient {
  ws: WebSocket;
  role: Player;
  roomId: string;
}

const rooms = new Map<string, Set<RoomClient>>();

function getClientsForRoom(roomId: string): Set<RoomClient> {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, new Set());
  }
  return rooms.get(roomId)!;
}

function broadcast(roomId: string, message: object): void {
  const clients = getClientsForRoom(roomId);
  const payload = JSON.stringify(message);
  for (const client of clients) {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(payload);
    }
  }
}

function sendTo(client: RoomClient, message: object): void {
  if (client.ws.readyState === WebSocket.OPEN) {
    client.ws.send(JSON.stringify(message));
  }
}

export function attachWebSocketServer(server: Server): void {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws: WebSocket, _req: IncomingMessage) => {
    let roomClient: RoomClient | null = null;

    ws.on("message", async (raw: Buffer | string) => {
      try {
        const msg = JSON.parse(raw.toString());

        if (msg.type === "join") {
          const { roomId, color } = msg as { roomId: string; color: string };
          if (!roomId || (color !== "white" && color !== "black")) return;

          const [game] = await db.select().from(gamesTable).where(eq(gamesTable.id, roomId));
          if (!game) {
            ws.send(JSON.stringify({ type: "error", message: "Room not found" }));
            return;
          }

          const clients = getClientsForRoom(roomId);
          const colorTaken = [...clients].some(c => c.role === color);
          if (colorTaken) {
            ws.send(JSON.stringify({ type: "error", message: "This color is already in use" }));
            return;
          }

          const client: RoomClient = { ws, role: color as Player, roomId };
          roomClient = client;
          clients.add(client);

          const gameState = game.gameState ? JSON.parse(game.gameState) : createInitialState();

          const presentRoles = new Set([...clients].map(c => c.role));
          const bothPresent = presentRoles.has("white") && presentRoles.has("black");

          if (bothPresent && game.status === "waiting") {
            await db.update(gamesTable).set({ status: "playing" }).where(eq(gamesTable.id, roomId));
            broadcast(roomId, {
              type: "state",
              gameState,
              currentPlayer: gameState.currentPlayer,
              status: "playing",
              winner: null,
            });
          } else {
            sendTo(client, {
              type: "state",
              gameState,
              currentPlayer: gameState.currentPlayer,
              status: game.status,
              winner: game.winner ?? null,
            });
          }

          logger.info({ roomId, role: color }, "Client joined room");
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

          broadcast(roomId, {
            type: "state",
            gameState: newState,
            currentPlayer: newState.currentPlayer,
            status: newState.winner ? "finished" : "playing",
            winner: newState.winner ?? null,
          });
          return;
        }

        if (msg.type === "resign") {
          if (!roomClient) return;
          const { roomId } = msg as { roomId: string };

          const opponentColor: Player = roomClient.role === "white" ? "black" : "white";
          await db.update(gamesTable)
            .set({ status: "finished", winner: opponentColor })
            .where(eq(gamesTable.id, roomId));

          broadcast(roomId, {
            type: "state",
            gameState: null,
            currentPlayer: opponentColor,
            status: "finished",
            winner: opponentColor,
          });
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
