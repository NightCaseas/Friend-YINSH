import React from 'react';
import { HotSeatGameState } from '../types/HotSeatGameState';
import { PlayerColor } from '@/lib/yinsh';

interface HotSeatPlayerPanelProps {
  game: HotSeatGameState;
  isCurrentPlayer?: boolean;
  showScore?: boolean;
  showTurnIndicator?: boolean;
  className?: string;
}

export function HotSeatPlayerPanel({
  game,
  isCurrentPlayer = false,
  showScore = true,
  showTurnIndicator = true,
  className = '',
}: HotSeatPlayerPanelProps) {
  const { player1, player2 } = game.players;
  const currentPlayerName = game.players[game.currentPlayer].name;
  const isPlayer1Turn = game.currentPlayer === 'player1';

  // Определяем стили для текущего игрока
  const currentPlayerStyle = isCurrentPlayer
    ? 'ring-2 ring-yellow-500 bg-gray-800'
    : 'bg-gray-900 border border-gray-700';

  // Определяем стили для индикатора хода
  const turnIndicatorStyle = showTurnIndicator && isCurrentPlayer
    ? 'animate-pulse bg-yellow-500'
    : 'bg-gray-600';

  // Рендерим панель для конкретного игрока
  const renderPlayerPanel = (player: typeof player1 | typeof player2, isPlayer1: boolean) => {
    const isThisPlayerCurrent = (isPlayer1 && isPlayer1Turn) || (!isPlayer1 && !isPlayer1Turn);
    
    return (
      <div className={`flex items-center gap-3 p-3 rounded-lg ${currentPlayerStyle} ${className}`}>
        {/* Индикатор хода */}
        {showTurnIndicator && (
          <div className={`w-2 h-2 rounded-full ${turnIndicatorStyle}`} />
        )}

        {/* Цвет игрока */}
        <div
          className="w-8 h-8 rounded-full border-2 flex items-center justify-center"
          style={{
            backgroundColor: player.color === 'white' ? '#f0f0f5' : '#141928',
            borderColor: player.color === 'white' ? '#ffffff' : '#8291af',
          }}
        >
          <span className={`text-xs font-bold ${player.color === 'white' ? 'text-gray-900' : 'text-gray-100'}`}>
            {isPlayer1 ? '1' : '2'}
          </span>
        </div>

        {/* Информация об игроке */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{player.name}</span>
              <span className="text-xs text-gray-400 capitalize">{player.color}</span>
            </div>
            
            {/* Счет */}
            {showScore && (
              <div className="flex items-center gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full border ${
                      i < player.score
                        ? 'bg-yellow-500 border-yellow-500'
                        : 'border-gray-600'
                    }`}
                  />
                ))}
                <span className="ml-1 text-sm font-bold text-yellow-500">
                  {player.score}
                </span>
              </div>
            )}
          </div>

          {/* Статус */}
          <div className="mt-1 flex items-center justify-between">
            <span className={`text-xs ${
              isThisPlayerCurrent ? 'text-yellow-400' : 'text-gray-400'
            }`}>
              {isThisPlayerCurrent ? 'Current turn' : 'Waiting'}
            </span>
            
            {/* Индикатор фазы для текущего игрока */}
            {isThisPlayerCurrent && (
              <span className="text-xs text-gray-400 capitalize">
                {game.boardState.phase}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Если это панель для текущего игрока, показываем только его
  if (isCurrentPlayer) {
    const currentPlayer = isPlayer1Turn ? player1 : player2;
    return renderPlayerPanel(currentPlayer, isPlayer1Turn);
  }

  // Иначе показываем обоих игроков
  return (
    <div className="space-y-2">
      {renderPlayerPanel(player1, true)}
      {renderPlayerPanel(player2, false)}
    </div>
  );
}

// Компонент для отображения подсказки
interface PlayerHintProps {
  hint: string;
  className?: string;
}

export function PlayerHint({ hint, className = '' }: PlayerHintProps) {
  return (
    <div className={`p-3 bg-gray-800 rounded-lg border border-gray-700 ${className}`}>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
        <span className="text-sm text-gray-300">{hint}</span>
      </div>
    </div>
  );
}

// Компонент для отображения статуса игры
interface GameStatusBadgeProps {
  status: HotSeatGameState['status'];
  className?: string;
}

export function GameStatusBadge({ status, className = '' }: GameStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'active':
        return { text: 'Active', color: 'bg-green-500', textColor: 'text-green-100' };
      case 'paused':
        return { text: 'Paused', color: 'bg-yellow-500', textColor: 'text-yellow-100' };
      case 'finished':
        return { text: 'Finished', color: 'bg-red-500', textColor: 'text-red-100' };
      case 'waiting':
        return { text: 'Waiting', color: 'bg-blue-500', textColor: 'text-blue-100' };
      default:
        return { text: 'Unknown', color: 'bg-gray-500', textColor: 'text-gray-100' };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color} ${config.textColor} ${className}`}>
      <div className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {config.text}
    </div>
  );
}

// Компонент для отображения таймера (если включен контроль времени)
interface PlayerTimerProps {
  timeLeft: number; // в миллисекундах
  isActive: boolean;
  playerName: string;
  className?: string;
}

export function PlayerTimer({ timeLeft, isActive, playerName, className = '' }: PlayerTimerProps) {
  // Форматирование времени в MM:SS
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Определяем цвет таймера в зависимости от оставшегося времени
  const getTimerColor = () => {
    const minutesLeft = Math.floor(timeLeft / 60000);
    
    if (minutesLeft < 1) return 'text-red-500';
    if (minutesLeft < 5) return 'text-yellow-500';
    return 'text-green-400';
  };

  return (
    <div className={`p-3 rounded-lg border ${isActive ? 'border-yellow-500 bg-gray-800' : 'border-gray-700 bg-gray-900'} ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-yellow-500 animate-pulse' : 'bg-gray-600'}`} />
          <span className="text-sm font-medium text-gray-300">{playerName}</span>
        </div>
        
        <div className={`text-lg font-mono font-bold ${getTimerColor()}`}>
          {formatTime(timeLeft)}
        </div>
      </div>
      
      {/* Прогресс-бар */}
      {isActive && (
        <div className="mt-2 h-1 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-yellow-500 transition-all duration-1000"
            style={{ width: `${Math.min(100, (timeLeft / (10 * 60 * 1000)) * 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}