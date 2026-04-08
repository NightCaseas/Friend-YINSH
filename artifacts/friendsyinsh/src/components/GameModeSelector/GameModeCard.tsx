import React from 'react';

interface GameModeCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
  disabled?: boolean;
  isHighlighted?: boolean;
}

export function GameModeCard({
  title,
  description,
  icon,
  color,
  onClick,
  disabled = false,
  isHighlighted = false,
}: GameModeCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative group w-full p-6 rounded-xl border-2 transition-all duration-300 ${
        disabled
          ? 'opacity-50 cursor-not-allowed'
          : 'hover:scale-[1.02] hover:shadow-2xl cursor-pointer'
      } ${isHighlighted ? 'ring-4 ring-yellow-500/30' : ''}`}
      style={{
        backgroundColor: `${color}15`,
        borderColor: disabled ? `${color}40` : `${color}60`,
      }}
    >
      {/* Декоративный уголок */}
      <div
        className="absolute top-0 right-0 w-12 h-12 overflow-hidden"
        style={{ color }}
      >
        <div className="absolute -top-6 -right-6 w-12 h-12 rotate-45">
          {icon}
        </div>
      </div>

      {/* Содержимое */}
      <div className="text-left">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
            style={{ backgroundColor: `${color}30`, color }}
          >
            {icon}
          </div>
          <div>
            <h3 className="text-xl font-bold" style={{ color }}>
              {title}
            </h3>
            <div
              className="text-sm opacity-80 mt-1"
              style={{ color }}
            >
              {description}
            </div>
          </div>
        </div>

        {/* Дополнительная информация */}
        <div className="mt-4 pt-4 border-t" style={{ borderColor: `${color}30` }}>
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color }}>
              {disabled ? 'Coming soon' : 'Click to play'}
            </span>
            {!disabled && (
              <svg
                className="w-5 h-5 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all"
                style={{ color }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* Эффект при наведении */}
      {!disabled && (
        <div
          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-10 transition-opacity"
          style={{ backgroundColor: color }}
        />
      )}
    </button>
  );
}

// Компонент для отображения карточек режимов игры
interface GameModeSelectorProps {
  onSelectMode: (mode: 'online' | 'hotseat' | 'ai' | 'tutorial') => void;
  availableModes?: ('online' | 'hotseat' | 'ai' | 'tutorial')[];
}

export function GameModeSelector({
  onSelectMode,
  availableModes = ['online', 'hotseat', 'ai', 'tutorial'],
}: GameModeSelectorProps) {
  const gameModes = [
    {
      id: 'online' as const,
      title: 'Online Play',
      description: 'Play with friends over the internet in real-time',
      icon: '🌐',
      color: '#3b82f6', // blue-500
    },
    {
      id: 'hotseat' as const,
      title: 'Hot-Seat',
      description: 'Two players on the same device. Take turns making moves',
      icon: '👥',
      color: '#10b981', // emerald-500
    },
    {
      id: 'ai' as const,
      title: 'VS AI',
      description: 'Challenge our intelligent AI opponent',
      icon: '🤖',
      color: '#8b5cf6', // violet-500
    },
    {
      id: 'tutorial' as const,
      title: 'Tutorial',
      description: 'Learn how to play YINSH with interactive lessons',
      icon: '📚',
      color: '#f59e0b', // amber-500
    },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Заголовок */}
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
          Choose Your Game Mode
        </h1>
        <p className="text-gray-300 max-w-2xl mx-auto">
          Select how you want to play YINSH. Each mode offers a unique experience.
        </p>
      </div>

      {/* Карточки режимов */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {gameModes.map((mode) => {
          const isAvailable = availableModes.includes(mode.id);
          const isHotSeat = mode.id === 'hotseat';

          return (
            <GameModeCard
              key={mode.id}
              title={mode.title}
              description={mode.description}
              icon={mode.icon}
              color={mode.color}
              onClick={() => onSelectMode(mode.id)}
              disabled={!isAvailable}
              isHighlighted={isHotSeat && isAvailable}
            />
          );
        })}
      </div>

      {/* Подсказка для hot-seat режима */}
      <div className="mt-8 p-4 bg-emerald-900/20 border border-emerald-800 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="text-2xl">💡</div>
          <div>
            <h4 className="font-medium text-emerald-300 mb-1">
              Hot-Seat Mode Tip
            </h4>
            <p className="text-sm text-emerald-200/80">
              Perfect for playing with a friend on the same device. Game progress is 
              automatically saved, and you can export your matches for analysis.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}