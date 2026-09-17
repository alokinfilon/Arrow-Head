import { PipelineRunner } from '../tools/PipelineRunner';
import { parseAsciiMask, SHAPE_TEMPLATES } from '../engine/generation/ShapeTemplates';
import * as fs from 'fs';
import * as path from 'path';

describe('PipelineRunner & ShapeTemplates', () => {
    const testOutputPath = path.join(__dirname, 'test_output_levels.json');

    afterAll(() => {
        if (fs.existsSync(testOutputPath)) {
            fs.unlinkSync(testOutputPath);
        }
    });

    test('parseAsciiMask parses ASCII shapes correctly', () => {
        const ascii = `
        .##.
        ####
        .##.
        `;
        const mask = parseAsciiMask(ascii);
        expect(mask.length).toBe(3);
        expect(mask[0][1]).toBe(true);
        expect(mask[0][0]).toBe(false);
    });

    test('SHAPE_TEMPLATES registry contains pre-built shapes', () => {
        expect(SHAPE_TEMPLATES.DOG).toBeDefined();
        expect(SHAPE_TEMPLATES.RABBIT).toBeDefined();
        expect(SHAPE_TEMPLATES.HOUSE).toBeDefined();
        expect(SHAPE_TEMPLATES.HEART).toBeDefined();
        expect(SHAPE_TEMPLATES.STAR).toBeDefined();
        expect(SHAPE_TEMPLATES.SHIELD).toBeDefined();
        expect(SHAPE_TEMPLATES.DIAMOND).toBeDefined();
        expect(SHAPE_TEMPLATES.MAZE).toBeDefined();
    });

    test('PipelineRunner executes batch pipeline (Generate -> Solve -> Score -> Sequence -> Export)', () => {
        const chapters = PipelineRunner.generateBatch(2, testOutputPath);
        expect(chapters.length).toBe(2);
        expect(chapters[0].levels.length).toBe(10);
        expect(chapters[1].levels.length).toBe(10);

        // Check level properties
        const lvl1 = chapters[0].levels[0];
        expect(lvl1.solution.length).toBeGreaterThan(0);
        expect(lvl1.metrics.difficultyScore).toBeGreaterThanOrEqual(0);
        expect(lvl1.metrics.difficultyScore).toBeLessThanOrEqual(100);

        // Check file export
        expect(fs.existsSync(testOutputPath)).toBe(true);
        const fileContent = JSON.parse(fs.readFileSync(testOutputPath, 'utf-8'));
        expect(fileContent.length).toBe(2);
    });
});
