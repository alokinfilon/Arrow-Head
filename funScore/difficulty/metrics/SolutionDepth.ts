import { ArrowEntity } from '../../../engine/core/Types';

export interface SolutionDepthResult {
    totalArrows: number;
    solutionDepth: number; // Minimum moves to solve level
    normalizedScore: number; // 0 to 1 scaling (e.g. 12 arrows -> ~0.3, 40 arrows -> ~1.0)
}

/**
 * Calculates difficulty based on total arrow count and minimum solution depth.
 * Baseline: 12 arrows vs 40 arrows is the primary foundation of puzzle difficulty.
 */
export function calculateSolutionDepth(
    arrows: ArrowEntity[],
    solutionMoves?: number
): SolutionDepthResult {
    const totalArrows = arrows.length;
    const moves = solutionMoves ?? totalArrows; // Default to 1 move per arrow if not solved via graph

    // Scale normalized score: 12 arrows => ~0.3, 40+ arrows => 1.0
    const minBaseline = 5;
    const maxBaseline = 40;
    const clampedCount = Math.max(minBaseline, Math.min(maxBaseline, totalArrows));
    const normalizedScore = (clampedCount - minBaseline) / (maxBaseline - minBaseline);

    return {
        totalArrows,
        solutionDepth: moves,
        normalizedScore: Math.max(0, Math.min(1, normalizedScore))
    };
}
