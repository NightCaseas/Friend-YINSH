import { Router, type IRouter } from "express";
import { db, gamesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { createInitialState } from "../lib/yinsh-logic.js";
import { randomUUID } from "crypto";

const router: IRouter = Router();

router.post("/games", async (req, res): Promise<void> => {
  const id = randomUUID().slice(0, 8);
  const initialState = createInitialState();

  const [game] = await db.insert(gamesTable).values({
    id,
    status: "waiting",
    currentPlayer: "white",
    winner: null,
    gameState: JSON.stringify(initialState),
  }).returning();

  req.log.info({ gameId: id }, "Game created");
  res.status(201).json({
    id: game.id,
    status: game.status,
    createdAt: game.createdAt.toISOString(),
    currentPlayer: game.currentPlayer,
    winner: game.winner,
    gameState: game.gameState,
  });
});

router.get("/games/:roomId", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId;
  const roomId = raw;

  const [game] = await db.select().from(gamesTable).where(eq(gamesTable.id, roomId));

  if (!game) {
    res.status(404).json({ error: "Game not found" });
    return;
  }

  res.json({
    id: game.id,
    status: game.status,
    createdAt: game.createdAt.toISOString(),
    currentPlayer: game.currentPlayer,
    winner: game.winner,
    gameState: game.gameState,
  });
});

export default router;
