export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export interface Vector2D {
    x: number;
    y: number;
}

export type PathSegment = Vector2D;

export interface ArrowEntity {
    id: string;
    path?: PathSegment[]; // Array of coordinates from tail (path[0]) to head (path[path.length - 1])
    gridX: number; // Head X
    gridY: number; // Head Y
    direction: Direction; // Arrowhead direction at head segment
    isAnimating?: boolean;
}

export type ArrowModel = ArrowEntity;

export type GameStatus = 'IDLE' | 'PLAYING' | 'WON' | 'LOST';

export interface CollisionResult {
    isClear: boolean;
    blocker?: ArrowEntity;
    boundaryPoint?: Vector2D;
}

export interface MoveResolution {
    success: boolean;
    target: ArrowEntity;
    blocker?: ArrowEntity;
}

export type EngineEventMap = {
    'INPUT_TAP': { gridX: number; gridY: number };
    'ARROW_ESCAPE_STARTED': { arrow: ArrowEntity; trajectoryDistance: number };
    'ARROW_ESCAPE_COMPLETED': { arrowId: string };
    'ARROW_COLLISION': { arrow: ArrowEntity; blocker: ArrowEntity };
    'HEARTS_CHANGED': { currentHearts: number; maxHearts: number };
    'LEVEL_LOADED': { levelIndex: number; totalArrows: number };
    'LEVEL_COMPLETED': { levelIndex: number; movesUsed: number };
    'GAME_OVER': { reason: 'OUT_OF_HEARTS' | 'TIME_EXPIRED' };
};