import { HotSeatGameState, HotSeatMove } from '../types/HotSeatGameState';
import { GameState, PlayerColor, getValidMoves, findRows, getEntityAt, createInitialState, HEX_DIRECTIONS, isValidCell } from '@/lib/yinsh';

// Валидация хода в hot-seat режиме
export function validateHotSeatMove(
  game: HotSeatGameState,
  player: 'player1' | 'player2',
  action: HotSeatMove['action'],
  position: { x: number; y: number }
): { isValid: boolean; error?: string } {
  // Проверяем, что игра активна
  if (game.status !== 'active') {
    return { isValid: false, error: 'Game is not active' };
  }

  // Проверяем, что это ход текущего игрока
  if (game.currentPlayer !== player) {
    return { isValid: false, error: 'Not your turn' };
  }

  const { x: q, y: r } = position;
  const board = game.boardState;
  const playerColor = game.players[player].color;

  // Валидация в зависимости от фазы игры
  switch (board.phase) {
    case 'setup':
      if (action !== 'placeRing') {
        return { isValid: false, error: 'Only ring placement allowed in setup phase' };
      }

      // Проверяем, что клетка пуста
      const entity = getEntityAt(board, q, r);
      if (entity.type !== 'none') {
        return { isValid: false, error: 'Cell is occupied' };
      }

      // Проверяем, что еще не все кольца размещены (10 колец всего)
      if (board.ringsPlaced >= 10) {
        return { isValid: false, error: 'All rings have been placed' };
      }

      // Проверяем, что игрок еще не разместил все свои кольца (5 колец на игрока)
      const playerRings = board.rings.filter(ring => ring.color === playerColor).length;
      if (playerRings >= 5) {
        return { isValid: false, error: 'You have placed all your rings' };
      }

      break;

    case 'playing':
      if (action !== 'moveRing') {
        return { isValid: false, error: 'Only ring movement allowed in playing phase' };
      }

      // Проверяем, что выбранное кольцо принадлежит игроку
      const selectedEntity = getEntityAt(board, q, r);
      if (selectedEntity.type !== 'ring' || selectedEntity.color !== playerColor) {
        return { isValid: false, error: 'Select your own ring to move' };
      }

      // Не проверяем доступные ходы здесь, так как целевая позиция еще неизвестна
      // Проверка валидности хода будет в applyHotSeatMove, когда известна targetPosition
      
      break;

    case 'row-removal':
      if (action !== 'removeRow') {
        return { isValid: false, error: 'Only row removal allowed in row removal phase' };
      }

      // Находим строки для удаления
      const rows = findRows(board, playerColor);
      if (rows.length === 0) {
        return { isValid: false, error: 'No rows to remove' };
      }

      // Проверяем, что клик был по строке
      const clickedRowIndex = rows.findIndex(row =>
        row.some(cell => cell.q === q && cell.r === r)
      );

      if (clickedRowIndex === -1) {
        return { isValid: false, error: 'Click on a row to remove it' };
      }

      break;

    case 'ring-removal':
      if (action !== 'removeRing') {
        return { isValid: false, error: 'Only ring removal allowed in ring removal phase' };
      }

      // Проверяем, что клик был по кольцу игрока
      const ringEntity = getEntityAt(board, q, r);
      if (ringEntity.type !== 'ring' || ringEntity.color !== playerColor) {
        return { isValid: false, error: 'Select one of your rings to remove' };
      }

      break;

    default:
      return { isValid: false, error: 'Invalid game phase' };
  }

  return { isValid: true };
}

