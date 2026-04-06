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
    this.past.push(this.present.clone());
    this.present.guess(move);
    this.future = [];
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
}