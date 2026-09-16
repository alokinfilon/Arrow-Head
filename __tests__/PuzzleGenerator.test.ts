import { PuzzleGenerator } from '../engine/generation/PuzzleGenerator';

describe('PuzzleGenerator', () => {
  test('generates solvable level with solution sequence', () => {
    const width = 6;
    const height = 6;
    const arrowCount = 10;

    const result = PuzzleGenerator.generateSolvableLevel(width, height, arrowCount);
    expect(result.arrows.length).toBeGreaterThan(0);
    expect(result.solution.length).toBe(result.arrows.length);

    const validation = PuzzleGenerator.validateSolvability(width, height, result.arrows);
    expect(validation.isSolvable).toBe(true);
    expect(validation.solutionSequence.length).toBe(result.arrows.length);
  });
});
