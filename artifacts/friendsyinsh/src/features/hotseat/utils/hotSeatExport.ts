import { HotSeatGameState, ExportedGame } from '../types/HotSeatGameState';
import { format } from 'date-fns';

// Экспорт партии в различные форматы
export function exportHotSeatGame(
  game: HotSeatGameState,
  formatType: 'analysis' | 'yinsh-standard' | 'pgn' = 'yinsh-standard'
): ExportedGame {
  switch (formatType) {
    case 'analysis':
      return exportToAnalysisFormat(game);
    case 'yinsh-standard':
      return exportToYinshStandard(game);
    case 'pgn':
      return exportToPGN(game);
    default:
      return exportToYinshStandard(game);
  }
}

// Экспорт в формат для анализа
function exportToAnalysisFormat(game: HotSeatGameState): ExportedGame {
  const analysisData = {
    gameId: game.gameId,
    players: {
      player1: game.players.player1,
      player2: game.players.player2,
    },
    settings: game.settings,
    moves: game.moveHistory.map(move => ({
      moveNumber: move.moveNumber,
      player: move.player,
      action: move.action,
      position: move.position,
      notation: move.notation,
      timestamp: move.timestamp,
    })),
    finalScore: {
      player1: game.players.player1.score,
      player2: game.players.player2.score,
    },
    gameDuration: game.lastMoveAt - game.createdAt,
    createdAt: game.createdAt,
    lastMoveAt: game.lastMoveAt,
    status: game.status,
  };

  return {
    format: 'analysis',
    data: JSON.stringify(analysisData, null, 2),
    metadata: {
      players: [game.players.player1.name, game.players.player2.name],
      date: format(new Date(game.createdAt), 'yyyy-MM-dd HH:mm'),
      moveCount: game.moveHistory.length,
    },
  };
}

// Экспорт в стандартный формат YINSH
function exportToYinshStandard(game: HotSeatGameState): ExportedGame {
  const { player1, player2 } = game.players;
  
  let yinshStandard = `[YINSH "${game.gameId}"]\n`;
  yinshStandard += `[Date "${format(new Date(game.createdAt), 'yyyy.MM.dd')}"]\n`;
  yinshStandard += `[White "${player1.color === 'white' ? player1.name : player2.name}"]\n`;
  yinshStandard += `[Black "${player1.color === 'black' ? player1.name : player2.name}"]\n`;
  yinshStandard += `[Result "${getResultNotation(game)}"]\n`;
  yinshStandard += `[BoardSize "${game.settings.boardSize}"]\n`;
  yinshStandard += `[TimeControl "${game.settings.timeControl ? 'Yes' : 'No'}"]\n\n`;

  // Добавляем ходы в нотации YINSH
  let moveText = '';
  let currentMoveNumber = 1;
  
  for (let i = 0; i < game.moveHistory.length; i += 2) {
    const whiteMove = game.moveHistory[i];
    const blackMove = game.moveHistory[i + 1];
    
    moveText += `${currentMoveNumber}. ${whiteMove?.notation || ''} ${blackMove?.notation || ''}\n`;
    currentMoveNumber++;
  }

  // Если есть нечетное количество ходов
  if (game.moveHistory.length % 2 === 1) {
    const lastMove = game.moveHistory[game.moveHistory.length - 1];
    moveText += `${currentMoveNumber}. ${lastMove.notation}\n`;
  }

  yinshStandard += moveText;
  yinshStandard += `\n${getResultNotation(game)}\n`;

  return {
    format: 'yinsh-standard',
    data: yinshStandard,
    metadata: {
      players: [player1.name, player2.name],
      date: format(new Date(game.createdAt), 'yyyy-MM-dd'),
      moveCount: game.moveHistory.length,
    },
  };
}

