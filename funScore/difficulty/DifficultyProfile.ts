export interface TargetDifficultyProfile {
    name: string;
    minScore: number;
    maxScore: number;
    targetArrowCount: number;
    maxAllowedBranching: number;
}

export const DIFFICULTY_PROFILES: Record<string, TargetDifficultyProfile> = {
    CASUAL: {
        name: 'Casual',
        minScore: 0,
        maxScore: 35,
        targetArrowCount: 12,
        maxAllowedBranching: 4.0
    },
    STANDARD: {
        name: 'Standard',
        minScore: 35,
        maxScore: 65,
        targetArrowCount: 24,
        maxAllowedBranching: 5.0
    },
    CHALLENGE: {
        name: 'Challenge',
        minScore: 65,
        maxScore: 100,
        targetArrowCount: 40,
        maxAllowedBranching: 5.0
    }
};
