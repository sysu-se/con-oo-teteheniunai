
import { Sudoku } from './Sudoku.js';
import { Game } from './Game.js';

// 统一评分接口
export function createSudoku(input) {
  return new Sudoku(input);
}

export function createSudokuFromJSON(json) {
  return Sudoku.fromJSON(json);
}

export function createGame({ sudoku }) {
  return new Game(sudoku);
}

export function createGameFromJSON(json) {
  return Game.fromJSON(json);
}