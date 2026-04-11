import { describe, expect, it } from 'vitest'
import { loadDomainApi, makePuzzle } from './helpers/domain-api.js'

describe('HW1 domain invariants', () => {
	it('rejects invalid sudoku grids and payloads', async () => {
		const { createSudoku, createSudokuFromJSON } = await loadDomainApi()

		expect(() => createSudoku([])).toThrow()
		expect(() => createSudoku([[], [], [], [], [], [], [], [], []])).toThrow()
		expect(() => createSudokuFromJSON({})).toThrow()
	})

	it('protects fixed cells and ignores no-op guesses in history', async () => {
		const { createGame, createSudoku } = await loadDomainApi()
		const game = createGame({ sudoku: createSudoku(makePuzzle()) })

		expect(game.isGiven(0, 0)).toBe(true)
		expect(game.isGiven(0, 2)).toBe(false)
		expect(() => game.guess({ row: 0, col: 0, value: 1 })).toThrow()

		expect(game.guess({ row: 0, col: 2, value: 4 })).toBe(true)
		expect(game.canUndo()).toBe(true)

		expect(game.guess({ row: 0, col: 2, value: 4 })).toBe(false)
		game.undo()
		expect(game.getSudoku().getGrid()[0][2]).toBe(0)
		expect(game.canUndo()).toBe(false)
	})

	it('returns deduplicated conflict objects with semantic reasons', async () => {
		const { createSudoku } = await loadDomainApi()
		const grid = makePuzzle().map(row => row.slice())
		grid[0][0] = 1
		grid[0][1] = 1
		grid[1][0] = 1

		const sudoku = createSudoku(grid)
		const conflicts = sudoku.checkConflicts()
		const uniqueKeys = new Set(conflicts.map(conflict => `${conflict.row},${conflict.col}`))

		expect(uniqueKeys.size).toBe(conflicts.length)
		expect(conflicts).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ row: 0, col: 0, value: 1 }),
			])
		)
		expect(conflicts.every(conflict => Array.isArray(conflict.reasons))).toBe(true)
		expect(conflicts.find(conflict => conflict.row === 0 && conflict.col === 0).reasons).toEqual(
			expect.arrayContaining(['row', 'col', 'box'])
		)
	})
})