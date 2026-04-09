import React from 'react';
import { X } from 'lucide-react';
import { HotSeatGameState } from '../types/HotSeatGameState';
import { determineWinner } from '../utils/hotSeatGameLogic';

interface HotSeatGameOverModalProps {
  game: HotSeatGameState;
  onNewGame: () => void;
  onClose: () => void;
  className?: string;
}

export function getHotSeatColorLabel(color: HotSeatGameState['players']['player1']['color']) {
  return color === 'white' ? 'White' : 'Black';
}

export function getHotSeatWinner(game: HotSeatGameState) {
  const winner = determineWinner(game);

  if (!winner) {
    return null;
  }

  const player = game.players[winner];

  return {
    key: winner,
    name: player.name,
    color: getHotSeatColorLabel(player.color),
  };
}

export function HotSeatGameOverModal({
  game,
  onNewGame,
  onClose,
  className = '',
}: HotSeatGameOverModalProps) {
  const winner = getHotSeatWinner(game);

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${className}`} role="presentation">
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-gray-950/95 p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="hotseat-game-over-title"
        aria-describedby="hotseat-game-over-description"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Close dialog"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="space-y-5 text-center">
          <div className="space-y-2 pt-2">
            <p className="text-xs uppercase tracking-[0.3em] text-yellow-400">Game over</p>
            <h2 id="hotseat-game-over-title" className="text-3xl font-semibold text-white">
              Winner
            </h2>
          </div>

          {winner ? (
            <div id="hotseat-game-over-description" className="space-y-3">
              <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-5">
                <p className="text-lg font-medium text-white">{winner.name}</p>
                <p className="mt-1 text-sm text-gray-300">Color: {winner.color}</p>
              </div>
            </div>
          ) : (
            <p id="hotseat-game-over-description" className="text-sm text-gray-300">
              The game has ended.
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white transition-colors hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onNewGame}
              className="flex-1 rounded-xl bg-yellow-500 px-4 py-3 font-medium text-gray-950 transition-colors hover:bg-yellow-400"
            >
              New game
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Упрощенная версия модального окна для встраивания
export function CompactGameOverPanel({
  game,
  onNewGame,
  className = '',
}: {
  game: HotSeatGameState;
  onNewGame: () => void;
  className?: string;
}) {
  const winner = getHotSeatWinner(game);

  return (
    <div className={`p-4 bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-700 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span className="font-bold text-lg">Game Over</span>
        </div>
        {winner && (
          <div className="flex items-center gap-2 px-3 py-1 bg-yellow-900/30 rounded-full">
            <span className="text-sm text-gray-300">{winner.name}</span>
            <span className="text-yellow-300 font-bold">{winner.color}</span>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <p className="text-gray-300">
          {winner 
            ? `${winner.name} wins as ${winner.color}.`
            : 'The game has ended.'}
        </p>

        <div className="flex items-center gap-2">
          <button
            onClick={onNewGame}
            className="flex-1 px-3 py-2 text-sm rounded-lg bg-yellow-600 hover:bg-yellow-500 text-white transition-colors"
          >
            New Game
          </button>
        </div>
      </div>
    </div>
  );
}
