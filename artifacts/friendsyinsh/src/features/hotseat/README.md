# Hot-Seat Mode для игры YINSH

Модуль для игры в YINSH двумя игроками на одном устройстве (режим "горячего стула").

## Особенности

- 🎮 **Полностью клиентская реализация** - не требует серверного взаимодействия
- 💾 **Автоматическое сохранение** - игры сохраняются в localStorage браузера
- 📱 **Адаптивный интерфейс** - оптимизирован для мобильных и десктопных устройств
- 📊 **Экспорт партий** - поддержка форматов YINSH Standard, PGN и Analysis
- 🔄 **Интуитивное управление** - визуальные подсказки и индикаторы текущего игрока

## Быстрый старт

### Установка

Модуль уже интегрирован в проект. Для использования импортируйте необходимые компоненты:

```tsx
import { HotSeatGamePage } from '@/features/hotseat';
```

### Базовое использование

```tsx
import { HotSeatGameProvider } from '@/features/hotseat';

function App() {
  return (
    <HotSeatGameProvider>
      <HotSeatGamePage />
    </HotSeatGameProvider>
  );
}
```

## Архитектура

### Структура модуля

```
hotseat/
├── types/                    # TypeScript типы
│   ├── HotSeatGameState.ts   # Типы состояния игры
│   └── ...
├── context/                  # React Context
│   └── HotSeatGameContext.tsx
├── hooks/                    # Кастомные хуки
│   ├── useHotSeatGame.ts     # Хук управления игрой
│   └── useHotSeatPersistence.ts
├── components/               # React компоненты
│   ├── HotSeatBoard.tsx      # Доска с hot-seat логикой
│   ├── HotSeatPlayerPanel.tsx # Панель игрока
│   ├── HotSeatControls.tsx   # Управление игрой
│   └── HotSeatGameOverModal.tsx
├── utils/                    # Вспомогательные функции
│   ├── hotSeatGameLogic.ts   # Логика игры
│   ├── hotSeatStorage.ts     # Работа с localStorage
│   └── hotSeatExport.ts      # Экспорт партий
└── __tests__/               # Тесты
```

### Типы данных

Основные типы данных:

```typescript
interface HotSeatGameState {
  gameId: string;           // Уникальный ID игры
  status: 'active' | 'paused' | 'finished';
  currentPlayer: 'player1' | 'player2';
  players: {
    player1: { name: string; color: PlayerColor; score: number };
    player2: { name: string; color: PlayerColor; score: number };
  };
  boardState: GameState;    // Состояние доски YINSH
  moveHistory: HotSeatMove[]; // История ходов
  settings: {
    boardSize: number;
    timeControl?: {
      player1Time: number;
      player2Time: number;
    };
  };
}
```

## API документация

### Контекст

#### `HotSeatGameProvider`

Провайдер контекста для hot-seat игры. Должен оборачивать все компоненты, использующие hot-seat функциональность.

```tsx
import { HotSeatGameProvider } from '@/features/hotseat';

function App() {
  return (
    <HotSeatGameProvider>
      {/* Ваши компоненты */}
    </HotSeatGameProvider>
  );
}
```

#### `useHotSeatGame()`

Основной хук для доступа к контексту hot-seat игры.

```tsx
const {
  state,           // Текущее состояние игры
  startNewGame,    // Начать новую игру
  makeMove,        // Сделать ход
  pauseGame,       // Поставить игру на паузу
  resumeGame,      // Возобновить игру
  saveGame,        // Сохранить игру
  getWinner,       // Получить победителя
} = useHotSeatGame();
```

### Хуки

#### `useHotSeatGameManager()`

Хук для управления игровым процессом.

```tsx
const {
  gameState,        // Состояние игры
  handleCellClick,  // Обработчик клика по клетке
  selectedRing,     // Выбранное кольцо
  error,            // Текущая ошибка
  isProcessing,     // Идет ли обработка хода
  getCurrentHint,   // Получить подсказку
} = useHotSeatGameManager();
```

#### `useHotSeatPersistence()`

Хук для работы с сохранениями и экспортом.