// Применение хода к состоянию игры
export function applyHotSeatMove(
  game: HotSeatGameState,
  move: Omit<HotSeatMove, 'moveNumber' | 'timestamp' | 'notation'>
): { success: boolean; updatedGame?: HotSeatGameState; error?: string } {
  console.log('applyHotSeatMove called:', { 
    action: move.action, 
    position: move.position,
    targetPosition: move.targetPosition,
    player: move.player,
    gamePhase: game.boardState.phase,
    gameTurn: game.boardState.turn
  });
  
  // Валидируем ход
  const validation = validateHotSeatMove(game, move.player, move.action, move.position);
  if (!validation.isValid) {
    console.log('Validation failed:', validation.error);
    return { success: false, error: validation.error };
  }
  console.log('Validation passed');

  const { x: q, y: r } = move.position;
  const updatedGame = { ...game };
  const board = { ...game.boardState };
  const playerColor = game.players[move.player].color;
  const opponentPlayer: 'player1' | 'player2' = move.player === 'player1' ? 'player2' : 'player1';
  const opponentColor = game.players[opponentPlayer].color;

  // Обработка хода в зависимости от действия
  switch (move.action) {
    case 'placeRing': {
      // Добавляем кольцо
      board.rings = [...board.rings, { color: playerColor, q, r }];
      board.ringsPlaced += 1;

      // Если размещено 10 колец, переходим к фазе игры
      if (board.ringsPlaced >= 10) {
        board.phase = 'playing';
        // После размещения последнего кольца ход переходит другому игроку
        board.turn = opponentColor;
        updatedGame.currentPlayer = opponentPlayer;
      } else {
        // Передаем ход следующему игроку
        board.turn = opponentColor;
        updatedGame.currentPlayer = opponentPlayer;
      }
      break;
    }

    case 'moveRing': {
      // Находим кольцо в старой позиции
      const ringIndex = board.rings.findIndex(ring => 
        ring.q === q && ring.r === r && ring.color === playerColor
      );
      
      if (ringIndex === -1) {
        return { success: false, error: 'Ring not found' };
      }

      // Получаем новую позицию из действия move
      const targetPosition = move.targetPosition;
      if (!targetPosition) {
        return { success: false, error: 'Target position not specified' };
      }

      const { x: newX, y: newY } = targetPosition;
      console.log(`Target position: x=${newX}, y=${newY}`);

      // Проверяем валидность хода
      const isValid = isValidRingMove(board, q, r, newX, newY, playerColor);
      if (!isValid) {
        return { success: false, error: 'Invalid move' };
      }

      // Удаляем кольцо со старой позиции
      board.rings.splice(ringIndex, 1);

      // Добавляем маркер на старую позицию
      board.markers = [...board.markers, { color: playerColor, q, r }];

      // Добавляем кольцо на новую позицию
      board.rings.push({ color: playerColor, q: newX, r: newY });

      // Добавляем маркеры на все клетки пути (если есть)
      const pathMarkers = getPathMarkers(q, r, newX, newY);
      if (pathMarkers.length > 0) {
        board.markers = [...board.markers, ...pathMarkers.map(pos => ({ 
          color: playerColor, 
          q: pos.q, 
          r: pos.r 
        }))];
      }

      // После перемещения кольца проверяем строки
      const rows = findRows(board, playerColor);
      if (rows.length > 0) {
        board.phase = 'row-removal';
        board.pendingRemovalRows = rows;
      } else {
        // Передаем ход следующему игроку
        board.turn = opponentColor;
        updatedGame.currentPlayer = opponentPlayer;
      }
      break;
    }

    case 'removeRow': {
      // Удаляем строку маркеров
      const rows = findRows(board, playerColor);
      const rowIndex = rows.findIndex(row =>
        row.some(cell => cell.q === q && cell.r === r)
      );

      if (rowIndex === -1 || !board.pendingRemovalRows[rowIndex]) {
        return { success: false, error: 'Row not found' };
      }

      // Удаляем маркеры из строки
      const rowToRemove = board.pendingRemovalRows[rowIndex];
      board.markers = board.markers.filter(marker =>
        !rowToRemove.some(cell => cell.q === marker.q && cell.r === marker.r)
      );

      // Переходим к фазе удаления кольца
      board.phase = 'ring-removal';
      board.pendingRemovalRows = [];
      break;
    }

    case 'removeRing': {
      console.log(`removeRing: player=${move.player}, playerColor=${playerColor}, opponentPlayer=${opponentPlayer}, opponentColor=${opponentColor}`);
      
      // Находим удаляемое кольцо для логирования
      const removingRing = board.rings.find(ring =>
        ring.q === q && ring.r === r && ring.color === playerColor
      );
      
      // Удаляем кольцо
      board.rings = board.rings.filter(ring =>
        !(ring.q === q && ring.r === r && ring.color === playerColor)
      );

      // Увеличиваем счет игрока, который удалил свое кольцо
      console.log(`Increasing score for ${move.player} who removed their ring`);
      console.log(`Player ${move.player} color: ${playerColor}, removing ring color: ${removingRing?.color}`);
      updatedGame.players[move.player].score += 1;

      // Проверяем, не закончилась ли игра
      if (updatedGame.players[move.player].score >= 3) {
        board.phase = 'finished';
        updatedGame.status = 'finished';
      } else {
        // Проверяем, есть ли строки у противника для удаления
        const opponentRows = findRows(board, opponentColor);
        if (opponentRows.length > 0) {
          board.pendingRemovalRows = opponentRows;
          board.phase = 'row-removal';
          // Ход остается у текущего игрока для удаления строки
        } else {
          // Проверяем, есть ли строки у текущего игрока для удаления
          const playerRows = findRows(board, playerColor);
          if (playerRows.length > 0) {
            board.pendingRemovalRows = playerRows;
            board.phase = 'row-removal';
            // Ход остается у текущего игрока для удаления строки
          } else {
            // Возвращаемся к фазе игры
            board.phase = 'playing';
            // Передаем ход следующему игроку
            board.turn = opponentColor;
            updatedGame.currentPlayer = opponentPlayer;
          }
        }
      }
      break;
}
}

// Проверяет валидность перемещения кольца
function isValidRingMove(
  board: GameState,
  fromQ: number,
  fromR: number,
  toQ: number,
  toR: number,
  playerColor: PlayerColor
): boolean {
  console.log(`isValidRingMove: from (${fromQ}, ${fromR}) to (${toQ}, ${toR}), player: ${playerColor}, phase: ${board.phase}`);
  
  // Используем уже существующую функцию getValidMoves из yinsh.ts
  const validMoves = getValidMoves(board, fromQ, fromR);
  console.log(`Valid moves count: ${validMoves.length}`);
  console.log('Valid moves:', validMoves);
  
  const isValid = validMoves.some(move => move.q === toQ && move.r === toR);
  console.log(`Move is valid: ${isValid}`);
  
  return isValid;
}

// Получает маркеры на пути между двумя точками
function getPathMarkers(
  fromQ: number,
  fromR: number,
  toQ: number,
  toR: number
): { q: number; r: number }[] {
  const markers: { q: number; r: number }[] = [];
  
  // Вычисляем направление
  const dq = toQ - fromQ;
  const dr = toR - fromR;
  
  if (dq === 0 && dr === 0) return markers;
  
  // Находим шаг для каждой координаты
  const stepQ = dq === 0 ? 0 : (dq > 0 ? 1 : -1);
  const stepR = dr === 0 ? 0 : (dr > 0 ? 1 : -1);
  
  // Проверяем, что движение прямолинейное (шестиугольная сетка)
  // В шестиугольной сетке допустимы движения, где q, r или (q+r) постоянны
  if (!(dq === 0 || dr === 0 || dq === -dr)) {
    return markers;
  }
  
  // Проходим по всем промежуточным клеткам, исключая начальную и конечную
  let currentQ = fromQ + stepQ;
  let currentR = fromR + stepR;
  
  while (!(currentQ === toQ && currentR === toR)) {
    // Добавляем все промежуточные клетки
    markers.push({ q: currentQ, r: currentR });
    
    currentQ += stepQ;
    currentR += stepR;
  }
  
  return markers;
}

  // Обновляем состояние доски
  updatedGame.boardState = board;

  // Добавляем ход в историю
  const moveNumber = game.moveHistory.length + 1;
  const timestamp = Date.now();
  const notation = generateNotation(move, playerColor);
  
  const fullMove: HotSeatMove = {
    moveNumber,
    player: move.player,
    action: move.action,
    position: move.position,
    timestamp,
    notation,
  };

  updatedGame.moveHistory = [...game.moveHistory, fullMove];
  updatedGame.lastMoveAt = timestamp;

  return { success: true, updatedGame };
}

