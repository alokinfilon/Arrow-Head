import { ArrowEntity } from '../../../engine/core/Types';

export interface VisualSymmetryResult {
    horizontalSymmetry: number; // 0 to 1
    verticalSymmetry: number;   // 0 to 1
    rotationalSymmetry: number; // 0 to 1
    overallSymmetryScore: number; // 0 to 1
    isHandcraftedFeel: boolean; // Score >= 0.45
}

/**
 * Measures layout symmetry across horizontal, vertical, and rotational axes.
 * Essential: Distinguishes handcrafted-looking levels from random noise.
 */
export function calculateVisualSymmetry(
    arrows: ArrowEntity[],
    gridSize: { width: number; height: number }
): VisualSymmetryResult {
    if (arrows.length === 0) {
        return {
            horizontalSymmetry: 1,
            verticalSymmetry: 1,
            rotationalSymmetry: 1,
            overallSymmetryScore: 1,
            isHandcraftedFeel: true
        };
    }

    const midX = (gridSize.width - 1) / 2;
    const midY = (gridSize.height - 1) / 2;

    let horizMatches = 0;
    let vertMatches = 0;
    let rotMatches = 0;

    const arrowSet = new Set<string>();
    for (const a of arrows) {
        arrowSet.add(`${a.gridX},${a.gridY}`);
    }

    for (const a of arrows) {
        // Horizontal symmetry (flip across Y-axis / midX)
        const mirroredX = Math.round(2 * midX - a.gridX);
        if (arrowSet.has(`${mirroredX},${a.gridY}`)) {
            horizMatches++;
        }

        // Vertical symmetry (flip across X-axis / midY)
        const mirroredY = Math.round(2 * midY - a.gridY);
        if (arrowSet.has(`${a.gridX},${mirroredY}`)) {
            vertMatches++;
        }

        // Rotational 180-degree symmetry
        if (arrowSet.has(`${mirroredX},${mirroredY}`)) {
            rotMatches++;
        }
    }

    const n = arrows.length;
    const horizontalSymmetry = horizMatches / n;
    const verticalSymmetry = vertMatches / n;
    const rotationalSymmetry = rotMatches / n;

    // Overall score takes max of individual axes + weighted average
    const maxAxis = Math.max(horizontalSymmetry, verticalSymmetry, rotationalSymmetry);
    const avgAxis = (horizontalSymmetry + verticalSymmetry + rotationalSymmetry) / 3;
    const overallSymmetryScore = Number((0.6 * maxAxis + 0.4 * avgAxis).toFixed(2));

    return {
        horizontalSymmetry: Number(horizontalSymmetry.toFixed(2)),
        verticalSymmetry: Number(verticalSymmetry.toFixed(2)),
        rotationalSymmetry: Number(rotationalSymmetry.toFixed(2)),
        overallSymmetryScore,
        isHandcraftedFeel: overallSymmetryScore >= 0.45
    };
}