// Экспорт в PGN-подобный формат
function exportToPGN(game: HotSeatGameState): ExportedGame {
  const { player1, player2 } = game.players;
  
  let pgn = `[Event "YINSH Hot-Seat Game"]\n`;
  pgn += `[Site "Friends YINSH"]\n`;
  pgn += `[Date "${format(new Date(game.createdAt), 'yyyy.MM.dd')}"]\n`;
  pgn += `[Round "1"]\n`;
  pgn += `[White "${player1.color === 'white' ? player1.name : player2.name}"]\n`;
  pgn += `[Black "${player1.color === 'black' ? player1.name : player2.name}"]\n`;
  pgn += `[Result "${getResultNotation(game)}"]\n`;
  pgn += `[BoardType "Hexagonal"]\n`;
  pgn += `[BoardSize "${game.settings.boardSize}"]\n`;
  pgn += `[TimeControl "${game.settings.timeControl ? 'Standard' : 'None'}"]\n`;
  pgn += `[GameType "Hot-Seat"]\n\n`;

  // Конвертируем ходы в PGN-подобную нотацию
  let moveText = '';
  let currentMoveNumber = 1;
  
  for (let i = 0; i < game.moveHistory.length; i += 2) {
    const whiteMove = game.moveHistory[i];
    const blackMove = game.moveHistory[i + 1];
    
    if (whiteMove) {
      const moveNotation = convertToPGNNotation(whiteMove);
      if (blackMove) {
        const blackNotation = convertToPGNNotation(blackMove);
        moveText += `${currentMoveNumber}. ${moveNotation} ${blackNotation} `;
      } else {
        moveText += `${currentMoveNumber}. ${moveNotation} `;
      }
      currentMoveNumber++;
    }
    
    // Перенос строки каждые 6 ходов для читаемости
    if (currentMoveNumber % 6 === 1) {
      moveText += '\n';
    }
  }

  pgn += moveText.trim();
  pgn += ` ${getResultNotation(game)}\n`;

  return {
    format: 'pgn',
    data: pgn,
    metadata: {
      players: [player1.name, player2.name],
      date: format(new Date(game.createdAt), 'yyyy-MM-dd'),
      moveCount: game.moveHistory.length,
    },
  };
}

// Конвертация хода в PGN-подобную нотацию
function convertToPGNNotation(move: any): string {
  const { q, r } = move.position;
  
  switch (move.action) {
    case 'placeRing':
      return `R${convertCoordinates(q, r)}`;
    case 'moveRing':
      return `M${convertCoordinates(q, r)}`;
    case 'removeRow':
      return `X${convertCoordinates(q, r)}`;
    case 'removeRing':
      return `C${convertCoordinates(q, r)}`;
    default:
      return `?${convertCoordinates(q, r)}`;
  }
}

// Конвертация координат в буквенно-цифровую нотацию
function convertCoordinates(q: number, r: number): string {
  // Для гексагональной доски используем комбинированную нотацию
  const fileLetters = 'abcdefghijklmnopqrstuvwxyz';
  
  // Смещение для отрицательных координат
  const fileIndex = q + 5; // q от -4 до 4, преобразуем в 0-8
  const rank = r + 5; // r от -4 до 4, преобразуем в 1-9
  
  if (fileIndex >= 0 && fileIndex < fileLetters.length) {
    return `${fileLetters[fileIndex]}${rank}`;
  }
  
  return `q${q}r${r}`;
}

// Получение результата игры в стандартной нотации
function getResultNotation(game: HotSeatGameState): string {
  if (game.status !== 'finished') {
    return '*'; // Игра не закончена
  }

  const player1Score = game.players.player1.score;
  const player2Score = game.players.player2.score;

  if (player1Score >= 3) {
    return game.players.player1.color === 'white' ? '1-0' : '0-1';
  } else if (player2Score >= 3) {
    return game.players.player2.color === 'white' ? '1-0' : '0-1';
  }

  return '1/2-1/2'; // Ничья (маловероятно в YINSH)
}

// Скачивание экспортированной партии
export function downloadExportedGame(exported: ExportedGame, filename?: string): void {
  const blob = new Blob([exported.data], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  
  if (!filename) {
    const timestamp = format(new Date(), 'yyyy-MM-dd-HHmm');
    filename = `yinsh-hotseat-${timestamp}.${getFileExtension(exported.format)}`;
  }
  
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Получение расширения файла по формату
function getFileExtension(format: string): string {
  switch (format) {
    case 'analysis':
      return 'json';
    case 'yinsh-standard':
      return 'yinsh';
    case 'pgn':
      return 'pgn';
    default:
      return 'txt';
  }
}

// Копирование в буфер обмена
export async function copyToClipboard(exported: ExportedGame): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(exported.data);
    return true;
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    return false;
  }
}

// Предварительный просмотр экспортированной партии
export function previewExportedGame(exported: ExportedGame): string {
  const maxPreviewLength = 1000;
  
  if (exported.data.length <= maxPreviewLength) {
    return exported.data;
  }
  
  return exported.data.substring(0, maxPreviewLength) + '\n\n... (truncated)';
}