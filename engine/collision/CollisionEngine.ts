import { ArrowEntity, CollisionResult } from '../core/Types';
import { MovementEngine } from '../simulation/MovementEngine';

export class CollisionEngine {
    private width: number;
    private height: number;

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
    }

    public updateDimensions(width: number, height: number): void {
        this.width = width;
        this.height = height;
    }

    public isInsideBounds(x: number, y: number): boolean {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    /**
     * Raycasts along the arrow's head orientation vector.
     */
    public evaluatePath(arrow: ArrowEntity, gridMap: Map<string, ArrowEntity>): CollisionResult {
        const step = MovementEngine.getStepVector(arrow.direction);
        let currX = arrow.gridX + step.x;
        let currY = arrow.gridY + step.y;

        while (this.isInsideBounds(currX, currY)) {
            const obstacle = gridMap.get(`${currX},${currY}`);
            if (obstacle && obstacle.id !== arrow.id && !obstacle.isAnimating) {
                return { isClear: false, blocker: obstacle };
            }
            currX += step.x;
            currY += step.y;
        }

        return {
            isClear: true,
            boundaryPoint: { x: currX, y: currY },
        };
    }
}