import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { HotSeatGameState, HotSeatMove, StartHotSeatGameParams } from '../types/HotSeatGameState';
import { createNewHotSeatGame, saveHotSeatGame, loadCurrentHotSeatGame } from '../utils/hotSeatStorage';
import { applyHotSeatMove, getPlayerHint, isGameFinished, determineWinner } from '../utils/hotSeatGameLogic';

// Типы для контекста
interface HotSeatGameContextType {
  state: HotSeatGameState | null;
  isInitialized: boolean;
  isSaving: boolean;
  startNewGame: (params: StartHotSeatGameParams) => Promise<string | null>;
  makeMove: (move: Omit<HotSeatMove, 'moveNumber' | 'timestamp' | 'notation'>) => Promise<boolean>;
  pauseGame: () => void;
  resumeGame: () => void;
  resetGame: () => void;
  saveGame: () => Promise<boolean>;
  loadGame: (gameId: string) => boolean;
  getCurrentPlayerHint: () => string;
  isGameOver: () => boolean;
  getWinner: () => 'player1' | 'player2' | null;
}

// Состояние контекста
interface HotSeatGameProviderState {
  game: HotSeatGameState | null;
  isInitialized: boolean;
  isSaving: boolean;
}

// Типы действий
type HotSeatGameAction =
  | { type: 'SET_GAME'; payload: HotSeatGameState }
  | { type: 'UPDATE_GAME'; payload: HotSeatGameState }
  | { type: 'CLEAR_GAME' }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'SET_INITIALIZED'; payload: boolean };

// Создание контекста
const HotSeatGameContext = createContext<HotSeatGameContextType | undefined>(undefined);

// Начальное состояние
const initialState: HotSeatGameProviderState = {
  game: null,
  isInitialized: false,
  isSaving: false,
};

// Редуктор для управления состоянием
function hotSeatGameReducer(
  state: HotSeatGameProviderState,
  action: HotSeatGameAction
): HotSeatGameProviderState {
  switch (action.type) {
    case 'SET_GAME':
      return { ...state, game: action.payload };
    case 'UPDATE_GAME':
      return { ...state, game: action.payload };
    case 'CLEAR_GAME':
      return { ...state, game: null };
    case 'SET_SAVING':
      return { ...state, isSaving: action.payload };
    case 'SET_INITIALIZED':
      return { ...state, isInitialized: action.payload };
    default:
      return state;
  }
}

