import { ArrowEntity, Direction, PathSegment } from '../core/Types';
import { MovementEngine } from '../simulation/MovementEngine';
import { PuzzleGenerator } from './PuzzleGenerator';

export class ProceduralGenerator {
    private static OPPOSITE_DIRECTIONS: Record<Direction, Direction> = {
        UP: 'DOWN',
        DOWN: 'UP',
        LEFT: 'RIGHT',
        RIGHT: 'LEFT',
    };

    /**
     * Reverse-Assembly Procedural Generator for multi-segment folded arrows in a custom shape mask.
     * Validates that at least one winning solution sequence exists before returning.
     */
    public static generateShapeMaskLevel(
        mask: boolean[][],
        totalArrows?: number,
        maxRetries: number = 30
    ): { width: number; height: number; arrows: ArrowEntity[] } {
        const height = mask.length;
        const width = mask[0].length;

        for (let retry = 0; retry < maxRetries; retry++) {
            const candidate = this.buildShapeMaskCandidate(width, height, mask, totalArrows);
            if (candidate.arrows.length > 0) {
                const validation = PuzzleGenerator.validateSolvability(width, height, candidate.arrows);
                if (validation.isSolvable) {
                    return candidate;
                }
            }
        }

        return this.buildShapeMaskCandidate(width, height, mask, totalArrows);
    }

    private static buildShapeMaskCandidate(
        width: number,
        height: number,
        mask: boolean[][],
        totalArrows?: number
    ): { width: number; height: number; arrows: ArrowEntity[] } {
        const validCells: { x: number; y: number }[] = [];
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (mask[y][x]) {
                    validCells.push({ x, y });
                }
            }
        }

        const grid = new Map<string, ArrowEntity>();
        const arrows: ArrowEntity[] = [];
        const directions: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];

        let attempts = 0;
        const maxAttempts = validCells.length * 200;
        const targetArrowCount = totalArrows || Math.floor(validCells.length * 0.45);

        while (arrows.length < targetArrowCount && attempts < maxAttempts) {
            attempts++;
            const cell = validCells[Math.floor(Math.random() * validCells.length)];
            if (grid.has(`${cell.x},${cell.y}`)) continue;

            const shuffledDirs = [...directions].sort(() => Math.random() - 0.5);

            for (const dir of shuffledDirs) {
                if (this.canReversePathReachEdgeMask(cell.x, cell.y, dir, width, height, mask, grid)) {
                    // Decide arrow body length between 2 and 6 segments
                    const targetLength = Math.floor(Math.random() * 5) + 2;
                    const path = this.growFoldedBodyBackwards(cell.x, cell.y, dir, targetLength, width, height, mask, grid);

                    if (path.length >= 2) {
                        const newArrow: ArrowEntity = {
                            id: `arrow_${arrows.length + 1}_${Date.now()}`,
                            path, // path[0] is tail, path[path.length - 1] is head
                            gridX: cell.x,
                            gridY: cell.y,
                            direction: dir,
                            isAnimating: false,
                        };

                        path.forEach(pt => grid.set(`${pt.x},${pt.y}`, newArrow));
                        arrows.push(newArrow);
                        break;
                    }
                }
            }
        }

        return { width, height, arrows };
    }

    /**
     * Backward growth from Head cell (hx, hy) to build a folded arrow body.
     */
    private static growFoldedBodyBackwards(
        headX: number,
        headY: number,
        headDir: Direction,
        targetLength: number,
        width: number,
        height: number,
        mask: boolean[][],
        grid: Map<string, ArrowEntity>
    ): PathSegment[] {
        const body: PathSegment[] = [{ x: headX, y: headY }];
        const occupied = new Set<string>([`${headX},${headY}`]);

        let currX = headX;
        let currY = headY;
        let lastGrowthDir = this.OPPOSITE_DIRECTIONS[headDir];

        while (body.length < targetLength) {
            let candidateDirs: Direction[];

            if (body.length === 1) {
                // The first backward step from head cell MUST be opposite of headDir
                // so that the head segment approaches the head cell in headDir.
                candidateDirs = [this.OPPOSITE_DIRECTIONS[headDir]];
            } else {
                const candidateDirsList: Direction[] = [lastGrowthDir];
                const allDirs: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
                const perpendiculars = allDirs.filter(
                    d => d !== lastGrowthDir && d !== this.OPPOSITE_DIRECTIONS[lastGrowthDir]
                );
                perpendiculars.sort(() => Math.random() - 0.5);
                candidateDirsList.push(...perpendiculars);
                candidateDirs = candidateDirsList;
            }

            let grew = false;
            for (const growDir of candidateDirs) {
                const step = MovementEngine.getStepVector(growDir);
                const nextX = currX + step.x;
                const nextY = currY + step.y;

                if (
                    nextX >= 0 && nextX < width &&
                    nextY >= 0 && nextY < height &&
                    mask[nextY][nextX] &&
                    !grid.has(`${nextX},${nextY}`) &&
                    !occupied.has(`${nextX},${nextY}`)
                ) {
                    currX = nextX;
                    currY = nextY;
                    body.push({ x: currX, y: currY });
                    occupied.add(`${currX},${currY}`);
                    lastGrowthDir = growDir;
                    grew = true;
                    break;
                }
            }

            if (!grew) break;
        }

        // Return path from Tail to Head
        return body.reverse();
    }

    private static canReversePathReachEdgeMask(
        startX: number,
        startY: number,
        direction: Direction,
        width: number,
        height: number,
        mask: boolean[][],
        grid: Map<string, ArrowEntity>
    ): boolean {
        const step = MovementEngine.getStepVector(direction);
        let currX = startX + step.x;
        let currY = startY + step.y;

        while (currX >= 0 && currX < width && currY >= 0 && currY < height && mask[currY][currX]) {
            if (grid.has(`${currX},${currY}`)) {
                return false;
            }
            currX += step.x;
            currY += step.y;
        }

        return !grid.has(`${currX},${currY}`);
    }

    /**
     * Standard rectangular grid folded arrow generator.
     */
    public static generateSolvableLevel(width: number, height: number, totalArrows: number): ArrowEntity[] {
        const fullMask = Array.from({ length: height }, () => Array(width).fill(true));
        return this.generateShapeMaskLevel(fullMask, totalArrows).arrows;
    }
}