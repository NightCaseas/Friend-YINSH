import React from 'react';
import { HotSeatGameState } from '../types/HotSeatGameState';
import { determineWinner } from '../utils/hotSeatGameLogic';
import { exportHotSeatGame, downloadExportedGame } from '../utils/hotSeatExport';
import { format } from 'date-fns';

interface HotSeatGameOverModalProps {
  game: HotSeatGameState;
  onNewGame: () => void;
  onClose: () => void;
  onExport?: (format: 'yinsh-standard' | 'pgn' | 'analysis') => void;
  className?: string;
}

export function HotSeatGameOverModal({
  game,
  onNewGame,
  onClose,
  onExport,
  className = '',
}: HotSeatGameOverModalProps) {
  const winner = determineWinner(game);
  const { player1, player2 } = game.players;
  
  // Определяем победителя и проигравшего
  const winnerInfo = winner === 'player1' ? player1 : winner === 'player2' ? player2 : null;
  const loserInfo = winner === 'player1' ? player2 : winner === 'player2' ? player1 : null;

  // Статистика игры
  const gameDuration = Math.round((game.lastMoveAt - game.createdAt) / 60000); // в минутах
  const movesCount = game.moveHistory.length;

  // Обработка экспорта
  const handleExport = (format: 'yinsh-standard' | 'pgn' | 'analysis') => {
    if (onExport) {
      onExport(format);
    } else {
      const exported = exportHotSeatGame(game, format);
      downloadExportedGame(exported);
    }
  };

  // Обработка реванша
  const handleRematch = () => {
    // В реальной реализации здесь будет логика для реванша
    // С сохранением тех же игроков, но случайным распределением цветов
    onNewGame();
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${className}`}>
      {/* Затемнение фона */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Модальное окно */}
      <div className="relative w-full max-w-md bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
        {/* Заголовок */}
        <div className="p-6 bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-center text-white">
            {winner ? '🎉 Game Over! 🎉' : 'Game Finished'}
          </h2>
          <p className="mt-2 text-center text-gray-300">
            {winner ? 'Congratulations to the winner!' : 'The game has ended'}
          </p>
        </div>

        {/* Содержимое */}
        <div className="p-6 space-y-6">
          {/* Результат игры */}
          <div className="text-center">
            {winnerInfo ? (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full border-4 flex items-center justify-center"
                    style={{
                      backgroundColor: winnerInfo.color === 'white' ? '#f0f0f5' : '#141928',
                      borderColor: 'hsl(38, 92%, 55%)',
                    }}
                  >
                    <span className={`text-xl font-bold ${winnerInfo.color === 'white' ? 'text-gray-900' : 'text-gray-100'}`}>
                      👑
                    </span>
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-bold text-yellow-400">{winnerInfo.name}</h3>
                    <p className="text-gray-300 capitalize">Winner • {winnerInfo.color}</p>
                  </div>
                </div>
                
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-900/30 border border-yellow-800 rounded-full">
                  <span className="text-yellow-300 font-bold text-2xl">{winnerInfo.score}</span>
                  <span className="text-gray-300">rings captured</span>
                </div>
              </div>
            ) : (
              <div className="py-4">
                <p className="text-lg text-gray-300">No clear winner</p>
              </div>
            )}
          </div>

          {/* Счет */}
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full border"
                  style={{
                    backgroundColor: player1.color === 'white' ? '#f0f0f5' : '#141928',
                    borderColor: player1.color === 'white' ? '#ffffff' : '#8291af',
                  }}
                />
                <span className="font-medium">{player1.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{player1.score}</span>
                <span className="text-gray-400">-</span>
                <span className="text-2xl font-bold">{player2.score}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{player2.name}</span>
                <div
                  className="w-4 h-4 rounded-full border"
                  style={{
                    backgroundColor: player2.color === 'white' ? '#f0f0f5' : '#141928',
                    borderColor: player2.color === 'white' ? '#ffffff' : '#8291af',
                  }}
                />
              </div>
            </div>
            
            {/* Прогресс-бар счета */}
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-yellow-500 transition-all duration-1000"
                style={{ width: `${(player1.score / 3) * 50}%` }}
              />
              <div 
                className="h-full bg-gray-400 transition-all duration-1000"
                style={{ width: `${50 - (player1.score / 3) * 50}%`, marginLeft: `${(player1.score / 3) * 50}%` }}
              />
            </div>
          </div>

          {/* Статистика игры */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-gray-800/30 rounded-lg">
              <div className="text-2xl font-bold text-yellow-400">{movesCount}</div>
              <div className="text-xs text-gray-400 uppercase tracking-wider">Moves</div>
            </div>
            <div className="p-3 bg-gray-800/30 rounded-lg">
              <div className="text-2xl font-bold text-yellow-400">{gameDuration}</div>
              <div className="text-xs text-gray-400 uppercase tracking-wider">Minutes</div>
            </div>
            <div className="p-3 bg-gray-800/30 rounded-lg">
              <div className="text-2xl font-bold text-yellow-400">
                {format(new Date(game.createdAt), 'MM/dd')}
              </div>
              <div className="text-xs text-gray-400 uppercase tracking-wider">Date</div>
            </div>
          </div>

          {/* Кнопки действий */}
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleRematch}
                className="px-4 py-3 rounded-lg font-medium bg-yellow-600 hover:bg-yellow-500 text-white transition-colors flex items-center justify-center gap-2"
              >
                <span>⚔️</span>
                Rematch
              </button>
              
              <button
                onClick={onNewGame}
                className="px-4 py-3 rounded-lg font-medium bg-gray-700 hover:bg-gray-600 text-white transition-colors flex items-center justify-center gap-2"
              >
                <span>🆕</span>
                New Game
              </button>
            </div>

            {/* Экспорт */}
            <div className="border-t border-gray-700 pt-3">
              <p className="text-sm text-gray-400 mb-2">Export game:</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleExport('yinsh-standard')}
                  className="px-3 py-2 text-sm rounded-lg bg-green-700 hover:bg-green-600 text-white transition-colors"
                >
                  YINSH
                </button>
                <button
                  onClick={() => handleExport('pgn')}
                  className="px-3 py-2 text-sm rounded-lg bg-blue-700 hover:bg-blue-600 text-white transition-colors"
                >
                  PGN
                </button>
                <button
                  onClick={() => handleExport('analysis')}
                  className="px-3 py-2 text-sm rounded-lg bg-purple-700 hover:bg-purple-600 text-white transition-colors"
                >
                  Analysis
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Футер */}
        <div className="px-6 py-4 bg-gray-800/50 border-t border-gray-700 flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
          <div className="text-xs text-gray-500">
            Game ID: {game.gameId.substring(0, 8)}...
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
  onExport,
  className = '',
}: {
  game: HotSeatGameState;
  onNewGame: () => void;
  onExport?: (format: 'yinsh-standard' | 'pgn' | 'analysis') => void;
  className?: string;
}) {
  const winner = determineWinner(game);
  const winnerInfo = winner ? game.players[winner] : null;

  return (
    <div className={`p-4 bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-700 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span className="font-bold text-lg">Game Over</span>
        </div>
        {winnerInfo && (
          <div className="flex items-center gap-2 px-3 py-1 bg-yellow-900/30 rounded-full">
            <span className="text-yellow-300 font-bold">{winnerInfo.score}</span>
            <span className="text-sm text-gray-300">{winnerInfo.name}</span>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <p className="text-gray-300">
          {winnerInfo 
            ? `${winnerInfo.name} wins with ${winnerInfo.score} rings captured!`
            : 'The game has ended.'}
        </p>

        <div className="flex items-center gap-2">
          <button
            onClick={onNewGame}
            className="flex-1 px-3 py-2 text-sm rounded-lg bg-yellow-600 hover:bg-yellow-500 text-white transition-colors"
          >
            New Game
          </button>
          
          {onExport && (
            <button
              onClick={() => onExport('yinsh-standard')}
              className="px-3 py-2 text-sm rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors"
            >
              Export
            </button>
          )}
        </div>
      </div>
    </div>
  );
}