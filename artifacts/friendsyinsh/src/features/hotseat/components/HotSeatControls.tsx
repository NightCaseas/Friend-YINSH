import React, { useState } from 'react';
import { useHotSeatGame } from '../context/HotSeatGameContext';
import { exportHotSeatGame, downloadExportedGame, copyToClipboard } from '../utils/hotSeatExport';

interface HotSeatControlsProps {
  className?: string;
  showExport?: boolean;
  showSave?: boolean;
  showPause?: boolean;
  showNewGame?: boolean;
  compact?: boolean;
}

export function HotSeatControls({
  className = '',
  showExport = true,
  showSave = true,
  showPause = true,
  showNewGame = true,
  compact = false,
}: HotSeatControlsProps) {
  const context = useHotSeatGame();
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'yinsh-standard' | 'pgn' | 'analysis'>('yinsh-standard');
  const [showExportMenu, setShowExportMenu] = useState(false);

  if (!context.state) {
    return null;
  }

  const { state: game, isSaving, pauseGame, resumeGame, resetGame } = context;
  const isGameActive = game.status === 'active';
  const isGamePaused = game.status === 'paused';
  const isGameFinished = game.status === 'finished';

  // Обработка паузы/возобновления игры
  const handlePauseResume = () => {
    if (isGameActive) {
      pauseGame();
    } else if (isGamePaused) {
      resumeGame();
    }
  };

  // Обработка сохранения игры
  const handleSave = async () => {
    await context.saveGame();
  };

  // Обработка экспорта
  const handleExport = async (format: 'yinsh-standard' | 'pgn' | 'analysis') => {
    if (!game) return;

    setIsExporting(true);
    try {
      const exported = exportHotSeatGame(game, format);
      downloadExportedGame(exported);
    } catch (error) {
      console.error('Error exporting game:', error);
    } finally {
      setIsExporting(false);
      setShowExportMenu(false);
    }
  };

  // Копирование в буфер обмена
  const handleCopyToClipboard = async (format: 'yinsh-standard' | 'pgn' | 'analysis') => {
    if (!game) return;

    setIsExporting(true);
    try {
      const exported = exportHotSeatGame(game, format);
      const success = await copyToClipboard(exported);
      
      if (success) {
        // Показать уведомление об успехе
        alert(`Game copied to clipboard in ${format} format`);
      } else {
        alert('Failed to copy to clipboard');
      }
    } catch (error) {
      console.error('Error copying game:', error);
      alert('Error copying game');
    } finally {
      setIsExporting(false);
      setShowExportMenu(false);
    }
  };

  // Создание новой игры
  const handleNewGame = () => {
    if (window.confirm('Start a new game? Current game progress will be saved.')) {
      resetGame();
      // В реальной реализации здесь будет переход к экрану создания новой игры
    }
  };

  // Компактный вариант управления
  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {/* Кнопка паузы/возобновления */}
        {showPause && (
          <button
            onClick={handlePauseResume}
            disabled={isGameFinished}
            className="px-3 py-1.5 text-sm rounded-md bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isGameActive ? 'Pause' : isGamePaused ? 'Resume' : 'Paused'}
          </button>
        )}

        {/* Кнопка сохранения */}
        {showSave && (
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-3 py-1.5 text-sm rounded-md bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        )}

        {/* Меню экспорта */}
        {showExport && (
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={isExporting}
              className="px-3 py-1.5 text-sm rounded-md bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isExporting ? 'Exporting...' : 'Export'}
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-1 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10">
                <div className="p-2 space-y-1">
                  <button
                    onClick={() => handleExport('yinsh-standard')}
                    className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-700 transition-colors"
                  >
                    Export as YINSH Standard
                  </button>
                  <button
                    onClick={() => handleExport('pgn')}
                    className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-700 transition-colors"
                  >
                    Export as PGN
                  </button>
                  <button
                    onClick={() => handleExport('analysis')}
                    className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-700 transition-colors"
                  >
                    Export for Analysis
                  </button>
                  <div className="border-t border-gray-700 pt-1 mt-1">
                    <button
                      onClick={() => handleCopyToClipboard('yinsh-standard')}
                      className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-700 transition-colors"
                    >
                      Copy to Clipboard
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Полный вариант управления
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Статус сохранения */}
      {isSaving && (
        <div className="px-3 py-2 text-sm text-yellow-400 bg-yellow-900/20 border border-yellow-800 rounded-md">
          Saving game...
        </div>
      )}

      {/* Основные кнопки управления */}
      <div className="grid grid-cols-2 gap-2">
        {/* Пауза/Возобновление */}
        {showPause && (
          <button
            onClick={handlePauseResume}
            disabled={isGameFinished}
            className={`px-4 py-2.5 rounded-lg font-medium transition-all ${
              isGameActive
                ? 'bg-yellow-600 hover:bg-yellow-500 text-white'
                : isGamePaused
                ? 'bg-green-600 hover:bg-green-500 text-white'
                : 'bg-gray-600 text-gray-300 cursor-not-allowed'
            }`}
          >
            {isGameActive ? '⏸ Pause Game' : isGamePaused ? '▶ Resume Game' : 'Game Finished'}
          </button>
        )}

        {/* Сохранение */}
        {showSave && (
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2.5 rounded-lg font-medium bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? '💾 Saving...' : '💾 Save Game'}
          </button>
        )}
      </div>

      {/* Управление экспортом */}
      {showExport && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-300">Export Game</span>
            <div className="flex items-center gap-2">
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as any)}
                className="px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded"
              >
                <option value="yinsh-standard">YINSH Standard</option>
                <option value="pgn">PGN Format</option>
                <option value="analysis">Analysis Format</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleExport(exportFormat)}
              disabled={isExporting}
              className="px-4 py-2.5 rounded-lg font-medium bg-green-600 hover:bg-green-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isExporting ? '📥 Exporting...' : '📥 Download'}
            </button>

            <button
              onClick={() => handleCopyToClipboard(exportFormat)}
              disabled={isExporting}
              className="px-4 py-2.5 rounded-lg font-medium bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              📋 Copy to Clipboard
            </button>
          </div>
        </div>
      )}

      {/* Новая игра */}
      {showNewGame && (
        <div className="pt-2 border-t border-gray-700">
          <button
            onClick={handleNewGame}
            className="w-full px-4 py-2.5 rounded-lg font-medium bg-gray-700 hover:bg-gray-600 text-white transition-colors"
          >
            🆕 New Game
          </button>
        </div>
      )}

      {/* Информация о текущей игре */}
      <div className="pt-2 border-t border-gray-700">
        <div className="space-y-1 text-sm text-gray-400">
          <div className="flex justify-between">
            <span>Game ID:</span>
            <span className="font-mono text-xs">{game.gameId.substring(0, 8)}...</span>
          </div>
          <div className="flex justify-between">
            <span>Moves:</span>
            <span>{game.moveHistory.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Duration:</span>
            <span>{Math.round((game.lastMoveAt - game.createdAt) / 60000)} min</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Компонент для быстрого доступа к управлению
export function QuickHotSeatControls() {
  const context = useHotSeatGame();

  if (!context.state) {
    return null;
  }

  const { state: game, pauseGame, resumeGame, saveGame } = context;
  const isGameActive = game.status === 'active';

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={isGameActive ? pauseGame : resumeGame}
        className="p-2 rounded-full hover:bg-gray-700 transition-colors"
        title={isGameActive ? 'Pause game' : 'Resume game'}
      >
        {isGameActive ? '⏸' : '▶'}
      </button>
      
      <button
        onClick={saveGame}
        className="p-2 rounded-full hover:bg-gray-700 transition-colors"
        title="Save game"
      >
        💾
      </button>
    </div>
  );
}