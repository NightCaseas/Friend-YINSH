import { useState, useCallback, useEffect } from 'react';
import { HotSeatMove } from '../types/HotSeatGameState';
import { useHotSeatGame } from '../context/HotSeatGameContext';
import { validateHotSeatMove, getAvailableActions, getPlayerHint } from '../utils/hotSeatGameLogic';

// Хук для управления hot-seat игрой
export function useHotSeatGameManager() {
  const context = useHotSeatGame();
  const [selectedRing, setSelectedRing] = useState<{ q: number; r: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Очистка ошибки при изменении состояния
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 3000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [error]);

  // Обработка клика по клетке
  const handleCellClick = useCallback(async (q: number, r: number) => {
    if (!context.state || context.state.status !== 'active' || isProcessing) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const currentPlayer = context.state.currentPlayer;
      const board = context.state.boardState;
      const playerColor = context.state.players[currentPlayer].color;

      // Определяем действие на основе текущей фазы
      let action: HotSeatMove['action'] | null = null;
      
      switch (board.phase) {
        case 'setup':
          action = 'placeRing';
          break;
        
        case 'playing':
          if (!selectedRing) {
            // Выбор кольца для перемещения
            const entity = getEntityAtCell(board, q, r);
            if (entity.type === 'ring' && entity.color === playerColor) {
              setSelectedRing({ q, r });
              return;
            }
          } else {
            // Перемещение выбранного кольца
            action = 'moveRing';
          }
          break;
        
        case 'row-removal':
          action = 'removeRow';
          break;
        
        case 'ring-removal':
          action = 'removeRing';
          break;
        
        default:
          setError('Invalid game phase');
          return;
      }

      // Если действие определено, делаем ход
      if (action) {
        const move: Omit<HotSeatMove, 'moveNumber' | 'timestamp' | 'notation'> = {
          player: currentPlayer,
          action,
          position: { x: q, y: r },
        };

        const success = await context.makeMove(move);
        if (!success) {
          setError('Invalid move');
        } else {
          // Сбрасываем выбранное кольцо после успешного хода
          if (selectedRing) {
            setSelectedRing(null);
          }
        }
      }
    } catch (err) {
      console.error('Error handling cell click:', err);
      setError('An error occurred');
    } finally {
      setIsProcessing(false);
    }
  }, [context, selectedRing, isProcessing]);

  // Получение информации о сущности в клетке
  const getEntityAtCell = useCallback((board: any, q: number, r: number) => {
    const ring = board.rings.find((ring: any) => ring.q === q && ring.r === r);
    if (ring) return { type: 'ring' as const, color: ring.color };
    
    const marker = board.markers.find((marker: any) => marker.q === q && marker.r === r);
    if (marker) return { type: 'marker' as const, color: marker.color };
    
    return { type: 'none' as const };
  }, []);

  // Получение доступных ходов для выбранного кольца
  const getValidMoves = useCallback((q: number, r: number) => {
    if (!context.state?.boardState || !selectedRing) {
      return [];
    }

    // В реальной реализации здесь нужно использовать getValidMoves из yinsh.ts
    // Для упрощения возвращаем пустой массив
    return [];
  }, [context.state, selectedRing]);

  // Получение подсказки для текущего игрока
  const getCurrentHint = useCallback(() => {
    if (!context.state) return '';
    return getPlayerHint(context.state);
  }, [context.state]);

  // Получение доступных действий
  const getAvailablePlayerActions = useCallback(() => {
    if (!context.state) return [];
    return getAvailableActions(context.state);
  }, [context.state]);

  // Проверка, является ли клетка доступной для хода
  const isCellAvailable = useCallback((q: number, r: number) => {
    if (!context.state || context.state.status !== 'active') {
      return false;
    }

    const validation = validateHotSeatMove(
      context.state,
      context.state.currentPlayer,
      'placeRing', // Временно, нужно уточнять действие
      { x: q, y: r }
    );

    return validation.isValid;
  }, [context.state]);

  // Очистка выбранного кольца
  const clearSelection = useCallback(() => {
    setSelectedRing(null);
  }, []);

  // Получение информации о текущем игроке
  const getCurrentPlayerInfo = useCallback(() => {
    if (!context.state) return null;
    
    const player = context.state.players[context.state.currentPlayer];
    return {
      name: player.name,
      color: player.color,
      score: player.score,
    };
  }, [context.state]);

  // Получение информации о сопернике
  const getOpponentInfo = useCallback(() => {
    if (!context.state) return null;
    
    const opponentPlayer = context.state.currentPlayer === 'player1' ? 'player2' : 'player1';
    const player = context.state.players[opponentPlayer];
    
    return {
      name: player.name,
      color: player.color,
      score: player.score,
    };
  }, [context.state]);

  return {
    // Состояние
    gameState: context.state,
    isInitialized: context.isInitialized,
    isSaving: context.isSaving,
    isProcessing,
    selectedRing,
    error,
    
    // Методы
    handleCellClick,
    clearSelection,
    startNewGame: context.startNewGame,
    pauseGame: context.pauseGame,
    resumeGame: context.resumeGame,
    resetGame: context.resetGame,
    saveGame: context.saveGame,
    
    // Информация
    getCurrentHint,
    getAvailablePlayerActions,
    getValidMoves,
    isCellAvailable,
    getCurrentPlayerInfo,
    getOpponentInfo,
    getEntityAtCell,
    
    // Проверки
    isGameOver: context.isGameOver,
    getWinner: context.getWinner,
    
    // Утилиты
    setError,
  };
}

// Хук для управления сохранением hot-seat игр
export function useHotSeatPersistence() {
  const context = useHotSeatGame();
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  // Сохранение игры
  const saveGame = useCallback(async () => {
    if (!context.state) {
      setSaveStatus('error');
      return false;
    }

    setIsLoading(true);
    setSaveStatus('saving');

    try {
      const success = await context.saveGame();
      setSaveStatus(success ? 'success' : 'error');
      
      // Сбрасываем статус успеха через 2 секунды
      if (success) {
        setTimeout(() => setSaveStatus('idle'), 2000);
      }
      
      return success;
    } catch (error) {
      console.error('Error saving game:', error);
      setSaveStatus('error');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [context]);

  // Загрузка сохраненной игры
  const loadSavedGame = useCallback(async (gameId: string) => {
    setIsLoading(true);
    
    try {
      const success = context.loadGame(gameId);
      return success;
    } catch (error) {
      console.error('Error loading game:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [context]);

  // Получение списка сохраненных игр
  const getSavedGames = useCallback(() => {
    // В реальной реализации нужно получать из localStorage
    // Для упрощения возвращаем пустой массив
    return [];
  }, []);

  // Экспорт текущей игры
  const exportGame = useCallback(async (format: 'analysis' | 'yinsh-standard' | 'pgn' = 'yinsh-standard') => {
    if (!context.state) {
      throw new Error('No game to export');
    }

    // Импортируем динамически, чтобы не увеличивать размер бандла
    const { exportHotSeatGame } = await import('../utils/hotSeatExport');
    return exportHotSeatGame(context.state, format);
  }, [context.state]);

  return {
    // Состояние
    isLoading,
    saveStatus,
    
    // Методы
    saveGame,
    loadSavedGame,
    getSavedGames,
    exportGame,
    
    // Информация
    hasUnsavedChanges: context.state && !context.isSaving,
  };
}

// Хук для управления hot-seat игрой (комбинированный)
export function useHotSeat() {
  const gameManager = useHotSeatGameManager();
  const persistence = useHotSeatPersistence();

  return {
    ...gameManager,
    ...persistence,
  };
}