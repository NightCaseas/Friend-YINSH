import { z } from 'zod';
import { GameState, PlayerColor, HexCoord } from '@/lib/yinsh';

// Типы для hot-seat игры
export type HotSeatPlayer = 'player1' | 'player2';

export interface HotSeatGameState {
  gameId: string;
  status: 'waiting' | 'active' | 'paused' | 'finished';
  currentPlayer: HotSeatPlayer;
  players: {
    player1: { name: string; color: PlayerColor; score: number };
    player2: { name: string; color: PlayerColor; score: number };
  };
  boardState: GameState;
  moveHistory: HotSeatMove[];
  createdAt: number;
  lastMoveAt: number;
  settings: {
    boardSize: number;
    timeControl?: {
      player1Time: number;
      player2Time: number;
    };
  };
}

export interface HotSeatMove {
  moveNumber: number;
  player: HotSeatPlayer;
  action: 'placeRing' | 'moveRing' | 'removeRow' | 'removeRing';
  position: { x: number; y: number };
  targetPosition?: { x: number; y: number };
  timestamp: number;
  notation: string;
}

export interface StoredHotSeatGame {
  version: '1.0';
  gameId: string;
  gameState: HotSeatGameState;
  exportFormat?: 'yinsh-standard' | 'pgn';
}

// Zod схемы для валидации GameState из lib/yinsh
const HexCoordSchema = z.object({
  q: z.number().int(),
  r: z.number().int(),
});

const RingPlacementSchema = z.object({
  color: z.enum(['white', 'black']),
  q: z.number().int(),
  r: z.number().int(),
});

const MarkerPlacementSchema = z.object({
  color: z.enum(['white', 'black']),
  q: z.number().int(),
  r: z.number().int(),
});

const GameStateSchema = z.object({
  phase: z.enum(['setup', 'playing', 'row-removal', 'ring-removal', 'finished']),
  turn: z.enum(['white', 'black']),
  rings: z.array(RingPlacementSchema),
  markers: z.array(MarkerPlacementSchema),
  whiteRingsCaptured: z.number().int().min(0).max(3),
  blackRingsCaptured: z.number().int().min(0).max(3),
  ringsPlaced: z.number().int().min(0).max(10),
  selectedRing: HexCoordSchema.nullable(),
  pendingRemovalRows: z.array(z.array(HexCoordSchema)),
  selectedRemovalRow: z.array(HexCoordSchema).nullable(),
});

// Zod схемы для валидации
export const HotSeatMoveSchema = z.object({
  moveNumber: z.number().int().positive(),
  player: z.enum(['player1', 'player2']),
  action: z.enum(['placeRing', 'moveRing', 'removeRow', 'removeRing']),
  position: z.object({
    x: z.number().int(),
    y: z.number().int(),
  }),
  targetPosition: z.object({
    x: z.number().int(),
    y: z.number().int(),
  }).optional(),
  timestamp: z.number().int().positive(),
  notation: z.string(),
});

export const HotSeatGameStateSchema = z.object({
  gameId: z.string().uuid(),
  status: z.enum(['waiting', 'active', 'paused', 'finished']),
  currentPlayer: z.enum(['player1', 'player2']),
  players: z.object({
    player1: z.object({
      name: z.string().min(1).max(50),
      color: z.enum(['white', 'black']),
      score: z.number().int().min(0).max(3),
    }),
    player2: z.object({
      name: z.string().min(1).max(50),
      color: z.enum(['white', 'black']),
      score: z.number().int().min(0).max(3),
    }),
  }),
  boardState: GameStateSchema,
  moveHistory: z.array(HotSeatMoveSchema),
  createdAt: z.number().int().positive(),
  lastMoveAt: z.number().int().positive(),
  settings: z.object({
    boardSize: z.number().int().min(1).max(10),
    timeControl: z.object({
      player1Time: z.number().int().positive(),
      player2Time: z.number().int().positive(),
    }).optional(),
  }),
});

export const StoredHotSeatGameSchema = z.object({
  version: z.literal('1.0'),
  gameId: z.string().uuid(),
  gameState: HotSeatGameStateSchema,
  exportFormat: z.enum(['yinsh-standard', 'pgn']).optional(),
});

// Вспомогательные типы
export interface StartHotSeatGameParams {
  player1Name: string;
  player2Name: string;
  boardSize?: number;
  timeControl?: boolean;
}

export interface HotSeatGameStarted {
  gameId: string;
  initialBoard: GameState;
}

export interface ExportHotSeatGameParams {
  gameId: string;
  format: 'analysis' | 'yinsh-standard' | 'pgn';
}

export interface ExportedGame {
  format: string;
  data: string;
  metadata: {
    players: string[];
    date: string;
    moveCount: number;
  };
}