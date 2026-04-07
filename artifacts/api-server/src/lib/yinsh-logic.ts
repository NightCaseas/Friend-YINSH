export type Player = "white" | "black";
export type CellContent =
  | { type: "empty" }
  | { type: "ring"; player: Player }
  | { type: "marker"; player: Player };

export interface HexCoord {
  q: number;
  r: number;
}

export interface GameState {
  phase: "setup" | "playing" | "row-removal" | "ring-removal" | "finished";
  board: Record<string, CellContent>;
  currentPlayer: Player;
  ringsPlaced: { white: number; black: number };
  ringsOnBoard: { white: number; black: number };
  ringsCaptured: { white: number; black: number };
  pendingRows: Array<Array<HexCoord>>;
  pendingRowPlayer: Player | null;
  winner: Player | null;
}

const HEX_DIRECTIONS: HexCoord[] = [
  { q: 1, r: 0 },
  { q: -1, r: 0 },
  { q: 0, r: 1 },
  { q: 0, r: -1 },
  { q: 1, r: -1 },
  { q: -1, r: 1 },
];

const VALID_CELLS_RAW: [number, number][] = [
  [0, -4], [1, -4], [2, -4], [3, -4], [4, -4],
  [-1, -3], [0, -3], [1, -3], [2, -3], [3, -3], [4, -3],
  [-2, -2], [-1, -2], [0, -2], [1, -2], [2, -2], [3, -2], [4, -2],
  [-3, -1], [-2, -1], [-1, -1], [0, -1], [1, -1], [2, -1], [3, -1], [4, -1],
  [-4, 0], [-3, 0], [-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0], [3, 0], [4, 0],
  [-4, 1], [-3, 1], [-2, 1], [-1, 1], [0, 1], [1, 1], [2, 1], [3, 1],
  [-4, 2], [-3, 2], [-2, 2], [-1, 2], [0, 2], [1, 2], [2, 2],
  [-4, 3], [-3, 3], [-2, 3], [-1, 3], [0, 3], [1, 3],
  [-4, 4], [-3, 4], [-2, 4], [-1, 4], [0, 4],
];

export const VALID_CELLS: Set<string> = new Set(
  VALID_CELLS_RAW.map(([q, r]) => `${q},${r}`)
);

export function coordKey(q: number, r: number): string {
  return `${q},${r}`;
}

export function parseKey(key: string): HexCoord {
  const [q, r] = key.split(",").map(Number);
  return { q, r };
}

export function isValid(q: number, r: number): boolean {
  return VALID_CELLS.has(coordKey(q, r));
}

export function createInitialState(): GameState {
  const board: Record<string, CellContent> = {};
  for (const key of VALID_CELLS) {
    board[key] = { type: "empty" };
  }
  return {
    phase: "setup",
    board,
    currentPlayer: "white",
    ringsPlaced: { white: 0, black: 0 },
    ringsOnBoard: { white: 0, black: 0 },
    ringsCaptured: { white: 0, black: 0 },
    pendingRows: [],
    pendingRowPlayer: null,
    winner: null,
  };
}

export function getValidMoveDestinations(state: GameState, fromQ: number, fromR: number): HexCoord[] {
  const destinations: HexCoord[] = [];

  for (const dir of HEX_DIRECTIONS) {
    let q = fromQ + dir.q;
    let r = fromR + dir.r;
    let crossedMarker = false;

    while (isValid(q, r)) {
      const cell = state.board[coordKey(q, r)];
      if (!cell || cell.type === "empty") {
        destinations.push({ q, r });
        if (crossedMarker) break;
      } else if (cell.type === "marker") {
        crossedMarker = true;
      } else if (cell.type === "ring") {
        break;
      }
      q += dir.q;
      r += dir.r;
    }
  }

  return destinations;
}

function flipMarkers(board: Record<string, CellContent>, fromQ: number, fromR: number, toQ: number, toR: number): void {
  const dq = Math.sign(toQ - fromQ);
  const dr = Math.sign(toR - fromR);

  let q = fromQ + dq;
  let r = fromR + dr;

  while (q !== toQ || r !== toR) {
    const key = coordKey(q, r);
    const cell = board[key];
    if (cell && cell.type === "marker") {
      board[key] = { type: "marker", player: cell.player === "white" ? "black" : "white" };
    }
    q += dq;
    r += dr;
  }
}

function findRows(board: Record<string, CellContent>, player: Player): Array<Array<HexCoord>> {
  const rows: Array<Array<HexCoord>> = [];
  const counted = new Set<string>();

  for (const key of VALID_CELLS) {
    const cell = board[key];
    if (!cell || cell.type !== "marker" || cell.player !== player) continue;

    const { q, r } = parseKey(key);

    // Scan the three unique line directions for axial hex coordinates.
    for (const dir of [{ q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 }]) {
      const row: HexCoord[] = [{ q, r }];

      for (let i = 1; i < 5; i++) {
        const nq = q + dir.q * i;
        const nr = r + dir.r * i;
        const nkey = coordKey(nq, nr);
        const ncell = board[nkey];
        if (!isValid(nq, nr) || !ncell || ncell.type !== "marker" || ncell.player !== player) {
          break;
        }
        row.push({ q: nq, r: nr });
      }

      if (row.length >= 5) {
        const rowKey = row.map(c => coordKey(c.q, c.r)).sort().join("|");
        if (!counted.has(rowKey)) {
          counted.add(rowKey);
          rows.push(row.slice(0, 5));
        }
      }
    }
  }

  return rows;
}

