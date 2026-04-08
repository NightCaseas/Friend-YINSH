// Экспорт типов
export type {
  HotSeatGameState,
  HotSeatMove,
  StoredHotSeatGame,
  StartHotSeatGameParams,
  HotSeatGameStarted,
  ExportHotSeatGameParams,
  ExportedGame,
} from './types/HotSeatGameState';



// Экспорт контекста и хуков
export {
  HotSeatGameProvider,
  useHotSeatGame,
  useHotSeatGameState,
  useCurrentPlayer,
  useBoardState,
  useGameStatus,
  usePlayersInfo,
  useMoveHistory,
  useGameSettings,
} from './context/HotSeatGameContext';

export {
  useHotSeatGameManager,
  useHotSeatPersistence,
  useHotSeat,
} from './hooks/useHotSeatGame';

// Экспорт компонентов
export {
  HotSeatPlayerPanel,
  PlayerHint,
  GameStatusBadge,
  PlayerTimer,
} from './components/HotSeatPlayerPanel';

export {
  HotSeatControls,
  QuickHotSeatControls,
} from './components/HotSeatControls';

export {
  HotSeatGameOverModal,
  CompactGameOverPanel,
} from './components/HotSeatGameOverModal';

export {
  HotSeatBoard,
  HotSeatGamePage,
} from './components/HotSeatBoard';

