export interface ShapeTemplate {
    name: string;
    description: string;
    width: number;
    height: number;
    mask: boolean[][];
}

/**
 * Converts ASCII art representation into a 2D boolean grid mask.
 * '#' or 'X' or '*' represents active mask cell (true).
 * '.' or ' ' represents empty cell (false).
 */
export function parseAsciiMask(asciiArt: string): boolean[][] {
    const lines = asciiArt
        .trim()
        .split('\n')
        .map(line => line.trimEnd());

    const height = lines.length;
    const width = Math.max(...lines.map(l => l.length));

    const mask: boolean[][] = [];
    for (let y = 0; y < height; y++) {
        const row: boolean[] = [];
        const line = lines[y] || '';
        for (let x = 0; x < width; x++) {
            const char = line[x] || ' ';
            const isActive = char === '#' || char === 'X' || char === '*';
            row.push(isActive);
        }
        mask.push(row);
    }

    return mask;
}

// Pre-defined Shape Masks
export const DOG_ASCII = `
..##....##..
..####.####.
.##########.
.##########.
..########..
...######...
....####....
`;

export const RABBIT_ASCII = `
.##....##.
.##....##.
.##....##.
.########.
##########
.########.
..######..
...####...
`;

export const HOUSE_ASCII = `
....##....
...####...
..######..
.########.
##########
.##.##.##.
.##....##.
.########.
`;

export const HEART_ASCII = `
.####..####.
############
############
.##########.
..########..
...######...
....####....
.....##.....
`;

export const STAR_ASCII = `
.....##.....
.....##.....
...######...
############
.##########.
..########..
.####..####.
.##......##.
`;

export const SHIELD_ASCII = `
.##########.
.##########.
.##########.
.##########.
..########..
...######...
....####....
.....##.....
`;

export const DIAMOND_ASCII = `
....####....
..########..
############
.##########.
..########..
....####....
`;

export const MAZE_ASCII = `
##########
#........#
#.######.#
#.#....#.#
#.#.##.#.#
#.#.#..#.#
#...#....#
##########
`;

export const SHAPE_TEMPLATES: Record<string, ShapeTemplate> = {
    DOG: {
        name: 'Dog',
        description: 'Dog silhouette shape mask',
        width: 12,
        height: 7,
        mask: parseAsciiMask(DOG_ASCII)
    },
    RABBIT: {
        name: 'Rabbit',
        description: 'Rabbit silhouette shape mask',
        width: 10,
        height: 8,
        mask: parseAsciiMask(RABBIT_ASCII)
    },
    HOUSE: {
        name: 'House',
        description: 'House silhouette shape mask',
        width: 10,
        height: 8,
        mask: parseAsciiMask(HOUSE_ASCII)
    },
    HEART: {
        name: 'Heart',
        description: 'Heart silhouette shape mask',
        width: 12,
        height: 8,
        mask: parseAsciiMask(HEART_ASCII)
    },
    STAR: {
        name: 'Star',
        description: '5-pointed star shape mask',
        width: 12,
        height: 8,
        mask: parseAsciiMask(STAR_ASCII)
    },
    SHIELD: {
        name: 'Shield',
        description: 'Heraldic shield shape mask',
        width: 12,
        height: 8,
        mask: parseAsciiMask(SHIELD_ASCII)
    },
    DIAMOND: {
        name: 'Diamond',
        description: 'Diamond gemstone shape mask',
        width: 12,
        height: 6,
        mask: parseAsciiMask(DIAMOND_ASCII)
    },
    MAZE: {
        name: 'Maze',
        description: 'Concentric maze pathway mask',
        width: 10,
        height: 8,
        mask: parseAsciiMask(MAZE_ASCII)
    }
};
