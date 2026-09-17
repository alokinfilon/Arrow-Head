import { GreedySolver } from '../funScore/solver/GreedySolver';
import { ArrowEntity } from '../engine/core/Types';

describe('GreedySolver', () => {
    const mockGridSize = { width: 6, height: 6 };

    test('solves a simple unblocked level in single forward pass', () => {
        const arrows: ArrowEntity[] = [
            { id: '1', gridX: 0, gridY: 0, direction: 'LEFT' },
            { id: '2', gridX: 5, gridY: 5, direction: 'RIGHT' }
        ];

        const result = GreedySolver.solveLevel(arrows, mockGridSize);
        expect(result.isSolvable).toBe(true);
        expect(result.solutionSequence.length).toBe(2);
        expect(result.remainingArrowCount).toBe(0);
        expect(result.unblockedProgression.length).toBe(2);
    });

    test('detects deadlock when arrows block each other cyclically', () => {
        const deadlockArrows: ArrowEntity[] = [
            { id: '1', gridX: 2, gridY: 2, direction: 'RIGHT' }, // points at (3, 2)
            { id: '2', gridX: 3, gridY: 2, direction: 'LEFT' }   // points at (2, 2)
        ];

        const result = GreedySolver.solveLevel(deadlockArrows, mockGridSize);
        expect(result.isSolvable).toBe(false);
        expect(result.remainingArrowCount).toBe(2);
        expect(result.solutionSequence.length).toBe(0);
    });

    test('solves linear blocker chain and extracts cascade progression', () => {
        const chainArrows: ArrowEntity[] = [
            { id: 'blocker', gridX: 0, gridY: 2, direction: 'LEFT' }, // Unblocked outwards
            { id: 'behind', gridX: 1, gridY: 2, direction: 'LEFT' }   // Blocked by 'blocker' until removed
        ];

        const result = GreedySolver.solveLevel(chainArrows, mockGridSize);
        expect(result.isSolvable).toBe(true);
        expect(result.solutionSequence[0]).toBe('blocker');
        expect(result.solutionSequence[1]).toBe('behind');
        expect(result.unblockedProgression[0]).toBe(1); // 1 unblocked initially
    });
});