// Генерация алгебраической нотации для хода
function generateNotation(
  move: Omit<HotSeatMove, 'moveNumber' | 'timestamp' | 'notation'>,
  playerColor: PlayerColor
): string {
  const { x: q, y: r } = move.position;
  const colorSymbol = playerColor === 'white' ? 'W' : 'B';
  
  switch (move.action) {
    case 'placeRing':
      return `${colorSymbol}R(${q},${r})`;
    case 'moveRing':
      return `${colorSymbol}M(${q},${r})`;
    case 'removeRow':
      return `${colorSymbol}X(${q},${r})`;
    case 'removeRing':
      return `${colorSymbol}C(${q},${r})`;
    default:
      return `${colorSymbol}?(${q},${r})`;
  }
}

// Определение победителя
export function determineWinner(game: HotSeatGameState): 'player1' | 'player2' | null {
  if (game.status !== 'finished') return null;

  if (game.players.player1.score >= 3) return 'player1';
  if (game.players.player2.score >= 3) return 'player2';

  return null;
}

// Получение текущего счета
export function getScore(game: HotSeatGameState): { player1: number; player2: number } {
  return {
    player1: game.players.player1.score,
    player2: game.players.player2.score,
  };
}

// Получение игрока по цвету
export function getPlayerByColor(game: HotSeatGameState, color: PlayerColor): 'player1' | 'player2' {
  return game.players.player1.color === color ? 'player1' : 'player2';
}