// Провайдер контекста
export function HotSeatGameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(hotSeatGameReducer, initialState);

  // Инициализация при загрузке
  useEffect(() => {
    const initialize = () => {
      try {
        const savedGame = loadCurrentHotSeatGame();
        if (savedGame) {
          dispatch({ type: 'SET_GAME', payload: savedGame });
        }
        dispatch({ type: 'SET_INITIALIZED', payload: true });
      } catch (error) {
        console.error('Error initializing hot-seat game:', error);
        dispatch({ type: 'SET_INITIALIZED', payload: true });
      }
    };

    initialize();
  }, []);

  // Автосохранение при изменении игры
  useEffect(() => {
    if (state.game && !state.isSaving) {
      const saveGameWithDelay = setTimeout(async () => {
        try {
          dispatch({ type: 'SET_SAVING', payload: true });
          await saveHotSeatGame(state.game!);
        } catch (error) {
          console.error('Error auto-saving game:', error);
        } finally {
          dispatch({ type: 'SET_SAVING', payload: false });
        }
      }, 1000); // Задержка для избежания частых сохранений

      return () => clearTimeout(saveGameWithDelay);
    }
    return undefined;
  }, [state.game]);

  // Методы контекста
  const startNewGame = async (params: StartHotSeatGameParams): Promise<string | null> => {
    try {
      const newGame = createNewHotSeatGame(
        params.player1Name,
        params.player2Name,
        params.boardSize,
        params.timeControl
      );

      dispatch({ type: 'SET_GAME', payload: newGame });
      await saveHotSeatGame(newGame);
      
      return newGame.gameId;
    } catch (error) {
      console.error('Error starting new game:', error);
      return null;
    }
  };

  const makeMove = async (
    move: Omit<HotSeatMove, 'moveNumber' | 'timestamp' | 'notation'>
  ): Promise<boolean> => {
    if (!state.game) {
      console.error('No active game');
      return false;
    }

    try {
      const result = applyHotSeatMove(state.game, move);
      
      if (result.success && result.updatedGame) {
        dispatch({ type: 'UPDATE_GAME', payload: result.updatedGame });
        return true;
      } else {
        console.error('Move failed:', result.error);
        return false;
      }
    } catch (error) {
      console.error('Error making move:', error);
      return false;
    }
  };

  const pauseGame = () => {
    if (state.game && state.game.status === 'active') {
      const updatedGame = { ...state.game, status: 'paused' as const };
      dispatch({ type: 'UPDATE_GAME', payload: updatedGame });
    }
  };

  const resumeGame = () => {
    if (state.game && state.game.status === 'paused') {
      const updatedGame = { ...state.game, status: 'active' as const };
      dispatch({ type: 'UPDATE_GAME', payload: updatedGame });
    }
  };

  const resetGame = () => {
    dispatch({ type: 'CLEAR_GAME' });
    localStorage.removeItem('yinsh-hotseat-current-game');
  };

  const saveGame = async (): Promise<boolean> => {
    if (!state.game) {
      console.error('No game to save');
      return false;
    }

    try {
      dispatch({ type: 'SET_SAVING', payload: true });
      const success = saveHotSeatGame(state.game);
      dispatch({ type: 'SET_SAVING', payload: false });
      return success;
    } catch (error) {
      console.error('Error saving game:', error);
      dispatch({ type: 'SET_SAVING', payload: false });
      return false;
    }
  };

  const loadGame = (gameId: string): boolean => {
    try {
      // В реальной реализации нужно загружать игру по ID
      // Для упрощения просто загружаем текущую сохраненную игру
      const savedGame = loadCurrentHotSeatGame();
      if (savedGame && savedGame.gameId === gameId) {
        dispatch({ type: 'SET_GAME', payload: savedGame });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error loading game:', error);
      return false;
    }
  };

  const getCurrentPlayerHint = (): string => {
    if (!state.game) return 'No active game';
    return getPlayerHint(state.game);
  };

  const isGameOver = (): boolean => {
    if (!state.game) return false;
    return isGameFinished(state.game);
  };

  const getWinner = (): 'player1' | 'player2' | null => {
    if (!state.game) return null;
    return determineWinner(state.game);
  };

  // Значение контекста
  const contextValue: HotSeatGameContextType = {
    state: state.game,
    isInitialized: state.isInitialized,
    isSaving: state.isSaving,
    startNewGame,
    makeMove,
    pauseGame,
    resumeGame,
    resetGame,
    saveGame,
    loadGame,
    getCurrentPlayerHint,
    isGameOver,
    getWinner,
  };

  return (
    <HotSeatGameContext.Provider value={contextValue}>
      {children}
    </HotSeatGameContext.Provider>
  );
}

// Хук для использования контекста
export function useHotSeatGame() {
  const context = useContext(HotSeatGameContext);
  if (context === undefined) {
    throw new Error('useHotSeatGame must be used within a HotSeatGameProvider');
  }
  return context;
}

// Селекторы для оптимизации доступа к состоянию
export function useHotSeatGameState() {
  const { state } = useHotSeatGame();
  return state;
}

export function useCurrentPlayer() {
  const { state } = useHotSeatGame();
  return state?.currentPlayer || null;
}

export function useBoardState() {
  const { state } = useHotSeatGame();
  return state?.boardState || null;
}

export function useGameStatus() {
  const { state } = useHotSeatGame();
  return state?.status || null;
}

export function usePlayersInfo() {
  const { state } = useHotSeatGame();
  return state?.players || null;
}

export function useMoveHistory() {
  const { state } = useHotSeatGame();
  return state?.moveHistory || [];
}

export function useGameSettings() {
  const { state } = useHotSeatGame();
  return state?.settings || null;
}