export interface BranchingFactorResult {
    averageBranching: number;
    isSingleTrack: boolean; // b <= 1.1
    isChaotic: boolean;     // b > 5.0
    normalizedScore: number; // Optimal range is 1.5 - 3.5
    warningMessage?: string;
}

/**
 * Measures the average number of available (unblocked) moves per state.
 * Essential: Prevents trivial/chaotic levels (b > 5) and single-track levels (b = 1).
 */
export function calculateBranchingFactor(
    unblockedCountsPerStep: number[]
): BranchingFactorResult {
    if (unblockedCountsPerStep.length === 0) {
        return {
            averageBranching: 0,
            isSingleTrack: true,
            isChaotic: false,
            normalizedScore: 0,
            warningMessage: 'Empty level path'
        };
    }

    const sum = unblockedCountsPerStep.reduce((acc, val) => acc + val, 0);
    const averageBranching = sum / unblockedCountsPerStep.length;

    const isSingleTrack = averageBranching <= 1.1;
    const isChaotic = averageBranching > 5.0;

    let warningMessage: string | undefined;
    if (isSingleTrack) {
        warningMessage = 'Level is single-track (b ≈ 1). Player has virtually no choices.';
    } else if (isChaotic) {
        warningMessage = 'Level is overly chaotic (b > 5). Too many unblocked arrows available at once.';
    }

    // Score peaking in the sweet spot (b = 2.0 to 3.5)
    let normalizedScore = 0;
    if (averageBranching <= 1.0) {
        normalizedScore = 0.1;
    } else if (averageBranching <= 3.0) {
        normalizedScore = 0.4 + ((averageBranching - 1.0) / 2.0) * 0.6; // 0.4 -> 1.0
    } else if (averageBranching <= 5.0) {
        normalizedScore = 1.0 - ((averageBranching - 3.0) / 2.0) * 0.5; // 1.0 -> 0.5
    } else {
        normalizedScore = 0.2; // Overly chaotic
    }

    return {
        averageBranching: Number(averageBranching.toFixed(2)),
        isSingleTrack,
        isChaotic,
        normalizedScore: Math.max(0, Math.min(1, normalizedScore)),
        warningMessage
    };
}
