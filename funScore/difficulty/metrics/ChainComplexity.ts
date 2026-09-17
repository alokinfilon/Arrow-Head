export interface ChainComplexityResult {
    totalCascades: number;
    maxCascadeLength: number;
    averageCascadeLength: number;
    satisfactionScore: number; // 0 to 1 scaling
}

/**
 * Measures chain reactions and cascades.
 * Essential: Determines whether clearing a key blocker arrow unlocks multiple downstream arrows,
 * creating a satisfying cascade feel for the player.
 */
export function calculateChainComplexity(
    cascadeLengths: number[]
): ChainComplexityResult {
    if (cascadeLengths.length === 0) {
        return {
            totalCascades: 0,
            maxCascadeLength: 0,
            averageCascadeLength: 0,
            satisfactionScore: 0
        };
    }

    const cascades = cascadeLengths.filter((len) => len > 1);
    const totalCascades = cascades.length;
    const maxCascadeLength = Math.max(0, ...cascadeLengths);
    const sum = cascadeLengths.reduce((acc, val) => acc + val, 0);
    const averageCascadeLength = sum / cascadeLengths.length;

    // Satisfaction score increases with presence of cascades (especially length >= 3)
    const bigCascades = cascadeLengths.filter((len) => len >= 3).length;
    let satisfactionScore = Math.min(1.0, (totalCascades * 0.2) + (bigCascades * 0.3));

    return {
        totalCascades,
        maxCascadeLength,
        averageCascadeLength: Number(averageCascadeLength.toFixed(2)),
        satisfactionScore: Math.max(0, Math.min(1, satisfactionScore))
    };
}