export type Move =
  | { type: "place-ring"; q: number; r: number }
  | { type: "move-ring"; fromQ: number; fromR: number; toQ: number; toR: number }
  | { type: "remove-row"; rowIndex: number }
  | { type: "remove-ring"; q: number; r: number }
  | { type: "resign" };

export function applyMove(state: GameState, move: Move, player: Player): { state: GameState; error?: string } {
  const next = deepClone(state);

  if (move.type === "resign") {
    next.winner = player === "white" ? "black" : "white";
    next.phase = "finished";
    return { state: next };
  }

  if (next.phase === "setup") {
    if (move.type !== "place-ring") {
      return { state, error: "Expected place-ring move during setup" };
    }
    if (player !== next.currentPlayer) {
      return { state, error: "Not your turn" };
    }
    const key = coordKey(move.q, move.r);
    if (!isValid(move.q, move.r)) {
      return { state, error: "Invalid cell" };
    }
    const cell = next.board[key];
    if (!cell || cell.type !== "empty") {
      return { state, error: "Cell occupied" };
    }
    next.board[key] = { type: "ring", player };
    next.ringsPlaced[player]++;
    next.ringsOnBoard[player]++;

    const totalPlaced = next.ringsPlaced.white + next.ringsPlaced.black;
    if (totalPlaced >= 10) {
      next.phase = "playing";
    }
    next.currentPlayer = player === "white" ? "black" : "white";
    return { state: next };
  }

  if (next.phase === "playing") {
    if (move.type !== "move-ring") {
      return { state, error: "Expected move-ring during playing phase" };
    }
    if (player !== next.currentPlayer) {
      return { state, error: "Not your turn" };
    }

    const fromKey = coordKey(move.fromQ, move.fromR);
    const toKey = coordKey(move.toQ, move.toR);
    const fromCell = next.board[fromKey];

    if (!fromCell || fromCell.type !== "ring" || fromCell.player !== player) {
      return { state, error: "No ring at origin" };
    }

    const valid = getValidMoveDestinations(next, move.fromQ, move.fromR);
    const isValidDest = valid.some(v => v.q === move.toQ && v.r === move.toR);
    if (!isValidDest) {
      return { state, error: "Invalid destination" };
    }

    next.board[fromKey] = { type: "marker", player };
    flipMarkers(next.board, move.fromQ, move.fromR, move.toQ, move.toR);
    next.board[toKey] = { type: "ring", player };

    const rows = findRows(next.board, player);
    const opponentRows = findRows(next.board, player === "white" ? "black" : "white");

    if (rows.length > 0 || opponentRows.length > 0) {
      if (rows.length > 0) {
        next.pendingRows = rows;
        next.pendingRowPlayer = player;
        next.phase = "row-removal";
      } else {
        const opponent = player === "white" ? "black" : "white";
        next.pendingRows = opponentRows;
        next.pendingRowPlayer = opponent;
        next.phase = "row-removal";
      }
    } else {
      next.currentPlayer = player === "white" ? "black" : "white";
    }

    return { state: next };
  }

  if (next.phase === "row-removal") {
    if (move.type !== "remove-row") {
      return { state, error: "Expected remove-row" };
    }
    if (player !== next.pendingRowPlayer) {
      return { state, error: "Not your turn to remove a row" };
    }

    const row = next.pendingRows[move.rowIndex];
    if (!row) {
      return { state, error: "Invalid row index" };
    }

    for (const cell of row) {
      next.board[coordKey(cell.q, cell.r)] = { type: "empty" };
    }

    next.pendingRows = [];
    next.phase = "ring-removal";
    return { state: next };
  }

  if (next.phase === "ring-removal") {
    if (move.type !== "remove-ring") {
      return { state, error: "Expected remove-ring" };
    }
    if (player !== next.pendingRowPlayer) {
      return { state, error: "Not your turn to remove a ring" };
    }

    const key = coordKey(move.q, move.r);
    const cell = next.board[key];
    if (!cell || cell.type !== "ring" || cell.player !== player) {
      return { state, error: "No ring at that position" };
    }

    next.board[key] = { type: "empty" };
    next.ringsOnBoard[player]--;
    next.ringsCaptured[player]++;

    if (next.ringsCaptured[player] >= 3) {
      next.winner = player;
      next.phase = "finished";
      return { state: next };
    }

    const opponent = player === "white" ? "black" : "white";
    const opponentRows = findRows(next.board, opponent);
    if (opponentRows.length > 0) {
      next.pendingRows = opponentRows;
      next.pendingRowPlayer = opponent;
      next.phase = "row-removal";
    } else {
      const myRemaining = findRows(next.board, player);
      if (myRemaining.length > 0) {
        next.pendingRows = myRemaining;
        next.pendingRowPlayer = player;
        next.phase = "row-removal";
      } else {
        next.pendingRowPlayer = null;
        next.phase = "playing";
        next.currentPlayer = player === "white" ? "black" : "white";
      }
    }

    return { state: next };
  }

  return { state, error: "Cannot make move in current phase" };
}

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}
