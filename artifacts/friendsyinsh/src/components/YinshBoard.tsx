import { useMemo } from "react";
import {
  VALID_CELLS,
  HEX_DIRECTIONS,
  isValidCell,
  getEntityAt,
  getValidMoves,
  findRows,
  type GameState,
  type HexCoord,
  type PlayerColor,
} from "@/lib/yinsh";

const HEX_SIZE = 28;
const SQRT3 = Math.sqrt(3);

function hexToPixel(q: number, r: number): { x: number; y: number } {
  const x = HEX_SIZE * (3 / 2) * q;
  const y = HEX_SIZE * ((SQRT3 / 2) * q + SQRT3 * r);
  return { x, y };
}

function hexPoints(cx: number, cy: number, size: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    const px = cx + size * Math.cos(angle);
    const py = cy + size * Math.sin(angle);
    pts.push(`${px},${py}`);
  }
  return pts.join(" ");
}

interface YinshBoardProps {
  state: GameState;
  myColor: PlayerColor | null;
  onCellClick: (q: number, r: number) => void;
  pendingRows: HexCoord[][];
  highlightRow: number | null;
}

export default function YinshBoard({
  state,
  myColor,
  onCellClick,
  pendingRows,
  highlightRow,
}: YinshBoardProps) {
  const cells = VALID_CELLS;

  const validMoves = useMemo(() => {
    if (state.phase !== "playing" || !state.selectedRing) return new Set<string>();
    const moves = getValidMoves(state, state.selectedRing.q, state.selectedRing.r);
    return new Set(moves.map((m) => `${m.q},${m.r}`));
  }, [state]);

  const pendingRowCells = useMemo(() => {
    if (highlightRow !== null && pendingRows[highlightRow]) {
      return new Set(pendingRows[highlightRow].map((c) => `${c.q},${c.r}`));
    }
    if (pendingRows.length === 1) {
      return new Set(pendingRows[0].map((c) => `${c.q},${c.r}`));
    }
    return new Set<string>();
  }, [pendingRows, highlightRow]);

  const allPendingRowCells = useMemo(() => {
    const s = new Set<string>();
    for (const row of pendingRows) {
      for (const c of row) s.add(`${c.q},${c.r}`);
    }
    return s;
  }, [pendingRows]);

  const allPixels = useMemo(() => {
    return cells.map((c) => ({ ...c, ...hexToPixel(c.q, c.r) }));
  }, [cells]);

  const minX = Math.min(...allPixels.map((p) => p.x)) - HEX_SIZE * 1.5;
  const maxX = Math.max(...allPixels.map((p) => p.x)) + HEX_SIZE * 1.5;
  const minY = Math.min(...allPixels.map((p) => p.y)) - HEX_SIZE * 1.5;
  const maxY = Math.max(...allPixels.map((p) => p.y)) + HEX_SIZE * 1.5;
  const vbW = maxX - minX;
  const vbH = maxY - minY;

  const isMyTurn = myColor === state.turn;
  const isSelected = (q: number, r: number) =>
    state.selectedRing?.q === q && state.selectedRing?.r === r;
  const isValidDest = (q: number, r: number) => validMoves.has(`${q},${r}`);

  function getCellFill(q: number, r: number): string {
    const key = `${q},${r}`;
    if (pendingRowCells.has(key)) return "rgba(245, 158, 11, 0.35)";
    if (allPendingRowCells.has(key)) return "rgba(245, 158, 11, 0.15)";
    if (isValidDest(q, r)) return "rgba(245, 158, 11, 0.12)";
    if (state.phase === "row-removal" || state.phase === "ring-removal") return "rgba(30, 38, 55, 0.95)";
    return "rgba(30, 38, 55, 0.85)";
  }

  function getCellStroke(q: number, r: number): string {
    const key = `${q},${r}`;
    if (pendingRowCells.has(key)) return "rgba(245, 158, 11, 0.9)";
    if (allPendingRowCells.has(key)) return "rgba(245, 158, 11, 0.55)";
    if (isSelected(q, r)) return "rgba(245, 158, 11, 0.9)";
    if (isValidDest(q, r)) return "rgba(245, 158, 11, 0.5)";
    return "rgba(255, 255, 255, 0.08)";
  }

  function getCellStrokeWidth(q: number, r: number): number {
    const key = `${q},${r}`;
    if (isSelected(q, r) || pendingRowCells.has(key)) return 1.5;
    if (isValidDest(q, r) || allPendingRowCells.has(key)) return 1.2;
    return 0.5;
  }

  function handleClick(q: number, r: number) {
    onCellClick(q, r);
  }

  return (
    <svg
      viewBox={`${minX} ${minY} ${vbW} ${vbH}`}
      className="w-full h-full"
      style={{ maxHeight: "100%", maxWidth: "100%" }}
    >
      {/* Board grid lines */}
      {[0, 1, 2].map((dirIdx) => {
        const dir = HEX_DIRECTIONS[dirIdx];
        const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];
        for (const cell of cells) {
          const neighbor = { q: cell.q + dir.q, r: cell.r + dir.r };
          if (isValidCell(neighbor.q, neighbor.r)) {
            const p1 = hexToPixel(cell.q, cell.r);
            const p2 = hexToPixel(neighbor.q, neighbor.r);
            lines.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y });
          }
        }
        return lines.map((line, i) => (
          <line
            key={`line-${dirIdx}-${i}`}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="rgba(255,255,255,0.07)"
            strokeWidth={0.8}
          />
        ));
      })}

      {/* Hex cells */}
      {allPixels.map(({ q, r, x, y }) => (
        <polygon
          key={`cell-${q}-${r}`}
          points={hexPoints(x, y, HEX_SIZE * 0.92)}
          fill={getCellFill(q, r)}
          stroke={getCellStroke(q, r)}
          strokeWidth={getCellStrokeWidth(q, r)}
          onClick={() => handleClick(q, r)}
          className="cursor-pointer transition-all duration-150"
          data-testid={`cell-${q}-${r}`}
        />
      ))}

      {/* Intersection dots */}
      {allPixels.map(({ q, r, x, y }) => {
        const entity = getEntityAt(state, q, r);
        if (entity.type !== "none") return null;
        return (
          <circle
            key={`dot-${q}-${r}`}
            cx={x}
            cy={y}
            r={2.5}
            fill="rgba(255,255,255,0.18)"
            onClick={() => handleClick(q, r)}
            className="cursor-pointer"
          />
        );
      })}

      {/* Valid move indicators */}
      {allPixels.map(({ q, r, x, y }) => {
        if (!isValidDest(q, r)) return null;
        return (
          <circle
            key={`valid-${q}-${r}`}
            cx={x}
            cy={y}
            r={6}
            fill="rgba(245,158,11,0.35)"
            stroke="rgba(245,158,11,0.7)"
            strokeWidth={1}
            onClick={() => handleClick(q, r)}
            className="cursor-pointer"
          />
        );
      })}

      {/* Markers */}
      {state.markers.map((marker, i) => {
        const { x, y } = hexToPixel(marker.q, marker.r);
        const isWhite = marker.color === "white";
        return (
          <g key={`marker-${i}`} onClick={() => handleClick(marker.q, marker.r)} className="cursor-pointer">
            <circle
              cx={x}
              cy={y}
              r={HEX_SIZE * 0.38}
              fill={isWhite ? "rgba(240,240,245,0.95)" : "rgba(30,35,50,0.95)"}
              stroke={isWhite ? "rgba(255,255,255,0.5)" : "rgba(100,115,145,0.4)"}
              strokeWidth={1}
            />
          </g>
        );
      })}

      {/* Rings */}
      {state.rings.map((ring, i) => {
        const { x, y } = hexToPixel(ring.q, ring.r);
        const isWhite = ring.color === "white";
        const isMyRing = ring.color === myColor;
        const isSelectedRing = isSelected(ring.q, ring.r);
        const outerR = HEX_SIZE * 0.52;
        const innerR = HEX_SIZE * 0.32;
        const fillColor = isWhite
          ? "rgba(240,240,245,0.12)"
          : "rgba(20,25,40,0.12)";
        const strokeColor = isSelectedRing
          ? "rgba(245,158,11,1)"
          : isWhite
          ? "rgba(235,235,245,0.95)"
          : "rgba(130,145,175,0.9)";
        const glow = isSelectedRing
          ? `drop-shadow(0 0 6px rgba(245,158,11,0.8))`
          : isMyRing
          ? `drop-shadow(0 0 3px rgba(255,255,255,0.2))`
          : undefined;

        return (
          <g
            key={`ring-${i}`}
            onClick={() => handleClick(ring.q, ring.r)}
            className="cursor-pointer"
            style={{ filter: glow }}
            data-testid={`ring-${ring.color}-${ring.q}-${ring.r}`}
          >
            <circle
              cx={x}
              cy={y}
              r={outerR}
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={isSelectedRing ? 3.5 : 2.5}
            />
            {/* Inner hole */}
            <circle
              cx={x}
              cy={y}
              r={innerR}
              fill="transparent"
            />
          </g>
        );
      })}
    </svg>
  );
}
