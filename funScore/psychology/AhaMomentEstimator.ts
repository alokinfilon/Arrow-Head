export interface StateSpaceStep {
    stepIndex: number;
    availableMoves: number; // Branching factor b(s)
    freedCount: number;      // Arrows unblocked by this step (Delta Freed)
}

export interface AhaMomentResult {
    hasAhaMoment: boolean;
    ahaStepIndex?: number;
    maxFreedInImpasse: number;
    ahaScore: number; // 0 to 1 scaling
    description: string;
}

/**
 * Evaluates state-space graphs for bottleneck collapses.
 * An "Aha!" moment occurs when a player reaches an impasse state with restricted choices (b(s) <= 1)
 * and executing that single legal move directly unlocks 3 or more blocked arrows (Delta Freed >= 3).
 */
export function evaluateAhaMoment(steps: StateSpaceStep[]): AhaMomentResult {
    if (steps.length === 0) {
        return {
            hasAhaMoment: false,
            maxFreedInImpasse: 0,
            ahaScore: 0,
            description: 'No state steps provided.'
        };
    }

    let maxFreedInImpasse = 0;
    let ahaStepIndex: number | undefined;

    for (const step of steps) {
        // Impasse condition: b(s) <= 1 legal moves
        if (step.availableMoves <= 1) {
            if (step.freedCount > maxFreedInImpasse) {
                maxFreedInImpasse = step.freedCount;
                if (step.freedCount >= 3) {
                    ahaStepIndex = step.stepIndex;
                }
            }
        }
    }

    const hasAhaMoment = maxFreedInImpasse >= 3;
    const ahaScore = Math.min(1.0, maxFreedInImpasse / 5.0);

    const description = hasAhaMoment
        ? `Aha! bottleneck collapse detected at move ${ahaStepIndex} freeing ${maxFreedInImpasse} arrows from an impasse (b(s) <= 1).`
        : `No major bottleneck collapse detected (max freed in impasse: ${maxFreedInImpasse}).`;

    return {
        hasAhaMoment,
        ahaStepIndex,
        maxFreedInImpasse,
        ahaScore: Number(ahaScore.toFixed(2)),
        description
    };
}
