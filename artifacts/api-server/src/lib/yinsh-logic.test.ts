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

console.log("yinsh-logic tests passed");
