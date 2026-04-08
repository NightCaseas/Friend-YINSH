// Базовые тесты для hot-seat модуля
import { createNewHotSeatGame } from '../utils/hotSeatStorage';
import { validateHotSeatMove, applyHotSeatMove } from '../utils/hotSeatGameLogic';

describe('Hot-Seat Module', () => {
  describe('createNewHotSeatGame', () => {
    test('creates a new game with correct structure', () => {
      const game = createNewHotSeatGame('Alice', 'Bob');
      
      expect(game).toBeDefined();
      expect(game.gameId).toBeDefined();
      expect(game.status).toBe('active');
      expect(game.currentPlayer).toBe('player1');
      
      // Проверяем игроков
      expect(game.players.player1.name).toBe('Alice');
      expect(game.players.player2.name).toBe('Bob');
      expect(game.players.player1.color).toBeDefined();
      expect(game.players.player2.color).toBeDefined();
      
      // Цвета должны быть разными
      expect(game.players.player1.color).not.toBe(game.players.player2.color);
      
      // Проверяем состояние доски
      expect(game.boardState).toBeDefined();
      expect(game.boardState.phase).toBe('setup');
      expect(game.boardState.turn).toBe('white');
      
      // Проверяем настройки
      expect(game.settings.boardSize).toBe(5);
    });

    test('handles time control option', () => {
      const gameWithTime = createNewHotSeatGame('Alice', 'Bob', 5, true);
      expect(gameWithTime.settings.timeControl).toBeDefined();
      
      const gameWithoutTime = createNewHotSeatGame('Alice', 'Bob', 5, false);
      expect(gameWithoutTime.settings.timeControl).toBeUndefined();
    });
  });

  describe('validateHotSeatMove', () => {
    test('validates setup phase moves correctly', () => {
      const game = createNewHotSeatGame('Alice', 'Bob');
      
      // В фазе setup можно только размещать кольца
      const validation = validateHotSeatMove(game, 'player1', 'placeRing', { x: 0, y: 0 });
      expect(validation.isValid).toBe(true);
      
      // Другие действия в фазе setup недопустимы
      const invalidValidation = validateHotSeatMove(game, 'player1', 'moveRing', { x: 0, y: 0 });
      expect(invalidValidation.isValid).toBe(false);
    });

    test('prevents moves when not player\'s turn', () => {
      const game = createNewHotSeatGame('Alice', 'Bob');
      
      // Игрок 2 пытается сделать ход в свой первый ход (должен быть игрок 1)
      const validation = validateHotSeatMove(game, 'player2', 'placeRing', { x: 0, y: 0 });
      expect(validation.isValid).toBe(false);
      expect(validation.error).toContain('Not your turn');
    });
  });

  describe('applyHotSeatMove', () => {
    test('applies placeRing move in setup phase', () => {
      const game = createNewHotSeatGame('Alice', 'Bob');
      
      const result = applyHotSeatMove(game, {
        player: 'player1',
        action: 'placeRing',
        position: { x: 0, y: 0 },
      });

      expect(result.success).toBe(true);
      expect(result.updatedGame).toBeDefined();
      
      if (result.updatedGame) {
        // После первого хода должен смениться игрок
        expect(result.updatedGame.currentPlayer).toBe('player2');
        expect(result.updatedGame.boardState.ringsPlaced).toBe(1);
        expect(result.updatedGame.moveHistory).toHaveLength(1);
      }
    });

    test('handles invalid moves gracefully', () => {
      const game = createNewHotSeatGame('Alice', 'Bob');
      
      // Попытка сделать недопустимый ход
      const result = applyHotSeatMove(game, {
        player: 'player2', // Не его ход
        action: 'placeRing',
        position: { x: 0, y: 0 },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});

// Моки для тестирования
beforeAll(() => {
  // Мокируем localStorage для тестов
  const localStorageMock = {
    store: {} as Record<string, string>,
    getItem(key: string) {
      return this.store[key] || null;
    },
    setItem(key: string, value: string) {
      this.store[key] = value;
    },
    removeItem(key: string) {
      delete this.store[key];
    },
    clear() {
      this.store = {};
    },
  };
  
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  });
  
  // Мокируем crypto.randomUUID для тестов
  Object.defineProperty(window, 'crypto', {
    value: {
      randomUUID: () => 'test-uuid-123',
    },
  });
});