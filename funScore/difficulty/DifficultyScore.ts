import { SolutionDepthResult } from './metrics/SolutionDepth';
import { BranchingFactorResult } from './metrics/BranchingFactor';
import { ChainComplexityResult } from './metrics/ChainComplexity';
import { VisualSymmetryResult } from './metrics/VisualSymmetry';
import { AhaDifficultyResult } from './metrics/AhaDifficulty';

export interface DifficultyMetricsResult {
    solutionDepth: SolutionDepthResult;
    branchingFactor: BranchingFactorResult;
    chainComplexity: ChainComplexityResult;
    visualSymmetry: VisualSymmetryResult;
    ahaDifficulty: AhaDifficultyResult;
}

export interface OverallDifficultyScore {
    rawScore: number;       // 0.0 to 1.0
    displayScore: number;   // 0 to 100
    tier: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
}

/**
 * Calculates overall difficulty score from the 5 core metric outputs.
 * Weight Distribution:
 * - Solution Depth (Arrow Count & Moves): 40%
 * - Branching Factor (Choice Bandwidth): 25%
 * - Chain Complexity (Cascades): 15%
 * - Visual Symmetry (Layout Aesthetic): 10%
 * - Aha Difficulty (Bottleneck Check): 10%
 */
export function calculateOverallDifficultyScore(
    metrics: DifficultyMetricsResult
): OverallDifficultyScore {
    const wDepth = 0.40;
    const wBranching = 0.25;
    const wChain = 0.15;
    const wSymmetry = 0.10;
    const wAha = 0.10;

    const rawScore = (
        metrics.solutionDepth.normalizedScore * wDepth +
        metrics.branchingFactor.normalizedScore * wBranching +
        metrics.chainComplexity.satisfactionScore * wChain +
        metrics.visualSymmetry.overallSymmetryScore * wSymmetry +
        metrics.ahaDifficulty.normalizedScore * wAha
    );

    const clampedRaw = Math.max(0, Math.min(1, rawScore));
    const displayScore = Math.round(clampedRaw * 100);

    let tier: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT' = 'EASY';
    if (displayScore >= 75) {
        tier = 'EXPERT';
    } else if (displayScore >= 50) {
        tier = 'HARD';
    } else if (displayScore >= 25) {
        tier = 'MEDIUM';
    }

    return {
        rawScore: Number(clampedRaw.toFixed(3)),
        displayScore,
        tier
    };
}
