export interface LevelCandidate {
    id: string;
    difficultyScore: number; // 0 to 100
}

export type StageIntensity = 'EASY' | 'MEDIUM' | 'HARD' | 'BOSS' | 'BREATHER';

export interface SawtoothStagePattern {
    stageIndex: number;
    intensity: StageIntensity;
    targetScore: number; // Target score 0 to 100
}

/**
 * 10-Stage Sawtooth Emotion Curve Pattern
 * Levels 1 to 10:
 * 1: EASY (20) -> 2: EASY (30) -> 3: MEDIUM (45) -> 4: MEDIUM (55) -> 5: HARD (70)
 * 6: BREATHER (25) -> 7: HARD (75) -> 8: HARD (85) -> 9: BOSS (95) -> 10: BREATHER (30)
 */
export const SAWTOOTH_10_STAGE_PATTERN: SawtoothStagePattern[] = [
    { stageIndex: 1, intensity: 'EASY', targetScore: 20 },
    { stageIndex: 2, intensity: 'EASY', targetScore: 30 },
    { stageIndex: 3, intensity: 'MEDIUM', targetScore: 45 },
    { stageIndex: 4, intensity: 'MEDIUM', targetScore: 55 },
    { stageIndex: 5, intensity: 'HARD', targetScore: 70 },
    { stageIndex: 6, intensity: 'BREATHER', targetScore: 25 },
    { stageIndex: 7, intensity: 'HARD', targetScore: 75 },
    { stageIndex: 8, intensity: 'HARD', targetScore: 85 },
    { stageIndex: 9, intensity: 'BOSS', targetScore: 95 },
    { stageIndex: 10, intensity: 'BREATHER', targetScore: 30 }
];

export interface SequencedChapter {
    pattern: SawtoothStagePattern[];
    levels: Array<{ stage: SawtoothStagePattern; level: LevelCandidate }>;
}

/**
 * Chapter Sequencer: Sorts candidate level pool into a 10-stage Sawtooth emotion curve.
 */
export class TensionCurveSequencer {
    public static sequenceChapter(candidatePool: LevelCandidate[]): SequencedChapter {
        if (candidatePool.length < 10) {
            throw new Error(`Candidate pool must have at least 10 levels (provided ${candidatePool.length}).`);
        }

        const sortedPool = [...candidatePool].sort((a, b) => a.difficultyScore - b.difficultyScore);
        const usedIds = new Set<string>();
        const sequenced: Array<{ stage: SawtoothStagePattern; level: LevelCandidate }> = [];

        for (const stage of SAWTOOTH_10_STAGE_PATTERN) {
            // Find candidate closest to stage targetScore that hasn't been used yet
            let bestCandidate: LevelCandidate | undefined;
            let smallestDelta = Infinity;

            for (const candidate of sortedPool) {
                if (usedIds.has(candidate.id)) continue;
                const delta = Math.abs(candidate.difficultyScore - stage.targetScore);
                if (delta < smallestDelta) {
                    smallestDelta = delta;
                    bestCandidate = candidate;
                }
            }

            if (!bestCandidate) {
                bestCandidate = sortedPool.find(c => !usedIds.has(c.id)) ?? sortedPool[0];
            }

            usedIds.add(bestCandidate.id);
            sequenced.push({ stage, level: bestCandidate });
        }

        return {
            pattern: SAWTOOTH_10_STAGE_PATTERN,
            levels: sequenced
        };
    }
}
