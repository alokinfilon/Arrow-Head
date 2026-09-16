import { Direction, Vector2D } from '../core/Types';

export class MovementEngine {
    public static readonly DIRECTION_VECTORS: Record<Direction, Vector2D> = {
        UP: { x: 0, y: -1 },
        DOWN: { x: 0, y: 1 },
        LEFT: { x: -1, y: 0 },
        RIGHT: { x: 1, y: 0 },
    };

    public static getStepVector(direction: Direction): Vector2D {
        return this.DIRECTION_VECTORS[direction];
    }

    public static getStep(direction: Direction): Vector2D {
        return this.getStepVector(direction);
    }

    public static getRotationRadians(direction: Direction): number {
        switch (direction) {
            case 'UP': return 0;
            case 'RIGHT': return Math.PI / 2;
            case 'DOWN': return Math.PI;
            case 'LEFT': return -Math.PI / 2;
        }
    }
}