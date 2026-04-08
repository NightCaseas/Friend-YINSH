// Интеграционные тесты для hot-seat модуля
import { createNewHotSeatGame } from '../utils/hotSeatStorage';
import { validateHotSeatMove, applyHotSeatMove, determineWinner } from '../utils/hotSeatGameLogic';

describe('HotSeat Game Integration', () => {
  test('should create a new hot-seat game', () => {
    const game = createNewHotSeatGame('Player 1', 'Player 2');
    
    expect(game).toBeDefined();
    expect(game.gameId).toBeDefined();
    expect(game.status).toBe('active');
    expect(game.currentPlayer).toBe('player1');
    expect(game.players.player1.name).toBe('Player 1');
    expect(game.players.player2.name).toBe('Player 2');
    expect(game.boardState).toBeDefined();
    expect(game.boardState.phase).toBe('setup');
    expect(game.moveHistory).toHaveLength(0);
  });

  test('should validate moves correctly', () => {
    const game = createNewHotSeatGame('Player 1', 'Player 2');
    
    // В фазе setup можно размещать кольца
    const validMove = validateHotSeatMove(game, 'player1', 'placeRing', { x: 0, y: 0 });
    expect(validMove.isValid).toBe(true);
    
    // Нельзя делать ход не в свою очередь
    const wrongPlayerMove = validateHotSeatMove(game, 'player2', 'placeRing', { x: 0, y: 0 });
    expect(wrongPlayerMove.isValid).toBe(false);
    expect(wrongPlayerMove.error).toContain('Not your turn');
  });

  test('should apply moves correctly', () => {
    const game = createNewHotSeatGame('Player 1', 'Player 2');
    
    // Пробуем сделать ход
    const moveResult = applyHotSeatMove(game, {
      player: 'player1',
      action: 'placeRing',
      position: { x: 0, y: 0 }
    });
    
    expect(moveResult.success).toBe(true);
    expect(moveResult.updatedGame).toBeDefined();
    if (moveResult.updatedGame) {
      expect(moveResult.updatedGame.moveHistory).toHaveLength(1);
      expect(moveResult.updatedGame.currentPlayer).toBe('player2');
    }
  });

  test('should determine winner correctly', () => {
    const game = createNewHotSeatGame('Player 1', 'Player 2');
    
    // В начале игры нет победителя
    const winner = determineWinner(game);
    expect(winner).toBeNull();
    
    // Если игрок набрал 3 очка, он должен быть победителем
    const gameWithWinner = {
      ...game,
      players: {
        ...game.players,
        player1: { ...game.players.player1, score: 3 }
      }
    };
    
    const winner2 = determineWinner(gameWithWinner);
    expect(winner2).toBe('player1');
  });

  test('should save and load game from localStorage', () => {
    // Этот тест требует мокинга localStorage
    const mockLocalStorage = {
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
      }
    };

    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    });

    const game = createNewHotSeatGame('Player 1', 'Player 2');
    
    // Сохраняем игру
    const saveResult = saveHotSeatGame(game);
    expect(saveResult).toBe(true);
    
    // Загружаем игру
    const loadedGame = loadCurrentHotSeatGame();
    expect(loadedGame).toBeDefined();
    expect(loadedGame?.gameId).toBe(game.gameId);
    expect(loadedGame?.players.player1.name).toBe('Player 1');
  });
});