// Получение цвета текущего игрока
export function getCurrentPlayerColor(game: HotSeatGameState): PlayerColor {
  return game.players[game.currentPlayer].color;
}

// Проверка, является ли игрок победителем
export function isWinner(game: HotSeatGameState, player: 'player1' | 'player2'): boolean {
  const winner = determineWinner(game);
  return winner === player;
}

// Проверка, закончена ли игра
export function isGameFinished(game: HotSeatGameState): boolean {
  return game.status === 'finished' || game.boardState.phase === 'finished';
}

// Получение доступных действий для текущего игрока
export function getAvailableActions(game: HotSeatGameState): HotSeatMove['action'][] {
  if (game.status !== 'active') return [];

  const board = game.boardState;
  
  switch (board.phase) {
    case 'setup':
      return ['placeRing'];
    case 'playing':
      return ['moveRing'];
    case 'row-removal':
      return ['removeRow'];
    case 'ring-removal':
      return ['removeRing'];
    default:
      return [];
  }
}

// Создание подсказки для игрока
export function getPlayerHint(game: HotSeatGameState): string {
  if (game.status !== 'active') {
    return game.status === 'finished' ? 'Game finished' : 'Game paused';
  }

  const board = game.boardState;
  const playerName = game.players[game.currentPlayer].name;
  const playerColor = getCurrentPlayerColor(game);

  switch (board.phase) {
    case 'setup':
      const playerRings = board.rings.filter(ring => ring.color === playerColor).length;
      return `${playerName} (${playerColor}), place your ring (${5 - playerRings} left)`;
    
    case 'playing':
      return `${playerName} (${playerColor}), select and move your ring`;
    
    case 'row-removal':
      return `${playerName} (${playerColor}), click on a row to remove 5 markers`;
    
    case 'ring-removal':
      return `${playerName} (${playerColor}), click one of your rings to remove it`;
    
    default:
      return `${playerName}'s turn (${playerColor})`;
  }
}