import React, { useCallback } from 'react';
import YinshBoard from '@/components/YinshBoard';
import { HotSeatGameState } from '../types/HotSeatGameState';
import { useHotSeatGameManager } from '../hooks/useHotSeatGame';
import { GameState, PlayerColor } from '@/lib/yinsh';
import { HotSeatPlayerPanel, PlayerHint } from './HotSeatPlayerPanel';

interface HotSeatBoardProps {
  className?: string;
  showPlayerPanels?: boolean;
  showHint?: boolean;
  showControls?: boolean;
  compact?: boolean;
}

// Адаптер для преобразования hot-seat состояния в общий формат доски
export function HotSeatBoard({
  className = '',
  showPlayerPanels = true,
  showHint = true,
  showControls = true,
  compact = false,
}: HotSeatBoardProps) {
  const {
    gameState,
    selectedRing,
    error,
    isProcessing,
    handleCellClick,
    clearSelection,
    getCurrentHint,
    getCurrentPlayerInfo,
    getOpponentInfo,
  } = useHotSeatGameManager();

  

  // Если нет активной игры, показываем сообщение
  if (!gameState) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
        <div className="text-center space-y-4">
          <div className="text-2xl font-bold text-gray-300">No Active Game</div>
          <p className="text-gray-400 max-w-md">
            Start a new hot-seat game to play with a friend on the same device.
          </p>
          <button
            onClick={() => {
              // В реальной реализации здесь будет вызов startNewGame
              console.log('Start new game');
            }}
            className="px-6 py-3 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg font-medium transition-colors"
          >
            Start New Game
          </button>
        </div>
      </div>
    );
  }

  const board = gameState.boardState;
  const currentPlayerInfo = getCurrentPlayerInfo();
  const opponentInfo = getOpponentInfo();
  const hint = getCurrentHint();

  // Обработчик клика по клетке адаптированный для hot-seat
  const handleHotSeatCellClick = useCallback((q: number, r: number) => {
    if (isProcessing || gameState.status !== 'active') {
      return;
    }

    handleCellClick(q, r);
  }, [handleCellClick, isProcessing, gameState.status]);

  // Компактный режим
  if (compact) {
    return (
      <div className={`flex flex-col gap-3 ${className}`}>
        {/* Панель текущего игрока */}
        {showPlayerPanels && currentPlayerInfo && (
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-3 border border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full border-2"
                  style={{
                    backgroundColor: currentPlayerInfo.color === 'white' ? '#f0f0f5' : '#141928',
                    borderColor: currentPlayerInfo.color === 'white' ? '#ffffff' : '#8291af',
                  }}
                />
                <div>
                  <div className="font-medium text-sm">{currentPlayerInfo.name}</div>
                  <div className="text-xs text-gray-400 capitalize">{currentPlayerInfo.color}</div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      i < currentPlayerInfo.score
                        ? 'bg-yellow-500'
                        : 'bg-gray-600'
                    }`}
                  />
                ))}
              </div>
            </div>
            
            {/* Подсказка */}
            {showHint && (
              <div className="mt-2 pt-2 border-t border-gray-700">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                  <span className="text-xs text-gray-300 truncate">{hint}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Доска */}
        <div className="relative">
          <YinshBoard
            state={board}
            myColor={currentPlayerInfo?.color || null}
            onCellClick={handleHotSeatCellClick}
            pendingRows={board.pendingRemovalRows}
            highlightRow={null}
          />

          {/* Индикатор выбранного кольца */}
          {selectedRing && (
            <div className="absolute top-2 left-2 px-2 py-1 bg-yellow-900/80 backdrop-blur-sm rounded text-xs text-yellow-200 font-medium">
              Selected ring at ({selectedRing.q}, {selectedRing.r})
            </div>
          )}

          {/* Индикатор обработки */}
          {isProcessing && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl">
              <div className="text-white">Processing...</div>
            </div>
          )}
        </div>

        {/* Ошибка */}
        {error && (
          <div className="px-3 py-2 bg-red-900/30 border border-red-800 rounded-lg">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}
      </div>
    );
  }

  // Полный режим
  return (
    <div className={`flex flex-col lg:flex-row gap-6 ${className}`}>
      {/* Левая панель - информация об игроках */}
      <div className="lg:w-1/3 space-y-6">
        {/* Панель текущего игрока */}
        {showPlayerPanels && (
          <HotSeatPlayerPanel
            game={gameState}
            isCurrentPlayer={true}
            showScore={true}
            showTurnIndicator={true}
            className="shadow-lg"
          />
        )}

        {/* Панель соперника */}
        {showPlayerPanels && opponentInfo && (
          <div className="opacity-80">
            <HotSeatPlayerPanel
              game={gameState}
              isCurrentPlayer={false}
              showScore={true}
              showTurnIndicator={false}
            />
          </div>
        )}

        {/* Подсказка */}
        {showHint && (
          <PlayerHint hint={hint} className="shadow-lg" />
        )}

        {/* Статус игры */}
        <div className="p-4 bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Game Status</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                gameState.status === 'active'
                  ? 'bg-green-900/30 text-green-300'
                  : gameState.status === 'paused'
                  ? 'bg-yellow-900/30 text-yellow-300'
                  : 'bg-gray-700 text-gray-300'
              }`}>
                {gameState.status}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Phase</span>
              <span className="text-sm font-medium text-gray-300 capitalize">
                {board.phase}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Moves</span>
              <span className="text-sm font-medium text-gray-300">
                {gameState.moveHistory.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Правая панель - доска */}
      <div className="lg:w-2/3">
        <div className="relative bg-gray-800/30 backdrop-blur-sm rounded-2xl p-4 border border-gray-700 shadow-2xl">
          {/* Индикатор выбранного кольца */}
          {selectedRing && (
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-4 py-1.5 bg-yellow-900 text-yellow-200 rounded-full text-sm font-medium shadow-lg z-10">
              Selected ring at ({selectedRing.q}, {selectedRing.r})
              <button
                onClick={clearSelection}
                className="ml-2 text-xs text-yellow-400 hover:text-yellow-300"
              >
                ✕ Clear
              </button>
            </div>
          )}

          {/* Доска */}
          <div className="relative aspect-square max-w-2xl mx-auto">
            <YinshBoard
              state={board}
              myColor={currentPlayerInfo?.color || null}
              onCellClick={handleHotSeatCellClick}
              pendingRows={board.pendingRemovalRows}
              highlightRow={null}
            />

            {/* Индикатор обработки */}
            {isProcessing && (
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                  <div className="text-white font-medium">Processing move...</div>
                </div>
              </div>
            )}
          </div>

          {/* Ошибка */}
          {error && (
            <div className="mt-4 px-4 py-3 bg-red-900/30 border border-red-800 rounded-lg animate-pulse">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <p className="text-sm text-red-300 font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Подсказка для мобильных устройств */}
          <div className="mt-4 lg:hidden">
            <div className="p-3 bg-gray-800/70 backdrop-blur-sm rounded-lg border border-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                <p className="text-sm text-gray-300">{hint}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Компонент для полной страницы hot-seat игры
export function HotSeatGamePage() {
  const {
    gameState,
    error,
    isProcessing,
    getCurrentHint,
    startNewGame,
    pauseGame,
    resumeGame,
    resetGame,
    saveGame,
  } = useHotSeatGameManager();

  // Если нет активной игры, показываем экран начала
  if (!gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 shadow-2xl">
          <div className="text-center space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-white">Hot-Seat YINSH</h1>
              <p className="mt-2 text-gray-300">
                Play with a friend on the same device. Take turns making moves.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300 text-left">
                  Player 1 Name
                </label>
                <input
                  type="text"
                  defaultValue="Player 1"
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300 text-left">
                  Player 2 Name
                </label>
                <input
                  type="text"
                  defaultValue="Player 2"
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
            </div>

            <button
              onClick={() => startNewGame({
                player1Name: 'Player 1',
                player2Name: 'Player 2',
                boardSize: 5,
                timeControl: false,
              })}
              className="w-full py-3.5 px-6 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-yellow-500/20"
            >
              Start New Game
            </button>

            <div className="text-xs text-gray-400 pt-4 border-t border-gray-700">
              <p>Game progress is automatically saved to your browser.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const hint = getCurrentHint();
  const isGameActive = gameState.status === 'active';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 p-4 md:p-6">
      {/* Шапка */}
      <header className="mb-6 md:mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Hot-Seat YINSH</h1>
            <p className="text-gray-300 mt-1">{hint}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={isGameActive ? pauseGame : resumeGame}
              className="px-4 py-2 rounded-lg font-medium bg-gray-700 hover:bg-gray-600 text-white transition-colors"
            >
              {isGameActive ? '⏸ Pause' : '▶ Resume'}
            </button>
            <button
              onClick={saveGame}
              className="px-4 py-2 rounded-lg font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors"
            >
              💾 Save
            </button>
            <button
              onClick={resetGame}
              className="px-4 py-2 rounded-lg font-medium bg-red-600 hover:bg-red-500 text-white transition-colors"
            >
              🆕 New Game
            </button>
          </div>
        </div>
      </header>

      {/* Основное содержимое */}
      <main>
        <HotSeatBoard
          showPlayerPanels={true}
          showHint={false}
          showControls={false}
          compact={false}
        />
      </main>

      {/* Футер */}
      <footer className="mt-8 pt-6 border-t border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-sm text-gray-400">
          <div>
            <p>Game ID: {gameState.gameId.substring(0, 12)}...</p>
            <p className="mt-1">Moves: {gameState.moveHistory.length}</p>
          </div>
          
          <div className="space-x-4">
            <button
              onClick={() => {
                // Экспорт игры
                console.log('Export game');
              }}
              className="text-gray-300 hover:text-white transition-colors"
            >
              Export Game
            </button>
            <button
              onClick={() => {
                // Помощь
                console.log('Show help');
              }}
              className="text-gray-300 hover:text-white transition-colors"
            >
              Help
            </button>
          </div>
        </div>
      </footer>

      {/* Ошибка */}
      {error && (
        <div className="fixed bottom-4 right-4 max-w-sm">
          <div className="px-4 py-3 bg-red-900/90 backdrop-blur-sm rounded-lg border border-red-800 shadow-lg animate-slide-up">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <p className="text-sm text-red-300 font-medium">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Индикатор обработки */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-2xl">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-3 border-yellow-500 border-t-transparent rounded-full animate-spin" />
              <div className="text-white font-medium">Processing move...</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}