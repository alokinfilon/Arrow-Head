import { ArrowModel, Direction, MovementEngine } from '../GameEngine';

export interface GenerationResult {
  arrows: ArrowModel[];
  solution: string[]; // Order of arrow IDs to tap for a guaranteed win
}

export class PuzzleGenerator {
  private static readonly DIRECTIONS: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];

  /**
   * Generates a puzzle that is mathematically guaranteed to have at least one winning solution.
   * 
   * @param width Board width (columns)
   * @param height Board height (rows)
   * @param arrowCount Desired number of arrows
   * @param maxAttempts Max attempts before fallback
   */
  public static generateSolvableLevel(
    width: number,
    height: number,
    arrowCount: number,
    maxAttempts = 50
  ): GenerationResult {
    // Clamp arrow count so it cannot exceed available grid cells
    const maxCapacity = Math.floor(width * height * 0.8);
    const targetCount = Math.min(arrowCount, maxCapacity);

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const candidateArrows = this.buildReverseAssembly(width, height, targetCount);

      // Verify and extract the guaranteed clearance path
      const validation = this.validateSolvability(width, height, candidateArrows);

      if (validation.isSolvable && candidateArrows.length >= Math.floor(targetCount * 0.85)) {
        return {
          arrows: candidateArrows,
          solution: validation.solutionSequence,
        };
      }
    }

    // Fallback: Generate a simplified boundary level if high-density packing fails
    const fallback = this.buildBorderFallback(width, height, targetCount);
    const fallbackValidation = this.validateSolvability(width, height, fallback);

    return {
      arrows: fallback,
      solution: fallbackValidation.solutionSequence,
    };
  }

  /**
   * Reverse-Assembly: Places arrows backward.
   * An arrow placed at step K is guaranteed to be able to leave if all arrows
   * placed after step K have already left.
   */
  private static buildReverseAssembly(
    width: number,
    height: number,
    targetCount: number
  ): ArrowModel[] {
    const gridMap = new Map<string, ArrowModel>();
    const placementHistory: ArrowModel[] = [];

    let placementAttempts = 0;
    const maxPlacementTries = targetCount * 80;

    while (placementHistory.length < targetCount && placementAttempts < maxPlacementTries) {
      placementAttempts++;

      const x = Math.floor(Math.random() * width);
      const y = Math.floor(Math.random() * height);
      const key = `${x},${y}`;

      // Cell already occupied
      if (gridMap.has(key)) continue;

      // Randomize direction candidates
      const shuffledDirections = [...this.DIRECTIONS].sort(() => Math.random() - 0.5);

      for (const dir of shuffledDirections) {
        // In reverse assembly, check if this arrow has an unobstructed path
        // to the edge considering the arrows currently on the board.
        if (this.isPathClearToBoundary(x, y, dir, width, height, gridMap)) {
          const step = MovementEngine.getStep(dir);
          const tailX = x - step.x;
          const tailY = y - step.y;
          const arrow: ArrowModel = {
            id: `arrow_${placementHistory.length + 1}_${Date.now()}`,
            gridX: x,
            gridY: y,
            direction: dir,
            isAnimating: false,
            path: [{ x: tailX, y: tailY }, { x, y }],
          };

          gridMap.set(key, arrow);
          placementHistory.push(arrow);
          break;
        }
      }
    }

    return placementHistory;
  }

  /**
   * Checks if a ray starting at (startX, startY) moving along 'direction'
   * can exit the board without colliding with existing arrows.
   */
  private static isPathClearToBoundary(
    startX: number,
    startY: number,
    direction: Direction,
    width: number,
    height: number,
    gridMap: Map<string, ArrowModel>
  ): boolean {
    const step = MovementEngine.getStep(direction);
    let checkX = startX + step.x;
    let checkY = startY + step.y;

    while (checkX >= 0 && checkX < width && checkY >= 0 && checkY < height) {
      if (gridMap.has(`${checkX},${checkY}`)) {
        return false;
      }
      checkX += step.x;
      checkY += step.y;
    }

    return true;
  }

  /**
   * Forward Solver / Verifier:
   * Simulates playing the game by repeatedly finding an unblocked arrow,
   * removing it, and repeating until the board is clear.
   * 
   * Returns true only if the board can be 100% cleared without collisions.
   */
  public static validateSolvability(
    width: number,
    height: number,
    arrows: ArrowModel[]
  ): { isSolvable: boolean; solutionSequence: string[] } {
    const testGrid = new Map<string, ArrowModel>();
    arrows.forEach((a) => testGrid.set(`${a.gridX},${a.gridY}`, { ...a }));

    const solutionSequence: string[] = [];
    let progressMade = true;

    while (testGrid.size > 0 && progressMade) {
      progressMade = false;

      // Scan for any arrow that can leave right now
      for (const arrow of testGrid.values()) {
        const step = MovementEngine.getStep(arrow.direction);
        let checkX = arrow.gridX + step.x;
        let checkY = arrow.gridY + step.y;
        let isClear = true;

        while (checkX >= 0 && checkX < width && checkY >= 0 && checkY < height) {
          if (testGrid.has(`${checkX},${checkY}`)) {
            isClear = false;
            break;
          }
          checkX += step.x;
          checkY += step.y;
        }

        if (isClear) {
          solutionSequence.push(arrow.id);
          testGrid.delete(`${arrow.gridX},${arrow.gridY}`);
          progressMade = true;
          break; // Restart loop with the reduced board
        }
      }
    }

    return {
      isSolvable: testGrid.size === 0,
      solutionSequence,
    };
  }

  /**
   * Deterministic safe fallback in case high-density random packing fails.
   */
  private static buildBorderFallback(
    width: number,
    height: number,
    count: number
  ): ArrowModel[] {
    const result: ArrowModel[] = [];
    let index = 0;

    // Place outwards-facing arrows along the border edges
    for (let x = 0; x < width && result.length < count; x++) {
      const arrowTop: ArrowModel = {
        id: `fb_${index++}`,
        gridX: x,
        gridY: 0,
        direction: 'UP',
        path: [{ x, y: 1 }, { x, y: 0 }],
      };
      result.push(arrowTop);
      if (result.length < count) {
        const arrowBot: ArrowModel = {
          id: `fb_${index++}`,
          gridX: x,
          gridY: height - 1,
          direction: 'DOWN',
          path: [{ x, y: height - 2 }, { x, y: height - 1 }],
        };
        result.push(arrowBot);
      }
    }

    return result;
  }
}
