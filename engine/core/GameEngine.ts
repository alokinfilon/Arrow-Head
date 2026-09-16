import { ArrowEntity, GameStatus } from './Types';
import { EventBus } from './EventBus';
import { CollisionEngine } from '../collision/CollisionEngine';
import { RuleEngine } from '../rules/RuleEngine';

export class GameEngine {
    public readonly eventBus: EventBus;
    private collisionEngine: CollisionEngine;
    private ruleEngine: RuleEngine;

    private gridMap: Map<string, ArrowEntity> = new Map();
    private activeArrowsList: ArrowEntity[] = [];
    private status: GameStatus = 'IDLE';
    private levelIndex: number = 1;
    private lastTapTimestamp: number = 0;

    constructor(width: number, height: number, initialHearts: number = 3) {
        this.eventBus = new EventBus();
        this.collisionEngine = new CollisionEngine(width, height);
        this.ruleEngine = new RuleEngine(this.collisionEngine, this.eventBus, initialHearts);

        this.registerInternalListeners();
    }

    private registerInternalListeners(): void {
        this.eventBus.on('ARROW_ESCAPE_COMPLETED', ({ arrowId }) => {
            const escapedArrow = this.activeArrowsList.find(a => a.id === arrowId);
            if (escapedArrow) {
                // Clear all occupied segments from gridMap
                escapedArrow.path.forEach(pt => {
                    this.gridMap.delete(`${pt.x},${pt.y}`);
                });
            }

            this.activeArrowsList = this.activeArrowsList.filter((a) => a.id !== arrowId);

            if (this.activeArrowsList.length === 0 && this.status === 'PLAYING') {
                this.status = 'WON';
                this.eventBus.emit('LEVEL_COMPLETED', { levelIndex: this.levelIndex, movesUsed: 0 });
            }
        });

        this.eventBus.on('GAME_OVER', () => {
            this.status = 'LOST';
        });
    }

    public loadLevel(levelIndex: number, width: number, height: number, arrows: ArrowEntity[]): void {
        this.levelIndex = levelIndex;
        this.gridMap.clear();
        this.collisionEngine.updateDimensions(width, height);
        this.ruleEngine.resetHearts();

        this.activeArrowsList = arrows.map((arrow) => {
            const head = arrow.path ? arrow.path[arrow.path.length - 1] : { x: arrow.gridX, y: arrow.gridY };
            const path = arrow.path || [head];
            const entity: ArrowEntity = {
                ...arrow,
                path,
                gridX: head.x,
                gridY: head.y,
                isAnimating: false,
            };

            // Register all segments into gridMap for collision and tap detection
            path.forEach(pt => {
                this.gridMap.set(`${pt.x},${pt.y}`, entity);
            });

            return entity;
        });

        this.status = 'PLAYING';
        this.eventBus.emit('LEVEL_LOADED', { levelIndex, totalArrows: arrows.length });
    }

    /**
     * Input Processor for tap coordinates matching any body segment of an arrow.
     */
    public handleInputCoord(gridX: number, gridY: number): void {
        if (this.status !== 'PLAYING') return;

        // Debounce tap (<180ms)
        const now = Date.now();
        if (now - this.lastTapTimestamp < 180) return;
        this.lastTapTimestamp = now;

        const arrow = this.gridMap.get(`${gridX},${gridY}`);
        if (!arrow || arrow.isAnimating) return;

        this.ruleEngine.processInteraction(arrow, this.gridMap);
    }

    /**
     * Hint Solver: Returns a guaranteed unblocked arrow.
     */
    public requestHint(): ArrowEntity | null {
        for (let i = 0; i < this.activeArrowsList.length; i++) {
            const candidate = this.activeArrowsList[i];
            if (!candidate.isAnimating) {
                const check = this.collisionEngine.evaluatePath(candidate, this.gridMap);
                if (check.isClear) {
                    return candidate;
                }
            }
        }
        return null;
    }

    public getActiveArrows(): ArrowEntity[] {
        return this.activeArrowsList;
    }

    public getStatus(): GameStatus {
        return this.status;
    }
}