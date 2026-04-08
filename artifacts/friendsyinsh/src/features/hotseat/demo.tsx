// Демонстрационный компонент для проверки работы hot-seat модуля
import React, { useEffect } from 'react';
import { HotSeatGameProvider, useHotSeatGame } from './index';

// Простой демо-компонент для проверки работы
function HotSeatDemo() {
  const { state, startNewGame, makeMove, saveGame, isInitialized } = useHotSeatGame();

  useEffect(() => {
    // При загрузке проверяем, есть ли сохраненная игра
    console.log('Hot-Seat module initialized:', isInitialized);
    
    if (!state) {
      console.log('No active game found');
    } else {
      console.log('Active game found:', {
        gameId: state.gameId,
        players: state.players,
        status: state.status,
        moves: state.moveHistory.length,
      });
    }
  }, [isInitialized, state]);

  const handleNewGame = async () => {
    const gameId = await startNewGame({
      player1Name: 'Demo Player 1',
      player2Name: 'Demo Player 2',
      boardSize: 5,
      timeControl: false,
    });
    
    if (gameId) {
      console.log('New game started with ID:', gameId);
      alert(`New game started! ID: ${gameId}`);
    }
  };

  const handleSave = async () => {
    if (state) {
      const success = await saveGame();
      if (success) {
        alert('Game saved successfully!');
      } else {
        alert('Failed to save game');
      }
    }
  };

  const handleDemoMove = async () => {
    if (!state || state.status !== 'active') {
      alert('No active game or game not in active state');
      return;
    }

    // Делаем демо-ход (размещаем кольцо)
    const result = await makeMove({
      player: state.currentPlayer,
      action: 'placeRing',
      position: { x: 0, y: 0 },
    });

    if (result) {
      console.log('Demo move successful');
      alert('Demo move completed! Check console for details.');
    } else {
      alert('Demo move failed - invalid move or game state');
    }
  };

  return (
    <div style={{
      maxWidth: '600px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <h1 style={{ color: '#333', marginBottom: '20px' }}>
        Hot-Seat Module Demo
      </h1>
      
      <div style={{
        backgroundColor: '#f5f5f5',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
      }}>
        <h2 style={{ color: '#555', marginBottom: '15px' }}>Current Game Status</h2>
        
        {state ? (
          <div style={{ lineHeight: '1.6' }}>
            <p><strong>Game ID:</strong> {state.gameId.substring(0, 12)}...</p>
            <p><strong>Status:</strong> {state.status}</p>
            <p><strong>Current Player:</strong> {state.currentPlayer}</p>
            <p><strong>Players:</strong></p>
            <ul style={{ marginLeft: '20px' }}>
              <li>{state.players.player1.name} ({state.players.player1.color}) - Score: {state.players.player1.score}</li>
              <li>{state.players.player2.name} ({state.players.player2.color}) - Score: {state.players.player2.score}</li>
            </ul>
            <p><strong>Moves:</strong> {state.moveHistory.length}</p>
            <p><strong>Game Phase:</strong> {state.boardState.phase}</p>
          </div>
        ) : (
          <p style={{ color: '#777' }}>No active game</p>
        )}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '10px',
        marginBottom: '20px',
      }}>
        <button
          onClick={handleNewGame}
          style={{
            padding: '10px 20px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          New Game
        </button>
        
        <button
          onClick={handleDemoMove}
          disabled={!state || state.status !== 'active'}
          style={{
            padding: '10px 20px',
            backgroundColor: state && state.status === 'active' ? '#2196F3' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: state && state.status === 'active' ? 'pointer' : 'not-allowed',
            fontSize: '16px',
          }}
        >
          Demo Move
        </button>
        
        <button
          onClick={handleSave}
          disabled={!state}
          style={{
            padding: '10px 20px',
            backgroundColor: state ? '#FF9800' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: state ? 'pointer' : 'not-allowed',
            fontSize: '16px',
          }}
        >
          Save Game
        </button>
      </div>

      <div style={{
        backgroundColor: '#e8f5e9',
        padding: '15px',
        borderRadius: '6px',
        borderLeft: '4px solid #4CAF50',
      }}>
        <h3 style={{ color: '#2E7D32', marginBottom: '10px' }}>Module Info</h3>
        <ul style={{ margin: '0', paddingLeft: '20px', color: '#555' }}>
          <li>Storage Key: yinsh-hotseat-current-game</li>
          <li>Auto-save: Enabled (1 second delay)</li>
          <li>Game Format: YINSH Standard</li>
          <li>Mobile Support: Yes (adaptive layout)</li>
          <li>Export Formats: YINSH, PGN, Analysis</li>
        </ul>
      </div>

      <div style={{
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#fff3e0',
        borderRadius: '6px',
        borderLeft: '4px solid #FF9800',
      }}>
        <h4 style={{ color: '#EF6C00', marginBottom: '10px' }}>Test Instructions</h4>
        <ol style={{ margin: '0', paddingLeft: '20px', color: '#555' }}>
          <li>Click "New Game" to create a hot-seat game</li>
          <li>Click "Demo Move" to simulate a move</li>
          <li>Click "Save Game" to manually save</li>
          <li>Refresh the page - game should auto-load</li>
          <li>Check browser console for logs</li>
        </ol>
      </div>
    </div>
  );
}

// Обертка с провайдером
export function HotSeatDemoApp() {
  return (
    <HotSeatGameProvider>
      <HotSeatDemo />
    </HotSeatGameProvider>
  );
}

export default HotSeatDemoApp;