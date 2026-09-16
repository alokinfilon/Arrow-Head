import { ArrowEntity, MoveResolution } from '../core/Types';
import { CollisionEngine } from '../collision/CollisionEngine';
import { EventBus } from '../core/EventBus';

export class RuleEngine {
    private collisionEngine: CollisionEngine;
    private eventBus: EventBus;
    private hearts: number;
    private maxHearts: number;

    constructor(collisionEngine: CollisionEngine, eventBus: EventBus, initialHearts: number = 3) {
        this.collisionEngine = collisionEngine;
        this.eventBus = eventBus;
        this.maxHearts = initialHearts;
        this.hearts = initialHearts;
    }

    public resetHearts(): void {
        this.hearts = this.maxHearts;
        this.eventBus.emit('HEARTS_CHANGED', { currentHearts: this.hearts, maxHearts: this.maxHearts });
    }

    public getRemainingHearts(): number {
        return this.hearts;
    }

    public processInteraction(arrow: ArrowEntity, gridMap: Map<string, ArrowEntity>): MoveResolution {
        const check = this.collisionEngine.evaluatePath(arrow, gridMap);

        if (check.isClear) {
            // Free all body segments immediately from gridMap so ghost segments do not block other arrows
            const pathPts = arrow.path || [{ x: arrow.gridX, y: arrow.gridY }];
            pathPts.forEach(pt => gridMap.delete(`${pt.x},${pt.y}`));
            arrow.isAnimating = true;

            this.eventBus.emit('ARROW_ESCAPE_STARTED', {
                arrow,
                trajectoryDistance: Math.max(this.collisionEngine['width'], this.collisionEngine['height']) * 1.5,
            });

            return { success: true, target: arrow };
        } else {
            this.hearts = Math.max(0, this.hearts - 1);
            this.eventBus.emit('HEARTS_CHANGED', { currentHearts: this.hearts, maxHearts: this.maxHearts });
            this.eventBus.emit('ARROW_COLLISION', { arrow, blocker: check.blocker! });

            if (this.hearts === 0) {
                this.eventBus.emit('GAME_OVER', { reason: 'OUT_OF_HEARTS' });
            }

            return { success: false, target: arrow, blocker: check.blocker };
        }
    }
}