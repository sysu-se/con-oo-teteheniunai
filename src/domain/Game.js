import { Sudoku } from './Sudoku.js';

export class Game {
  constructor(sudoku) {
    this.present = sudoku.clone();
    this.past = [];
    this.future = [];
    this.initial = sudoku.clone();
  }

  getSudoku() {
    return this.present.clone();
  }

  guess(move) {
    const next = this.present.clone();
    const changed = next.guess(move);
    if (!changed) {
      return false;
    }

    this.past.push(this.present.clone());
    this.present = next;
    this.future = [];
    return true;
  }

  applyHint(move) {
    const changed = this.present.guess(move);
    if (!changed) {
      return false;
    }

    this.future = [];
    return true;
  }

  undo() {
    if (!this.canUndo()) return;
    this.future.push(this.present.clone());
    this.present = this.past.pop();
  }

  redo() {
    if (!this.canRedo()) return;
    this.past.push(this.present.clone());
    this.present = this.future.pop();
  }

  canUndo() {
    return this.past.length > 0;
  }

  canRedo() {
    return this.future.length > 0;
  }

  reset() {
    this.present = this.initial.clone();
    this.past = [];
    this.future = [];
  }

  loadProgress(progressGrid) {
    const restored = this.initial.clone();

    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const value = progressGrid[row][col];
        if (value !== 0 && !restored.isGiven(row, col)) {
          restored.guess({ row, col, value });
        }
      }
    }

    this.present = restored;
    this.past = [];
    this.future = [];
  }

  isSolved() {
    return this.present.isSolved();
  }

  checkConflicts() {
    return this.present.checkConflicts();
  }

  toJSON() {
    return {
      present: this.present.toJSON(),
      past: this.past.map(s => s.toJSON()),
      future: this.future.map(s => s.toJSON()),
      initial: this.initial.toJSON()
    };
  }

  static fromJSON(json) {
    const obj = typeof json === 'string' ? JSON.parse(json) : json;
    const game = new Game(Sudoku.fromJSON(obj.initial));
    game.present = Sudoku.fromJSON(obj.present);
    game.past = obj.past.map(Sudoku.fromJSON);
    game.future = obj.future.map(Sudoku.fromJSON);
    return game;
  }

  isGiven(row, col) {
    return this.present.isGiven(row, col);
  }
}