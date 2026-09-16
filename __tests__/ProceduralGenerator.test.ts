import { ProceduralGenerator } from '../engine/generation/ProceduralGenerator';
import { MovementEngine } from '../engine/simulation/MovementEngine';
import { DOG_SHAPE_MASK } from '../engine/generation/ShapeMasks';

describe('ProceduralGenerator Arrow Head Alignment', () => {
    test('all generated arrows have head segments strictly aligned with arrow.direction', () => {
        // Test standard 6x6 grid
        const gridArrows = ProceduralGenerator.generateSolvableLevel(6, 6, 12);
        expect(gridArrows.length).toBeGreaterThan(0);

        for (const arrow of gridArrows) {
            expect(arrow.path.length).toBeGreaterThanOrEqual(2);
            const head = arrow.path[arrow.path.length - 1];
            const prev = arrow.path[arrow.path.length - 2];
            const step = MovementEngine.getStepVector(arrow.direction);

            // The vector from prev to head MUST equal step
            expect(head.x - prev.x).toBe(step.x);
            expect(head.y - prev.y).toBe(step.y);
        }

        // Test shape mask level (DOG_SHAPE_MASK)
        const maskResult = ProceduralGenerator.generateShapeMaskLevel(DOG_SHAPE_MASK);
        expect(maskResult.arrows.length).toBeGreaterThan(0);

        for (const arrow of maskResult.arrows) {
            expect(arrow.path.length).toBeGreaterThanOrEqual(2);
            const head = arrow.path[arrow.path.length - 1];
            const prev = arrow.path[arrow.path.length - 2];
            const step = MovementEngine.getStepVector(arrow.direction);

            // The vector from prev to head MUST equal step
            expect(head.x - prev.x).toBe(step.x);
            expect(head.y - prev.y).toBe(step.y);
        }
    });
});
