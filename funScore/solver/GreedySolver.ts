import { ArrowEntity } from '../../engine/core/Types';

export interface SolverResult {
    isSolvable: boolean;
    solutionSequence: string[];     // Arrow IDs in solve order
    unblockedProgression: number[];  // Count of unblocked arrows available at each step b(s)
    cascadeLengths: number[];        // Burst sequence of unblocked arrows freed per tap
    remainingArrowCount: number;
}

/**
 * Lightweight Greedy Puzzle Solver.
 * Single-pass forward clearing algorithm (O(N^2) time, O(N) space).
 * Eliminates A*, BFS/DFS backtracking overhead, and StateGraph memory hazards.
 */
export class GreedySolver {
    public static solveLevel(
        arrows: ArrowEntity[],
        gridSize: { width: number; height: number } = { width: 8, height: 8 }
    ): SolverResult {
        if (arrows.length === 0) {
            return {
                isSolvable: true,
                solutionSequence: [],
                unblockedProgression: [],
                cascadeLengths: [],
                remainingArrowCount: 0
            };
        }

        const remaining = new Map<string, ArrowEntity>();
        for (const arrow of arrows) {
            remaining.set(arrow.id, { ...arrow });
        }

        const solutionSequence: string[] = [];
        const unblockedProgression: number[] = [];
        const cascadeLengths: number[] = [];

        let currentCascade = 0;

        while (remaining.size > 0) {
            // Find all currently unblocked arrows
            const unblocked: ArrowEntity[] = [];
            for (const arrow of remaining.values()) {
                if (this.isArrowClear(arrow, remaining, gridSize)) {
                    unblocked.push(arrow);
                }
            }

            const unblockedCount = unblocked.length;
            unblockedProgression.push(unblockedCount);

            if (unblockedCount === 0) {
                // Deadlock reached (unsolvable level state)
                break;
            }

            // Pick the first unblocked arrow greedily
            const chosen = unblocked[0];
            remaining.delete(chosen.id);
            solutionSequence.push(chosen.id);

            currentCascade++;

            // Check if removing 'chosen' opened up new arrows in the next step
            // If subsequent step unblocked count increases, continue cascade
            if (unblockedCount > 1) {
                cascadeLengths.push(currentCascade);
                currentCascade = 0;
            }
        }

        if (currentCascade > 0) {
            cascadeLengths.push(currentCascade);
        }

        const isSolvable = remaining.size === 0;

        return {
            isSolvable,
            solutionSequence,
            unblockedProgression,
            cascadeLengths,
            remainingArrowCount: remaining.size
        };
    }

    /**
     * Helper checking if an arrow's forward trajectory is clear of other remaining arrows.
     */
    private static isArrowClear(
        target: ArrowEntity,
        remainingMap: Map<string, ArrowEntity>,
        gridSize: { width: number; height: number }
    ): boolean {
        let cx = target.gridX;
        let cy = target.gridY;
        const maxX = gridSize.width - 1;
        const maxY = gridSize.height - 1;

        while (cx >= 0 && cx <= maxX && cy >= 0 && cy <= maxY) {
            if (target.direction === 'RIGHT') cx++;
            else if (target.direction === 'LEFT') cx--;
            else if (target.direction === 'UP') cy--;
            else if (target.direction === 'DOWN') cy++;

            const posKey = `${cx},${cy}`;
            for (const other of remainingMap.values()) {
                if (other.id === target.id) continue;
                if (other.gridX === cx && other.gridY === cy) {
                    return false; // Path blocked by another arrow
                }
            }
        }

        return true; // Path is clear to boundary
    }
}
