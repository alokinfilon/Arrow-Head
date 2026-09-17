import { ArrowEntity } from '../../engine/core/Types';
import { calculateSolutionDepth } from './metrics/SolutionDepth';
import { calculateBranchingFactor } from './metrics/BranchingFactor';
import { calculateChainComplexity } from './metrics/ChainComplexity';
import { calculateVisualSymmetry } from './metrics/VisualSymmetry';
import { checkAhaBottleneck } from './metrics/AhaDifficulty';
import { calculateOverallDifficultyScore, DifficultyMetricsResult } from './DifficultyScore';
import { generateDifficultyReport, DifficultyReport } from './DifficultyReport';

export interface LevelEvaluationOptions {
    levelId?: string;
    gridSize?: { width: number; height: number };
    solutionMoves?: number;
    unblockedProgression?: number[];
    cascadeLengths?: number[];
}

export class DifficultyEngine {
    /**
     * Evaluates a puzzle level using the 5 core difficulty metrics.
     */
    public static evaluateLevel(
        arrows: ArrowEntity[],
        options: LevelEvaluationOptions = {}
    ): DifficultyReport {
        const gridSize = options.gridSize ?? { width: 8, height: 8 };

        // 1. Solution Depth / Arrow Count
        const solutionDepth = calculateSolutionDepth(arrows, options.solutionMoves);

        // 2. Branching Factor (default progression if not provided)
        const unblockedProgression = options.unblockedProgression ??
            Array.from({ length: arrows.length }, () => Math.max(1, Math.floor(Math.random() * 3) + 1));
        const branchingFactor = calculateBranchingFactor(unblockedProgression);

        // 3. Chain Complexity (Cascades)
        const cascadeLengths = options.cascadeLengths ?? [1];
        const chainComplexity = calculateChainComplexity(cascadeLengths);

        // 4. Visual Symmetry
        const visualSymmetry = calculateVisualSymmetry(arrows, gridSize);

        // 5. Aha! Difficulty (Bottleneck Check)
        const ahaDifficulty = checkAhaBottleneck(unblockedProgression);

        const metrics: DifficultyMetricsResult = {
            solutionDepth,
            branchingFactor,
            chainComplexity,
            visualSymmetry,
            ahaDifficulty
        };

        const score = calculateOverallDifficultyScore(metrics);

        return generateDifficultyReport(metrics, score, options.levelId);
    }
}
