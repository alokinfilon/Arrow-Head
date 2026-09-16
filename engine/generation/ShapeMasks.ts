export function parseAsciiMask(ascii: string[]): boolean[][] {
    return ascii.map(row => row.split('').map(char => char === '#'));
}

export const DOG_SHAPE_ASCII = [
    "  #          #  ",
    " ###        ### ",
    " ###        ### ",
    "######    ######",
    "################",
    "################",
    " ###############",
    "  ############# ",
    "  ############  ",
    "  ############  ",
    "  ####    ####  ",
    "  ####    ####  ",
    "  ## ##  ## ##  ",
    "  ## ##  ## ##  ",
    "  ##  ####  ##  ",
    "  ##        ##  ",
];

export const DOG_SHAPE_MASK = parseAsciiMask(DOG_SHAPE_ASCII);

export const HEART_SHAPE_ASCII = [
    "  ####    ####  ",
    " ######  ###### ",
    "################",
    "################",
    " ############## ",
    "  ############  ",
    "   ##########   ",
    "    ########    ",
    "     ######     ",
    "      ####      ",
    "       ##       ",
];

export const HEART_SHAPE_MASK = parseAsciiMask(HEART_SHAPE_ASCII);
