# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Real-time**: WebSocket (`ws` library) for game state sync

## Artifacts

### FriendsYINSH (`artifacts/friendsyinsh`)
- React + Vite frontend at `/`
- Two-player YINSH strategy game
- No registration required — share a link to play
- WebSocket for real-time state synchronization

### API Server (`artifacts/api-server`)
- Express 5 backend at `/api`
- WebSocket server at `/ws`
- Handles game room creation, state persistence, and move relay
- Game logic: `src/lib/yinsh-logic.ts` (full YINSH rules)
- WebSocket server: `src/lib/ws-server.ts`

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Database Schema

- `games` table: id (text PK), status, currentPlayer, winner, gameState (JSON), timestamps

## Game Logic

YINSH rules implemented server-side in `yinsh-logic.ts`:
- Setup phase: alternating ring placement
- Playing phase: ring movement with marker flipping
- Row detection: 5-in-a-row markers detection
- Ring removal: remove row then ring for scoring
- Win condition: 3 captured rings
- Resign: instant win for opponent

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
