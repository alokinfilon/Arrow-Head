import { ArrowEntity } from '../../engine/core/Types';

export interface CognitiveLoadResult {
    totalArrows: number;
    intersectingTrajectories: number; // Count of trajectory line crossings
    activeBlockers: number;           // Arrows currently blocking other arrows
    visualDensity: number;            // Ratio of grid occupied
    cognitiveLoadScore: number;       // 0 to 1 scaling
}

/**
 * Computes human working memory load based on visual density, crossing trajectories,
 * and active blocker dependencies that must be tracked simultaneously.
 */
export function calculateCognitiveLoad(
    arrows: ArrowEntity[],
    gridSize: { width: number; height: number }
): CognitiveLoadResult {
    const totalArrows = arrows.length;
    if (totalArrows === 0) {
        return {
            totalArrows: 0,
            intersectingTrajectories: 0,
            activeBlockers: 0,
            visualDensity: 0,
            cognitiveLoadScore: 0
        };
    }

    const gridArea = gridSize.width * gridSize.height;
    const visualDensity = totalArrows / gridArea;

    let intersectingTrajectories = 0;
    let activeBlockers = 0;

    // Build ray trajectory for each arrow
    const trajectories: Array<{ x: number; y: number; dir: string; id: string }> = [];
    const arrowPositions = new Set<string>();

    for (const arrow of arrows) {
        arrowPositions.add(`${arrow.gridX},${arrow.gridY}`);
        trajectories.push({
            x: arrow.gridX,
            y: arrow.gridY,
            dir: arrow.direction,
            id: arrow.id
        });
    }

    // Calculate trajectory intersections and blocker checks
    for (let i = 0; i < trajectories.length; i++) {
        const a1 = trajectories[i];
        let isBlocked = false;

        for (let j = 0; j < trajectories.length; j++) {
            if (i === j) continue;
            const a2 = trajectories[j];

            // Trajectory ray check for a1 heading towards boundary
            if (a1.dir === 'RIGHT' && a2.x > a1.x && a2.y === a1.y) {
                isBlocked = true;
                intersectingTrajectories++;
            } else if (a1.dir === 'LEFT' && a2.x < a1.x && a2.y === a1.y) {
                isBlocked = true;
                intersectingTrajectories++;
            } else if (a1.dir === 'UP' && a2.y < a1.y && a2.x === a1.x) {
                isBlocked = true;
                intersectingTrajectories++;
            } else if (a1.dir === 'DOWN' && a2.y > a1.y && a2.x === a1.x) {
                isBlocked = true;
                intersectingTrajectories++;
            }

            // Perpendicular crossing trajectory check
            if (i < j) {
                const isCross = (
                    ((a1.dir === 'RIGHT' || a1.dir === 'LEFT') && (a2.dir === 'UP' || a2.dir === 'DOWN')) ||
                    ((a1.dir === 'UP' || a1.dir === 'DOWN') && (a2.dir === 'RIGHT' || a2.dir === 'LEFT'))
                );
                if (isCross) {
                    intersectingTrajectories++;
                }
            }
        }

        if (isBlocked) {
            activeBlockers++;
        }
    }

    // Scale load score (0.0 to 1.0)
    const densityFactor = Math.min(1.0, visualDensity / 0.5);
    const trajectoryFactor = Math.min(1.0, intersectingTrajectories / (totalArrows * 2));
    const blockerFactor = Math.min(1.0, activeBlockers / totalArrows);

    const cognitiveLoadScore = Number(
        (0.3 * densityFactor + 0.4 * trajectoryFactor + 0.3 * blockerFactor).toFixed(2)
    );

    return {
        totalArrows,
        intersectingTrajectories,
        activeBlockers,
        visualDensity: Number(visualDensity.toFixed(2)),
        cognitiveLoadScore: Math.max(0, Math.min(1, cognitiveLoadScore))
    };
}
