import { evaluateAhaMoment } from '../funScore/psychology/AhaMomentEstimator';
import { calculateCognitiveLoad } from '../funScore/psychology/CognitiveLoad';
import { TensionCurveSequencer, LevelCandidate } from '../funScore/psychology/TensionCurve';
import { evaluateDecoyExploration } from '../funScore/psychology/DecoyExploration';
import { DifficultyScaler } from '../funScore/difficulty/DifficultyScaler';
import { ArrowEntity } from '../engine/core/Types';
import { DifficultyReport } from '../funScore/difficulty/DifficultyReport';

describe('Psychology & Flow Engine Modules', () => {
    const mockGridSize = { width: 8, height: 8 };

    test('AhaMomentEstimator detects impasse bottleneck collapse', () => {
        const steps = [
            { stepIndex: 1, availableMoves: 3, freedCount: 1 },
            { stepIndex: 2, availableMoves: 1, freedCount: 4 }, // b(s) <= 1 and Delta Freed = 4 >= 3
            { stepIndex: 3, availableMoves: 4, freedCount: 1 }
        ];

        const result = evaluateAhaMoment(steps);
        expect(result.hasAhaMoment).toBe(true);
        expect(result.ahaStepIndex).toBe(2);
        expect(result.maxFreedInImpasse).toBe(4);
    });

    test('CognitiveLoad calculates trajectory intersections and blocker count', () => {
        const arrows: ArrowEntity[] = [
            { id: '1', gridX: 0, gridY: 0, direction: 'RIGHT' },
            { id: '2', gridX: 4, gridY: 0, direction: 'LEFT' },
            { id: '3', gridX: 2, gridY: 0, direction: 'DOWN' }
        ];

        const load = calculateCognitiveLoad(arrows, mockGridSize);
        expect(load.totalArrows).toBe(3);
        expect(load.activeBlockers).toBeGreaterThan(0);
        expect(load.cognitiveLoadScore).toBeGreaterThan(0);
    });

    test('TensionCurveSequencer sequences 10-stage Sawtooth emotion curve', () => {
        const candidatePool: LevelCandidate[] = Array.from({ length: 20 }, (_, i) => ({
            id: `lvl_${i + 1}`,
            difficultyScore: (i + 1) * 5 // Scores 5, 10, 15, ..., 100
        }));

        const sequenced = TensionCurveSequencer.sequenceChapter(candidatePool);
        expect(sequenced.levels.length).toBe(10);
        expect(sequenced.levels[0].stage.intensity).toBe('EASY');
        expect(sequenced.levels[8].stage.intensity).toBe('BOSS'); // Level 9 is BOSS
        expect(sequenced.levels[9].stage.intensity).toBe('BREATHER'); // Level 10 is BREATHER
    });

    test('DecoyExploration detects misleading boundary decoy arrows', () => {
        const boundaryArrows: ArrowEntity[] = [
            { id: '1', gridX: 0, gridY: 0, direction: 'RIGHT' }, // Boundary facing inward towards grid
            { id: '2', gridX: 4, gridY: 0, direction: 'LEFT' }   // Internal blocker
        ];

        const decoyResult = evaluateDecoyExploration(boundaryArrows, mockGridSize);
        expect(decoyResult.totalBoundaryArrows).toBeGreaterThan(0);
        expect(decoyResult.decoyArrowCount).toBeGreaterThan(0);
    });

    test('DifficultyScaler evaluates Flow Zone (Boredom vs Flow vs Anxiety)', () => {
        const mockReport: DifficultyReport = {
            score: { rawScore: 0.5, displayScore: 50, tier: 'HARD' },
            metrics: {} as any,
            warnings: [],
            recommendations: []
        };

        const flowEval = DifficultyScaler.evaluateFlowState(mockReport, 'STANDARD');
        expect(flowEval.flowZone).toBe('FLOW');
        expect(flowEval.isAcceptedForTarget).toBe(true);

        const easyReport: DifficultyReport = {
            score: { rawScore: 0.1, displayScore: 10, tier: 'EASY' },
            metrics: {} as any,
            warnings: [],
            recommendations: []
        };
        const boredomEval = DifficultyScaler.evaluateFlowState(easyReport, 'STANDARD');
        expect(boredomEval.flowZone).toBe('BOREDOM');
        expect(boredomEval.isAcceptedForTarget).toBe(false);
    });
});
