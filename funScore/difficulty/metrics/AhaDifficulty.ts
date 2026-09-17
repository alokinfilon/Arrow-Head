export interface AhaDifficultyResult {
    hasBottleneck: boolean;
    bottleneckStepIndex?: number;
    maxBranchingJump: number;
    normalizedScore: number; // 0 to 1 scaling
    description: string;
}

/**
 * Simplified Aha! Difficulty metric.
 * Keep only as a check for a bottleneck transition where solving a key blocked arrow
 * causes available choices to suddenly expand, providing the "Aha!" moment.
 */
export function checkAhaBottleneck(
    unblockedProgression: number[]
): AhaDifficultyResult {
    if (unblockedProgression.length <= 1) {
        return {
            hasBottleneck: false,
            maxBranchingJump: 0,
            normalizedScore: 0,
            description: 'Level step progression too short to detect bottleneck.'
        };
    }

    let maxBranchingJump = 0;
    let bottleneckStepIndex: number | undefined;

    // Check step-to-step jumps in unblocked available arrows
    for (let i = 1; i < unblockedProgression.length; i++) {
        const jump = unblockedProgression[i] - unblockedProgression[i - 1];
        if (jump > maxBranchingJump) {
            maxBranchingJump = jump;
            bottleneckStepIndex = i;
        }
    }

    // A bottleneck transition is recognized if unblocked count jumps by >= 2
    const hasBottleneck = maxBranchingJump >= 2;
    const normalizedScore = Math.min(1.0, maxBranchingJump / 4.0);

    const description = hasBottleneck
        ? `Bottleneck transition detected at move ${bottleneckStepIndex} with a +${maxBranchingJump} unblock expansion.`
        : 'Smooth progress without distinct bottleneck transition.';

    return {
        hasBottleneck,
        bottleneckStepIndex,
        maxBranchingJump,
        normalizedScore: Math.max(0, Math.min(1, normalizedScore)),
        description
    };
}
