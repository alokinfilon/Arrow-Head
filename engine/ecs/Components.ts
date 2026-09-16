// src/engine/ecs/Components.ts

export type EntityId = number;

export interface PositionComponent {
    x: number; // Discrete Grid X
    y: number; // Discrete Grid Y
}

export interface DirectionComponent {
    direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
}

export interface RenderComponent {
    color: string;
    shapeType: 'ARROW' | 'BOMB' | 'PORTAL_ENTRY' | 'PORTAL_EXIT' | 'WALL';
    scale: number;
    opacity: number;
}

export interface CollisionComponent {
    isPassable: boolean;
    stopsMovement: boolean;
    triggersDestruction: boolean;
    layer: 'DEFAULT' | 'HAZARD' | 'PORTAL';
}

export interface MotionStateComponent {
    state: 'IDLE' | 'IN_FLIGHT' | 'SHUDDERING' | 'REMOVED';
    inFlightProgress: number; // 0.0 to 1.0
}