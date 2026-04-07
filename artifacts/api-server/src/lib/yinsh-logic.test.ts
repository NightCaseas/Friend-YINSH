import assert from "node:assert/strict";
import { applyMove, createInitialState, type GameState } from "./yinsh-logic.js";

function makeRowState(player: "white" | "black"): GameState {
  const state = createInitialState();
  state.phase = "playing";
  state.currentPlayer = player;
  state.rings = [
    { color: player, q: -4, r: 0 },
  ];
  state.board["-4,0"] = { type: "ring", player };
  const opponent = player === "white" ? "black" : "white";
  state.board["-3,0"] = { type: "marker", player: opponent };
  state.board["-2,0"] = { type: "marker", player: opponent };
  state.board["-1,0"] = { type: "marker", player: opponent };
  state.board["0,0"] = { type: "marker", player: opponent };
  return state;
}

{
  const state = makeRowState("white");
  const result = applyMove(state, { type: "move-ring", fromQ: -4, fromR: 0, toQ: 1, toR: 0 }, "white");
  assert.equal(result.error, undefined);
  assert.equal(result.state.phase, "row-removal");
  assert.equal(result.state.pendingRowPlayer, "white");
  assert.equal(result.state.pendingRows.length > 0, true);
}

{
  const state = makeRowState("black");
  const result = applyMove(state, { type: "move-ring", fromQ: -4, fromR: 0, toQ: 1, toR: 0 }, "black");
  assert.equal(result.error, undefined);
  assert.equal(result.state.phase, "row-removal");
  assert.equal(result.state.pendingRowPlayer, "black");
  assert.equal(result.state.pendingRows.length > 0, true);
}

{
  const state = makeRowState("white");
  const moved = applyMove(state, { type: "move-ring", fromQ: -4, fromR: 0, toQ: 1, toR: 0 }, "white");
  assert.equal(moved.error, undefined);

  const removedRow = applyMove(moved.state, { type: "remove-row", rowIndex: 0 }, "white");
  assert.equal(removedRow.error, undefined);
  assert.equal(removedRow.state.phase, "ring-removal");
  assert.equal(removedRow.state.pendingRows.length, 0);
  assert.equal(removedRow.state.pendingRowPlayer, "white");
}

{
  const state = createInitialState();
  state.phase = "ring-removal";
  state.pendingRowPlayer = "white";
  state.ringsCaptured.white = 2;
  state.ringsOnBoard.white = 3;
  state.rings = [{ color: "white", q: 0, r: 0 }];
  state.board["0,0"] = { type: "ring", player: "white" };

  const removedRing = applyMove(state, { type: "remove-ring", q: 0, r: 0 }, "white");
  assert.equal(removedRing.error, undefined);
  assert.equal(removedRing.state.phase, "finished");
  assert.equal(removedRing.state.winner, "white");
  assert.equal(removedRing.state.ringsCaptured.white, 3);
}

{
  const state = createInitialState();
  state.phase = "ring-removal";
  state.pendingRowPlayer = "black";
  state.ringsCaptured.black = 2;
  state.ringsOnBoard.black = 3;
  state.rings = [{ color: "black", q: 0, r: 0 }];
  state.board["0,0"] = { type: "ring", player: "black" };

  const removedRing = applyMove(state, { type: "remove-ring", q: 0, r: 0 }, "black");
  assert.equal(removedRing.error, undefined);
  assert.equal(removedRing.state.phase, "finished");
  assert.equal(removedRing.state.winner, "black");
  assert.equal(removedRing.state.ringsCaptured.black, 3);
}

console.log("yinsh-logic tests passed");