```tsx
const {
  saveGame,        // Сохранить игру
  exportGame,      // Экспортировать игру
  getSavedGames,   // Получить список сохраненных игр
  isLoading,       // Идет ли загрузка/сохранение
  saveStatus,      // Статус сохранения
} = useHotSeatPersistence();
```

### Компоненты

#### `HotSeatGamePage`

Полноценная страница hot-seat игры со всеми UI элементами.

```tsx
import { HotSeatGamePage } from '@/features/hotseat';

function GameRoute() {
  return <HotSeatGamePage />;
}
```

#### `HotSeatBoard`

Компонент доски с поддержкой hot-seat режима.

```tsx
import { HotSeatBoard } from '@/features/hotseat';

function GameComponent() {
  return (
    <HotSeatBoard
      compact={false}           // Компактный режим для мобильных
      showPlayerPanels={true}   // Показывать панели игроков
      showHint={true}           // Показывать подсказки
    />
  );
}
```

#### `HotSeatControls`

Компонент управления игрой (пауза, сохранение, экспорт).

```tsx
import { HotSeatControls } from '@/features/hotseat';

function GameControls() {
  return (
    <HotSeatControls
      showExport={true}
      showSave={true}
      showPause={true}
      compact={false}
    />
  );
}
```

### Утилиты

#### `exportHotSeatGame(game, format)`

Экспортировать партию в указанный формат.

```tsx
import { exportHotSeatGame } from '@/features/hotseat';

const exported = exportHotSeatGame(game, 'yinsh-standard');
```

#### `downloadExportedGame(exported, filename)`

Скачать экспортированную партию.

```tsx
import { downloadExportedGame } from '@/features/hotseat';

downloadExportedGame(exported, 'my-game.yinsh');
```

## Интеграция с существующей системой

### Маршрутизация

Добавьте маршрут для hot-seat режима:

```tsx
import { Switch, Route } from 'wouter';
import { HotSeatGamePage } from '@/features/hotseat';

function Router() {
  return (
    <Switch>
      <Route path="/play/hotseat" component={HotSeatGamePage} />
      {/* ... другие маршруты ... */}
    </Switch>
  );
}
```

### Выбор режима игры

Используйте компонент `GameModeSelector` для выбора между режимами:

```tsx
import { GameModeSelectorPage } from '@/components/GameModeSelector';

function PlayPage() {
  return <GameModeSelectorPage />;
}
```

## Примеры использования

### Полная интеграция

```tsx
import { HotSeatGameProvider } from '@/features/hotseat';
import { Switch, Route } from 'wouter';
import { HotSeatGamePage } from '@/features/hotseat';
import { GameModeSelectorPage } from '@/components/GameModeSelector';

function App() {
  return (
    <HotSeatGameProvider>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/play" component={GameModeSelectorPage} />
        <Route path="/play/hotseat" component={HotSeatGamePage} />
        <Route path="/game/:roomId/:color" component={OnlineGame} />
      </Switch>
    </HotSeatGameProvider>
  );
}
```

### Кастомизация интерфейса

```tsx
import { HotSeatBoard, HotSeatControls, HotSeatPlayerPanel } from '@/features/hotseat';

function CustomGameInterface({ game }) {
  return (
    <div className="custom-game">
      <div className="sidebar">
        <HotSeatPlayerPanel game={game} isCurrentPlayer={true} />
      </div>
      <div className="main">
        <HotSeatBoard />
        <div className="controls">
          <HotSeatControls compact={true} />
        </div>
      </div>
    </div>
  );
}
```

## Ограничения

1. **Только для браузера** - модуль использует localStorage, который доступен только в браузере
2. **Лимит хранилища** - localStorage обычно ограничен 5-10 МБ
3. **Одно устройство** - игра предназначена для двух игроков на одном устройстве
4. **Без сети** - не требует интернет-соединения после загрузки

## Развитие

Планируемые улучшения:

1. Поддержка контроллера времени с таймерами
2. Расширенная статистика игроков
3. Модуль обучения правилам игры
4. Интеграция с системой рейтингов
5. Офлайн-экспорт в дополнительные форматы

## Лицензия

Модуль является частью проекта Friends YINSH и распространяется под той же лицензией.