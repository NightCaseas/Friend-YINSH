import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { GameModeSelector as ModeSelector } from './GameModeCard';
import { HotSeatGamePage, useHotSeatGame } from '@/features/hotseat';

// Типы для пропсов
interface GameModeSelectorProps {
  initialMode?: 'online' | 'hotseat' | 'ai' | 'tutorial';
}

// Модальное окно для создания hot-seat игры
function HotSeatSetupModal({
  isOpen,
  onClose,
  onStartGame,
}: {
  isOpen: boolean;
  onClose: () => void;
  onStartGame: (player1Name: string, player2Name: string, timeControl: boolean) => void;
}) {
  const [player1Name, setPlayer1Name] = useState('Player 1');
  const [player2Name, setPlayer2Name] = useState('Player 2');
  const [timeControl, setTimeControl] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStartGame(player1Name, player2Name, timeControl);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Затемнение фона */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Модальное окно */}
      <div className="relative w-full max-w-md bg-gray-900 border border-gray-700 rounded-xl shadow-2xl">
        {/* Заголовок */}
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">Start Hot-Seat Game</h2>
          <p className="mt-1 text-gray-300">
            Two players on the same device. Game progress is automatically saved.
          </p>
        </div>

        {/* Форма */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Игрок 1 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Player 1 Name
            </label>
            <input
              type="text"
              value={player1Name}
              onChange={(e) => setPlayer1Name(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Enter name"
              maxLength={20}
            />
          </div>

          {/* Игрок 2 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Player 2 Name
            </label>
            <input
              type="text"
              value={player2Name}
              onChange={(e) => setPlayer2Name(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Enter name"
              maxLength={20}
            />
          </div>

          {/* Настройки */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-300">Time Control</div>
                <div className="text-sm text-gray-400">
                  10 minutes per player
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTimeControl(!timeControl)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  timeControl ? 'bg-emerald-600' : 'bg-gray-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    timeControl ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="text-sm text-gray-300 space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Game automatically saved after each move</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Export games in multiple formats</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Adaptive interface for all devices</span>
                </div>
              </div>
            </div>
          </div>

          {/* Кнопки */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-lg font-medium bg-gray-700 hover:bg-gray-600 text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 rounded-lg font-medium bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white transition-colors"
            >
              Start Game
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function GameModeSelector({ initialMode }: GameModeSelectorProps) {
  const [, setLocation] = useLocation();
  const [selectedMode, setSelectedMode] = useState<'online' | 'hotseat' | 'ai' | 'tutorial' | null>(
    initialMode || null
  );
  const [showHotSeatSetup, setShowHotSeatSetup] = useState(false);

  // Обработка выбора режима
  const handleSelectMode = (mode: 'online' | 'hotseat' | 'ai' | 'tutorial') => {
    setSelectedMode(mode);

    switch (mode) {
      case 'online':
        // Переход к созданию онлайн игры
        setLocation('/');
        break;
      
      case 'hotseat':
        // Показать модальное окно настройки hot-seat игры
        setShowHotSeatSetup(true);
        break;
      
      case 'ai':
        // Переход к игре с ИИ (пока не реализовано)
        alert('VS AI mode is coming soon!');
        break;
      
      case 'tutorial':
        // Переход к обучению (пока не реализовано)
        alert('Tutorial mode is coming soon!');
        break;
    }
  };

  // Использование контекста hot-seat
  const hotSeatContext = useHotSeatGame();

  // Обработка старта hot-seat игры
  const handleStartHotSeatGame = async (
    player1Name: string,
    player2Name: string,
    timeControl: boolean
  ) => {
    try {
      // Создаем новую игру через контекст hot-seat
      const gameId = await hotSeatContext.startNewGame({
        player1Name,
        player2Name,
        timeControl,
      });

      if (gameId) {
        console.log('Hot-seat game started with ID:', gameId);
        // Закрываем модальное окно
        setShowHotSeatSetup(false);
        // Устанавливаем hot-seat режим как активный
        setSelectedMode('hotseat');
      } else {
        console.error('Failed to start hot-seat game');
        alert('Failed to start game. Please try again.');
      }
    } catch (error) {
      console.error('Error starting hot-seat game:', error);
      alert('An error occurred while starting the game.');
    }
  };

  // Обработка возврата к выбору режима
  const handleBackToModeSelection = () => {
    setSelectedMode(null);
  };

  // Если выбран hot-seat режим, показываем страницу hot-seat игры
  if (selectedMode === 'hotseat') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950">
        <HotSeatGamePage />
      </div>
    );
  }

  // Иначе показываем выбор режима
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 flex flex-col">
      {/* Шапка */}
      <header className="px-4 py-6 md:px-8">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => setLocation('/')}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Home</span>
          </button>
        </div>
      </header>

      {/* Основное содержимое */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-4xl">
          <ModeSelector
            onSelectMode={handleSelectMode}
            availableModes={['online', 'hotseat']} // Пока доступны только онлайн и hot-seat
          />
        </div>
      </main>

      {/* Футер */}
      <footer className="px-4 py-6 border-t border-gray-800">
        <div className="max-w-6xl mx-auto text-center text-sm text-gray-400">
          <p>
            Hot-Seat mode saves games locally in your browser. 
            Clear your browser data to delete saved games.
          </p>
        </div>
      </footer>

      {/* Модальное окно настройки hot-seat игры */}
      <HotSeatSetupModal
        isOpen={showHotSeatSetup}
        onClose={() => setShowHotSeatSetup(false)}
        onStartGame={handleStartHotSeatGame}
      />
    </div>
  );
}

// Компонент для встраивания в существующую страницу
export function GameModeSelectorPage() {
  return <GameModeSelector />;
}

export default GameModeSelector;