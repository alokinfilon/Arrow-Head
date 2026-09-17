import { DifficultyMetricsResult, OverallDifficultyScore } from './DifficultyScore';

export interface DifficultyReport {
    levelId?: string;
    score: OverallDifficultyScore;
    metrics: DifficultyMetricsResult;
    warnings: string[];
    recommendations: string[];
}

export function generateDifficultyReport(
    metrics: DifficultyMetricsResult,
    score: OverallDifficultyScore,
    levelId?: string
): DifficultyReport {
    const warnings: string[] = [];
    const recommendations: string[] = [];

    if (metrics.branchingFactor.warningMessage) {
        warnings.push(metrics.branchingFactor.warningMessage);
    }

    if (!metrics.visualSymmetry.isHandcraftedFeel) {
        recommendations.push('Consider improving visual symmetry to make level feel less randomly generated.');
    }

    if (!metrics.ahaDifficulty.hasBottleneck) {
        recommendations.push('Level lacks a key bottleneck transition step ("Aha!" moment).');
    }

    if (metrics.chainComplexity.totalCascades === 0) {
        recommendations.push('No chain reactions present. Consider adding blocker-dependency chains for player satisfaction.');
    }

    return {
        levelId,
        score,
        metrics,
        warnings,
        recommendations
    };
}
