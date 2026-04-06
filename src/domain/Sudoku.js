export class Sudoku {
  constructor(initialGrid) {
    // 强制深拷贝
    this.grid = JSON.parse(JSON.stringify(initialGrid));
  }

  getGrid() {
    return JSON.parse(JSON.stringify(this.grid));
  }

  guess({ row, col, value }) {
    this.grid[row][col] = value ?? 0;
  }

  clone() {
    return new Sudoku(this.grid);
  }

  toJSON() {
    return {
      grid: this.getGrid()
    };
  }

  static fromJSON(json) {
    // json 可以是对象或字符串
    const obj = typeof json === 'string' ? JSON.parse(json) : json;
    return new Sudoku(obj.grid);
  }

  toString() {
    return this.grid.map(r => r.map(c => c === 0 ? '.' : c).join(' ')).join('\n');
  }

  // 判断是否已完成且无冲突
  isSolved() {
    for (let i = 0; i < 9; i++) {
      const rowSet = new Set();
      const colSet = new Set();
      for (let j = 0; j < 9; j++) {
        const rowVal = this.grid[i][j];
        const colVal = this.grid[j][i];
        if (!rowVal || rowSet.has(rowVal)) return false;
        if (!colVal || colSet.has(colVal)) return false;
        rowSet.add(rowVal);
        colSet.add(colVal);
      }
    }
    for (let boxRow = 0; boxRow < 3; boxRow++) {
      for (let boxCol = 0; boxCol < 3; boxCol++) {
        const boxSet = new Set();
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 3; j++) {
            const val = this.grid[boxRow * 3 + i][boxCol * 3 + j];
            if (!val || boxSet.has(val)) return false;
            boxSet.add(val);
          }
        }
      }
    }
    return true;
  }

  // 返回所有冲突单元格坐标
  checkConflicts() {
    const conflicts = [];
    for (let i = 0; i < 9; i++) {
      const rowMap = new Map();
      const colMap = new Map();
      for (let j = 0; j < 9; j++) {
        const rowVal = this.grid[i][j];
        const colVal = this.grid[j][i];
        if (rowVal) {
          if (rowMap.has(rowVal)) {
            conflicts.push([i, j]);
            conflicts.push([i, rowMap.get(rowVal)]);
          } else {
            rowMap.set(rowVal, j);
          }
        }
        if (colVal) {
          if (colMap.has(colVal)) {
            conflicts.push([j, i]);
            conflicts.push([colMap.get(colVal), i]);
          } else {
            colMap.set(colVal, j);
          }
        }
      }
    }
    for (let boxRow = 0; boxRow < 3; boxRow++) {
      for (let boxCol = 0; boxCol < 3; boxCol++) {
        const boxMap = new Map();
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 3; j++) {
            const y = boxRow * 3 + i;
            const x = boxCol * 3 + j;
            const val = this.grid[y][x];
            if (val) {
              const key = val;
              if (boxMap.has(key)) {
                conflicts.push([y, x]);
                conflicts.push(boxMap.get(key));
              } else {
                boxMap.set(key, [y, x]);
              }
            }
          }
        }
      }
    }
    return conflicts;
  }
}