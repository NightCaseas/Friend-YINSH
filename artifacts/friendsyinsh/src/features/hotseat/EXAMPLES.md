# Hot-Seat Module Examples

## Быстрый старт

### 1. Использование готового компонента

```tsx
import { HotSeatGamePage } from '@/features/hotseat';

function App() {
  return (
    <div className="app">
      <HotSeatGamePage />
    </div>
  );
}
```

### 2. Интеграция с существующей навигацией

```tsx
import { Switch, Route } from 'wouter';
import { HotSeatGamePage } from '@/features/hotseat';
import { GameModeSelectorPage } from '@/components/GameModeSelector';

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/play" component={GameModeSelectorPage} />
      <Route path="/play/hotseat" component={HotSeatGamePage} />
      {/* ... другие маршруты ... */}
    </Switch>
  );
}
```

## Использование API

### 1. Создание новой игры

```tsx
import { useHotSeatGame } from '@/features/hotseat';

function NewGameButton() {
  const { startNewGame } = useHotSeatGame();

  const handleClick = async () => {
    const gameId = await startNewGame({
      player1Name: 'Alice',
      player2Name: 'Bob',
      boardSize: 5,
      timeControl: true,
    });
    
    if (gameId) {
      console.log('Game started with ID:', gameId);
    }
  };

  return (
    <button onClick={handleClick}>
      Start Hot-Seat Game
    </button>
  );
}
```

### 2. Обработка ходов

```tsx
import { useHotSeatGameManager } from '@/features/hotseat';

function GameBoard() {
  const { handleCellClick, gameState } = useHotSeatGameManager();

  // Использование с существующей доской YINSH
  return (
    <YinshBoard
      state={gameState?.boardState}
      onCellClick={handleCellClick}
      // ... другие пропсы
    />
  );
}
```

### 3. Работа с сохранениями

```tsx
import { useHotSeatPersistence } from '@/features/hotseat';

function GameControls() {
  const { saveGame, exportGame, isLoading } = useHotSeatPersistence();

  const handleSave = async () => {
    const success = await saveGame();
    if (success) {
      alert('Game saved!');
    }
  };

  const handleExport = async () => {
    const exported = await exportGame('yinsh-standard');
    // Скачать файл или скопировать в буфер
  };

  return (
    <div>
      <button onClick={handleSave} disabled={isLoading}>
        {isLoading ? 'Saving...' : 'Save Game'}
      </button>
      <button onClick={handleExport}>
        Export Game
      </button>
    </div>
  );
}
```

## Компоненты UI

### 1. Панель игрока

```tsx
import { HotSeatPlayerPanel, PlayerHint } from '@/features/hotseat';

function GameSidebar({ game }) {
  return (
    <div className="sidebar">
      <HotSeatPlayerPanel
        game={game}
        isCurrentPlayer={true}
        showScore={true}
        showTurnIndicator={true}
      />
      <PlayerHint hint="Your turn to place a ring" />
    </div>
  );
}
```

### 2. Элементы управления

```tsx
import { HotSeatControls, QuickHotSeatControls } from '@/features/hotseat';

function GameHeader() {
  return (
    <header>
      <QuickHotSeatControls />
      {/* Или полная версия: */}
      <HotSeatControls
        showExport={true}
        showSave={true}
        showPause={true}
        compact={false}
      />
    </header>
  );
}
```

### 3. Модальное окно окончания игры

```tsx
import { HotSeatGameOverModal } from '@/features/hotseat';

function GameOverScreen({ game, onNewGame, onClose }) {
  return (
    <HotSeatGameOverModal
      game={game}
      onNewGame={onNewGame}
      onClose={onClose}
      onExport={(format) => {
        console.log('Exporting in format:', format);
      }}
    />
  );
}
```

## Утилиты

### 1. Экспорт партий

```tsx
import { exportHotSeatGame, downloadExportedGame } from '@/features/hotseat';

async function exportAndDownload(game) {
  // Экспорт в различные форматы
  const exported = exportHotSeatGame(game, 'yinsh-standard');
  
  // Скачать файл
  downloadExportedGame(exported, 'my-game.yinsh');
  
  // Или экспорт в PGN
  const pgnExport = exportHotSeatGame(game, 'pgn');
  downloadExportedGame(pgnExport, 'my-game.pgn');
  
  // Или для анализа
  const analysisExport = exportHotSeatGame(game, 'analysis');
  console.log(JSON.parse(analysisExport.data));
}
```

### 2. Работа с сохранениями

```tsx
import {
  saveHotSeatGame,
  loadCurrentHotSeatGame,
  getSavedHotSeatGames,
  deleteHotSeatGame,
} from '@/features/hotseat';

// Сохранение игры
const success = saveHotSeatGame(game);

// Загрузка текущей игры
const currentGame = loadCurrentHotSeatGame();

// Получение списка сохраненных игр
const savedGames = getSavedHotSeatGames();

// Удаление игры
deleteHotSeatGame(gameId);
```

## Интеграция с TypeScript

### 1. Типы данных

```typescript
import type {
  HotSeatGameState,
  HotSeatMove,
  StartHotSeatGameParams,
} from '@/features/hotseat';

// Типизация пропсов компонента
interface GameProps {
  game: HotSeatGameState;
  onMove: (move: HotSeatMove) => void;
}

// Типизация параметров начала игры
const gameParams: StartHotSeatGameParams = {
  player1Name: 'Player 1',
  player2Name: 'Player 2',
  boardSize: 5,
  timeControl: false,
};
```

### 2. Валидация данных

```typescript
import { validateHotSeatGameState } from '@/features/hotseat';

function loadAndValidateGame(gameData: unknown) {
  if (validateHotSeatGameState(gameData)) {
    // gameData теперь типизирован как HotSeatGameState
    return gameData;
  }
  throw new Error('Invalid game data');
}
```

## Адаптивный дизайн

### 1. Мобильная версия

```tsx
import { HotSeatBoard } from '@/features/hotseat';

function MobileGame() {
  return (
    <HotSeatBoard
      compact={true}
      showPlayerPanels={true}
      showHint={true}
      className="mobile-game"
    />
  );
}
```

### 2. Десктопная версия

```tsx
function DesktopGame() {
  return (
    <HotSeatBoard
      compact={false}
      showPlayerPanels={true}
      showHint={true}
      showControls={true}
      className="desktop-game"
    />
  );
}
```

## Обработка ошибок

```tsx
import { useHotSeatGameManager } from '@/features/hotseat';

function ErrorHandlingExample() {
  const { error, setError, gameState } = useHotSeatGameManager();

  // Автоматическая очистка ошибок
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [error, setError]);

  return (
    <div>
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
    </div>
  );
}
```

## Лучшие практики

1. **Всегда оборачивайте в HotSeatGameProvider** - это обеспечивает доступ к контексту игры.

2. **Используйте готовые компоненты** - они уже содержат всю необходимую логику и адаптивный дизайн.

3. **Автосохранение включено по умолчанию** - игра автоматически сохраняется после каждого хода.

4. **Экспортируйте важные партии** - используйте функцию экспорта для сохранения партий вне браузера.

5. **Проверяйте поддержку localStorage** - модуль имеет graceful degradation при отсутствии localStorage.

6. **Используйте TypeScript** - все типы экспортируются для удобства разработки.