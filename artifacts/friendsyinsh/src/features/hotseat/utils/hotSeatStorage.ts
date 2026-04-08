import { HotSeatGameState, StoredHotSeatGame, HotSeatGameStateSchema, StoredHotSeatGameSchema } from '../types/HotSeatGameState';
import { GameState, createInitialState } from '@/lib/yinsh';

// Ключи для localStorage
const HOTSEAT_GAMES_KEY = 'yinsh-hotseat-games';
const CURRENT_GAME_KEY = 'yinsh-hotseat-current-game';

// Генерация уникального ID игры
function generateGameId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback для старых браузеров или окружений без crypto
  return 'hs-' + Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Генерация новой игры
export function createNewHotSeatGame(
  player1Name: string,
  player2Name: string,
  boardSize: number = 5,
  timeControl?: boolean
): HotSeatGameState {
  const gameId = generateGameId();
  const now = Date.now();
  
  // Определяем цвета игроков случайным образом
  const player1Color: 'white' | 'black' = Math.random() < 0.5 ? 'white' : 'black';
  const player2Color: 'white' | 'black' = player1Color === 'white' ? 'black' : 'white';

  return {
    gameId,
    status: 'active' as const,
    currentPlayer: 'player1' as const,
    players: {
      player1: {
        name: player1Name || 'Player 1',
        color: player1Color,
        score: 0,
      },
      player2: {
        name: player2Name || 'Player 2',
        color: player2Color,
        score: 0,
      },
    },
    boardState: createInitialState(),
    moveHistory: [],
    createdAt: now,
    lastMoveAt: now,
    settings: {
      boardSize,
      timeControl: timeControl ? {
        player1Time: 10 * 60 * 1000, // 10 минут
        player2Time: 10 * 60 * 1000,
      } : undefined,
    },
  };
}

// Сохранение игры в localStorage
export function saveHotSeatGame(game: HotSeatGameState): boolean {
  try {
    const storedGame: StoredHotSeatGame = {
      version: '1.0' as const,
      gameId: game.gameId,
      gameState: game,
    };

    // Валидация перед сохранением
    const validationResult = StoredHotSeatGameSchema.safeParse(storedGame);
    if (!validationResult.success) {
      console.error('Invalid game state:', validationResult.error);
      return false;
    }

    // Сохраняем как текущую игру
    localStorage.setItem(CURRENT_GAME_KEY, JSON.stringify(storedGame));

    // Добавляем в список сохраненных игр
    const savedGames = getSavedHotSeatGames();
    const existingIndex = savedGames.findIndex(g => g.gameId === game.gameId);
    
    if (existingIndex >= 0) {
      savedGames[existingIndex] = storedGame;
    } else {
      savedGames.push(storedGame);
    }

    localStorage.setItem(HOTSEAT_GAMES_KEY, JSON.stringify(savedGames));
    return true;
  } catch (error) {
    console.error('Error saving hot-seat game:', error);
    return false;
  }
}

// Загрузка текущей игры
export function loadCurrentHotSeatGame(): HotSeatGameState | null {
  try {
    const saved = localStorage.getItem(CURRENT_GAME_KEY);
    if (!saved) return null;

    const parsed = JSON.parse(saved);
    const validationResult = StoredHotSeatGameSchema.safeParse(parsed);
    
    if (!validationResult.success) {
      console.error('Invalid stored game:', validationResult.error);
      return null;
    }

    return validationResult.data.gameState;
  } catch (error) {
    console.error('Error loading hot-seat game:', error);
    return null;
  }
}

// Получение списка сохраненных игр
export function getSavedHotSeatGames(): StoredHotSeatGame[] {
  try {
    const saved = localStorage.getItem(HOTSEAT_GAMES_KEY);
    if (!saved) return [];

    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];

    // Валидируем каждую игру
    return parsed.filter(item => {
      const result = StoredHotSeatGameSchema.safeParse(item);
      if (!result.success) {
        console.warn('Invalid stored game in list:', result.error);
      }
      return result.success;
    }).map(item => item as StoredHotSeatGame);
  } catch (error) {
    console.error('Error loading saved games:', error);
    return [];
  }
}

// Удаление игры
export function deleteHotSeatGame(gameId: string): boolean {
  try {
    // Удаляем из списка сохраненных игр
    const savedGames = getSavedHotSeatGames();
    const filteredGames = savedGames.filter(game => game.gameId !== gameId);
    localStorage.setItem(HOTSEAT_GAMES_KEY, JSON.stringify(filteredGames));

    // Если это текущая игра, очищаем текущую игру
    const currentGame = loadCurrentHotSeatGame();
    if (currentGame?.gameId === gameId) {
      localStorage.removeItem(CURRENT_GAME_KEY);
    }

    return true;
  } catch (error) {
    console.error('Error deleting hot-seat game:', error);
    return false;
  }
}

// Очистка всех сохраненных игр
export function clearAllHotSeatGames(): boolean {
  try {
    localStorage.removeItem(HOTSEAT_GAMES_KEY);
    localStorage.removeItem(CURRENT_GAME_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing hot-seat games:', error);
    return false;
  }
}

// Получение игры по ID
export function getHotSeatGameById(gameId: string): HotSeatGameState | null {
  const savedGames = getSavedHotSeatGames();
  const storedGame = savedGames.find(game => game.gameId === gameId);
  return storedGame?.gameState || null;
}

// Валидация состояния игры
export function validateHotSeatGameState(game: any): game is HotSeatGameState {
  const result = HotSeatGameStateSchema.safeParse(game);
  return result.success;
}

// Миграция версий (для будущей обратной совместимости)
export function migrateGameState(storedGame: any): StoredHotSeatGame | null {
  if (!storedGame || typeof storedGame !== 'object') return null;

  // Проверяем версию
  if (storedGame.version === '1.0') {
    const result = StoredHotSeatGameSchema.safeParse(storedGame);
    return result.success ? result.data : null;
  }

  // Здесь можно добавить логику миграции для будущих версий
  // Например, если storedGame.version === '0.9', преобразовать в '1.0'
  
  return null;
}

// Создание резервной копии
export function createBackup(): string {
  try {
    const games = getSavedHotSeatGames();
    const current = localStorage.getItem(CURRENT_GAME_KEY);
    
    return JSON.stringify({
      timestamp: Date.now(),
      games,
      currentGame: current ? JSON.parse(current) : null,
    });
  } catch (error) {
    console.error('Error creating backup:', error);
    return '';
  }
}

// Восстановление из резервной копии
export function restoreFromBackup(backup: string): boolean {
  try {
    const data = JSON.parse(backup);
    
    if (data.games && Array.isArray(data.games)) {
      localStorage.setItem(HOTSEAT_GAMES_KEY, JSON.stringify(data.games));
    }
    
    if (data.currentGame) {
      localStorage.setItem(CURRENT_GAME_KEY, JSON.stringify(data.currentGame));
    }
    
    return true;
  } catch (error) {
    console.error('Error restoring from backup:', error);
    return false;
  }
}