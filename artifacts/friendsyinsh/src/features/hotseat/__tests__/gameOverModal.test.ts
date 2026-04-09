import { createNewHotSeatGame } from '../utils/hotSeatStorage';
import { getHotSeatColorLabel, getHotSeatWinner } from '../components/HotSeatGameOverModal';

describe('HotSeatGameOverModal helpers', () => {
  test('maps colors to english labels', () => {
    expect(getHotSeatColorLabel('white')).toBe('White');
    expect(getHotSeatColorLabel('black')).toBe('Black');
  });

  test('returns winner info only for finished games', () => {
    const game = createNewHotSeatGame('Alice', 'Bob');

    expect(getHotSeatWinner(game)).toBeNull();

    const finishedGame = {
      ...game,
      status: 'finished' as const,
      players: {
        ...game.players,
        player1: { ...game.players.player1, score: 3 },
      },
    };

    expect(getHotSeatWinner(finishedGame)).toEqual({
      key: 'player1',
      name: 'Alice',
      color: 'White',
    });
  });
});
