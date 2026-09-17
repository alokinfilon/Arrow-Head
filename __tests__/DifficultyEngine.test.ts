import { DifficultyEngine } from '../funScore/difficulty/DifficultyEngine';
import { calculateSolutionDepth } from '../funScore/difficulty/metrics/SolutionDepth';
import { calculateBranchingFactor } from '../funScore/difficulty/metrics/BranchingFactor';
import { calculateChainComplexity } from '../funScore/difficulty/metrics/ChainComplexity';
import { calculateVisualSymmetry } from '../funScore/difficulty/metrics/VisualSymmetry';
import { checkAhaBottleneck } from '../funScore/difficulty/metrics/AhaDifficulty';
import { ArrowEntity } from '../engine/core/Types';

describe('funScore Difficulty Engine & Pruned Metrics', () => {
    const mockGridSize = { width: 8, height: 8 };

    const sampleArrows: ArrowEntity[] = [
        { id: '1', gridX: 0, gridY: 0, direction: 'RIGHT' },
        { id: '2', gridX: 7, gridY: 0, direction: 'LEFT' },
        { id: '3', gridX: 0, gridY: 7, direction: 'RIGHT' },
        { id: '4', gridX: 7, gridY: 7, direction: 'LEFT' },
    ];

    test('SolutionDepth scales appropriately for 12 vs 40 arrows', () => {
        const smallLevel = calculateSolutionDepth(Array(12).fill(sampleArrows[0]));
        const largeLevel = calculateSolutionDepth(Array(40).fill(sampleArrows[0]));

        expect(smallLevel.totalArrows).toBe(12);
        expect(largeLevel.totalArrows).toBe(40);
        expect(smallLevel.normalizedScore).toBeLessThan(largeLevel.normalizedScore);
        expect(largeLevel.normalizedScore).toBeCloseTo(1.0, 1);
    });

    test('BranchingFactor detects single-track and chaotic states', () => {
        const singleTrack = calculateBranchingFactor([1, 1, 1, 1]);
        expect(singleTrack.isSingleTrack).toBe(true);
        expect(singleTrack.warningMessage).toContain('single-track');

        const chaotic = calculateBranchingFactor([6, 7, 6, 8]);
        expect(chaotic.isChaotic).toBe(true);
        expect(chaotic.warningMessage).toContain('chaotic');

        const balanced = calculateBranchingFactor([2, 3, 2, 3]);
        expect(balanced.isSingleTrack).toBe(false);
        expect(balanced.isChaotic).toBe(false);
    });

    test('ChainComplexity scores cascades', () => {
        const noCascades = calculateChainComplexity([1, 1, 1]);
        expect(noCascades.totalCascades).toBe(0);

        const withCascades = calculateChainComplexity([3, 1, 4, 1]);
        expect(withCascades.totalCascades).toBe(2);
        expect(withCascades.maxCascadeLength).toBe(4);
        expect(withCascades.satisfactionScore).toBeGreaterThan(0.5);
    });

    test('VisualSymmetry evaluates symmetric vs random layouts', () => {
        const symmetricGrid = calculateVisualSymmetry(sampleArrows, mockGridSize);
        expect(symmetricGrid.horizontalSymmetry).toBe(1);
        expect(symmetricGrid.verticalSymmetry).toBe(1);
        expect(symmetricGrid.isHandcraftedFeel).toBe(true);

        const asymmetricArrows: ArrowEntity[] = [
            { id: '1', gridX: 1, gridY: 2, direction: 'UP' },
            { id: '2', gridX: 6, gridY: 5, direction: 'DOWN' },
        ];
        const asymmetricGrid = calculateVisualSymmetry(asymmetricArrows, mockGridSize);
        expect(asymmetricGrid.overallSymmetryScore).toBeLessThan(symmetricGrid.overallSymmetryScore);
    });

    test('AhaDifficulty detects unblock bottleneck jumps', () => {
        const smoothProgression = [1, 2, 2, 3];
        const smoothResult = checkAhaBottleneck(smoothProgression);
        expect(smoothResult.hasBottleneck).toBe(false);

        const bottleneckProgression = [1, 1, 4, 3]; // Jump of +3 at step 2
        const bottleneckResult = checkAhaBottleneck(bottleneckProgression);
        expect(bottleneckResult.hasBottleneck).toBe(true);
        expect(bottleneckResult.bottleneckStepIndex).toBe(2);
    });

    test('DifficultyEngine generates complete evaluation report', () => {
        const report = DifficultyEngine.evaluateLevel(sampleArrows, {
            gridSize: mockGridSize,
            solutionMoves: 4,
            unblockedProgression: [1, 1, 3, 2],
            cascadeLengths: [1, 3, 1]
        });

        expect(report.score.displayScore).toBeGreaterThanOrEqual(0);
        expect(report.score.displayScore).toBeLessThanOrEqual(100);
        expect(report.metrics.solutionDepth).toBeDefined();
        expect(report.metrics.branchingFactor).toBeDefined();
        expect(report.metrics.chainComplexity).toBeDefined();
        expect(report.metrics.visualSymmetry).toBeDefined();
        expect(report.metrics.ahaDifficulty).toBeDefined();
    });
});
