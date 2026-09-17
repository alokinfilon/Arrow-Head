import { ArrowEntity } from '../../engine/core/Types';

export interface DecoyExplorationResult {
    totalBoundaryArrows: number;
    decoyArrowCount: number;      // Boundary arrows that look clear but are blocked downstream
    decoyRatio: number;           // 0 to 1
    explorationDeceptionScore: number; // 0 to 1 scaling
}

/**
 * Replaces CuriosityModel.
 * Measures decoy arrows near outer grid boundaries that appear immediately clearable to the player
 * but are blocked by deeper dependencies inside the board grid.
 */
export function evaluateDecoyExploration(
    arrows: ArrowEntity[],
    gridSize: { width: number; height: number }
): DecoyExplorationResult {
    if (arrows.length === 0) {
        return {
            totalBoundaryArrows: 0,
            decoyArrowCount: 0,
            decoyRatio: 0,
            explorationDeceptionScore: 0
        };
    }

    const maxX = gridSize.width - 1;
    const maxY = gridSize.height - 1;

    let totalBoundaryArrows = 0;
    let decoyArrowCount = 0;

    const arrowMap = new Set<string>();
    for (const a of arrows) {
        arrowMap.add(`${a.gridX},${a.gridY}`);
    }

    for (const arrow of arrows) {
        const isBoundary = (
            arrow.gridX === 0 || arrow.gridX === maxX ||
            arrow.gridY === 0 || arrow.gridY === maxY
        );

        if (!isBoundary) continue;
        totalBoundaryArrows++;

        // Check if facing outward (clear) vs facing inward (blocked deeper)
        const isFacingOutward = (
            (arrow.gridX === 0 && arrow.direction === 'LEFT') ||
            (arrow.gridX === maxX && arrow.direction === 'RIGHT') ||
            (arrow.gridY === 0 && arrow.direction === 'UP') ||
            (arrow.gridY === maxY && arrow.direction === 'DOWN')
        );

        // A decoy arrow is a boundary arrow that faces inward or hits an internal blocker ray
        if (!isFacingOutward) {
            // Check if there is an arrow blocking its path deeper inside
            let hasInternalBlocker = false;
            let cx = arrow.gridX;
            let cy = arrow.gridY;

            while (cx >= 0 && cx <= maxX && cy >= 0 && cy <= maxY) {
                if (arrow.direction === 'RIGHT') cx++;
                else if (arrow.direction === 'LEFT') cx--;
                else if (arrow.direction === 'UP') cy--;
                else if (arrow.direction === 'DOWN') cy++;

                if (arrowMap.has(`${cx},${cy}`)) {
                    hasInternalBlocker = true;
                    break;
                }
            }

            if (hasInternalBlocker) {
                decoyArrowCount++;
            }
        }
    }

    const decoyRatio = totalBoundaryArrows > 0 ? decoyArrowCount / totalBoundaryArrows : 0;
    const explorationDeceptionScore = Number(Math.min(1.0, decoyRatio * 1.2).toFixed(2));

    return {
        totalBoundaryArrows,
        decoyArrowCount,
        decoyRatio: Number(decoyRatio.toFixed(2)),
        explorationDeceptionScore
    };
}
