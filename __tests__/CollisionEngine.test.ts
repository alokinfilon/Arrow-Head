import { CollisionEngine } from '../engine/collision/CollisionEngine';
import { RuleEngine } from '../engine/rules/RuleEngine';
import { EventBus } from '../engine/core/EventBus';
import { ArrowEntity } from '../engine/core/Types';

describe('CollisionEngine & Ghost Body Segment Prevention', () => {
    test('clears all body segments of escaping multi-segment arrow so subsequent arrows do not collide with ghost segments', () => {
        const collisionEngine = new CollisionEngine(6, 6);
        const eventBus = new EventBus();
        const ruleEngine = new RuleEngine(collisionEngine, eventBus, 3);

        const gridMap = new Map<string, ArrowEntity>();

        // Arrow 1: Folded arrow going UP, head at (2, 2), body at (2, 3) and (2, 4)
        const arrow1: ArrowEntity = {
            id: 'arrow_1',
            gridX: 2,
            gridY: 2,
            direction: 'UP',
            isAnimating: false,
            path: [{ x: 2, y: 4 }, { x: 2, y: 3 }, { x: 2, y: 2 }],
        };

        // Arrow 2: Horizontal arrow pointing RIGHT, head at (0, 3), path across row 3
        const arrow2: ArrowEntity = {
            id: 'arrow_2',
            gridX: 1,
            gridY: 3,
            direction: 'RIGHT',
            isAnimating: false,
            path: [{ x: 0, y: 3 }, { x: 1, y: 3 }],
        };

        // Register both arrows into gridMap
        arrow1.path!.forEach(pt => gridMap.set(`${pt.x},${pt.y}`, arrow1));
        arrow2.path!.forEach(pt => gridMap.set(`${pt.x},${pt.y}`, arrow2));

        // Before Arrow 1 escapes, Arrow 2 raycasts across (2, 3) where Arrow 1 body sits -> Should collide
        const checkBefore = collisionEngine.evaluatePath(arrow2, gridMap);
        expect(checkBefore.isClear).toBe(false);
        expect(checkBefore.blocker?.id).toBe('arrow_1');

        // Arrow 1 is tapped and escapes cleanly (path UP to boundary is clear)
        const res1 = ruleEngine.processInteraction(arrow1, gridMap);
        expect(res1.success).toBe(true);

        // Verify that ALL segments of Arrow 1 were removed from gridMap (no ghost segments left at 2,3 or 2,4)
        expect(gridMap.has('2,2')).toBe(false);
        expect(gridMap.has('2,3')).toBe(false);
        expect(gridMap.has('2,4')).toBe(false);

        // Now Arrow 2 raycasts across row 3 -> Should be completely CLEAR
        const checkAfter = collisionEngine.evaluatePath(arrow2, gridMap);
        expect(checkAfter.isClear).toBe(true);

        const res2 = ruleEngine.processInteraction(arrow2, gridMap);
        expect(res2.success).toBe(true);
        expect(ruleEngine.getRemainingHearts()).toBe(3); // Hearts intact!
    });
});
