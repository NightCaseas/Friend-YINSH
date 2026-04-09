export type PlayerColor = "white" | "black";
export type RingPlacement = { color: PlayerColor; q: number; r: number };
export type MarkerPlacement = { color: PlayerColor; q: number; r: number };
export type HexCoord = { q: number; r: number };

export type GamePhase = "setup" | "playing" | "row-removal" | "ring-removal" | "finished";

export interface GameState {
  phase: GamePhase;
  turn: PlayerColor;
  rings: RingPlacement[];
  markers: MarkerPlacement[];
  whiteRingsCaptured: number;
  blackRingsCaptured: number;
  ringsPlaced: number;
  selectedRing: HexCoord | null;
  pendingRemovalRows: HexCoord[][]; // Rows that need to be removed
  selectedRemovalRow: HexCoord[] | null; // A specific row the player has selected to remove
}

export const VALID_CELLS: HexCoord[] = [
  {q:0,r:-4},{q:1,r:-4},{q:2,r:-4},{q:3,r:-4},{q:4,r:-4},
  {q:-1,r:-3},{q:0,r:-3},{q:1,r:-3},{q:2,r:-3},{q:3,r:-3},{q:4,r:-3},
  {q:-2,r:-2},{q:-1,r:-2},{q:0,r:-2},{q:1,r:-2},{q:2,r:-2},{q:3,r:-2},{q:4,r:-2},
  {q:-3,r:-1},{q:-2,r:-1},{q:-1,r:-1},{q:0,r:-1},{q:1,r:-1},{q:2,r:-1},{q:3,r:-1},{q:4,r:-1},
  {q:-4,r:0},{q:-3,r:0},{q:-2,r:0},{q:-1,r:0},{q:0,r:0},{q:1,r:0},{q:2,r:0},{q:3,r:0},{q:4,r:0},
  {q:-4,r:1},{q:-3,r:1},{q:-2,r:1},{q:-1,r:1},{q:0,r:1},{q:1,r:1},{q:2,r:1},{q:3,r:1},
  {q:-4,r:2},{q:-3,r:2},{q:-2,r:2},{q:-1,r:2},{q:0,r:2},{q:1,r:2},{q:2,r:2},
  {q:-4,r:3},{q:-3,r:3},{q:-2,r:3},{q:-1,r:3},{q:0,r:3},{q:1,r:3},
  {q:-4,r:4},{q:-3,r:4},{q:-2,r:4},{q:-1,r:4},{q:0,r:4}
];

export const HEX_DIRECTIONS = [
  {q: 1, r: 0}, {q: 1, r: -1}, {q: 0, r: -1},
  {q: -1, r: 0}, {q: -1, r: 1}, {q: 0, r: 1}
];

export function isValidCell(q: number, r: number) {
  return VALID_CELLS.some(cell => cell.q === q && cell.r === r);
}

export function createInitialState(): GameState {
  return {
    phase: "setup",
    turn: "white",
    rings: [],
    markers: [],
    whiteRingsCaptured: 0,
    blackRingsCaptured: 0,
    ringsPlaced: 0,
    selectedRing: null,
    pendingRemovalRows: [],
    selectedRemovalRow: null,
  };
}

export function getEntityAt(state: GameState, q: number, r: number): { type: 'ring' | 'marker' | 'none', color?: PlayerColor } {
  const ring = state.rings.find(ring => ring.q === q && ring.r === r);
  if (ring) return { type: 'ring', color: ring.color };
  const marker = state.markers.find(m => m.q === q && m.r === r);
  if (marker) return { type: 'marker', color: marker.color };
  return { type: 'none' };
}

export function getValidMoves(state: GameState, startQ: number, startR: number): HexCoord[] {
  const moves: HexCoord[] = [];
  console.log(`getValidMoves called: start(${startQ}, ${startR}), phase: ${state.phase}`);
  if (state.phase !== 'playing') {
    console.log(`Phase is not 'playing', returning empty array`);
    return moves;
  }

  for (const dir of HEX_DIRECTIONS) {
    let currQ = startQ + dir.q;
    let currR = startR + dir.r;
    let jumpedMarkers = false;

    while (isValidCell(currQ, currR)) {
      const entity = getEntityAt(state, currQ, currR);
      
      if (entity.type === 'ring') {
        break; // Cannot jump over rings
      } else if (entity.type === 'marker') {
        jumpedMarkers = true;
      } else if (entity.type === 'none') {
        moves.push({ q: currQ, r: currR });
        if (jumpedMarkers) {
          break; // Must stop at the first empty cell after jumping markers
        }
      }
      
      currQ += dir.q;
      currR += dir.r;
    }
  }

  return moves;
}

export function findRows(state: GameState, player: PlayerColor): HexCoord[][] {
  const rows: HexCoord[][] = [];
  const visited = new Set<string>();

  for (const marker of state.markers) {
    if (marker.color !== player) continue;
    
    // Only check 3 directions to avoid duplicates
    const searchDirs = [{q: 1, r: 0}, {q: 1, r: -1}, {q: 0, r: -1}];
    
    for (const dir of searchDirs) {
      const currentLine: HexCoord[] = [{q: marker.q, r: marker.r}];
      let forwardQ = marker.q + dir.q;
      let forwardR = marker.r + dir.r;
      
      while (true) {
        const nextMarker = state.markers.find(m => m.q === forwardQ && m.r === forwardR && m.color === player);
        if (nextMarker) {
          currentLine.push({q: forwardQ, r: forwardR});
          forwardQ += dir.q;
          forwardR += dir.r;
        } else {
          break;
        }
      }
      
      if (currentLine.length >= 5) {
         // Create combinations of exactly 5 markers if the line is longer
         for (let i = 0; i <= currentLine.length - 5; i++) {
           const row = currentLine.slice(i, i + 5);
           const rowKey = row.map(r => `${r.q},${r.r}`).sort().join('|');
           if (!visited.has(rowKey)) {
             visited.add(rowKey);
             rows.push(row);
           }
         }
      }
    }
  }
  
  return rows;
}
