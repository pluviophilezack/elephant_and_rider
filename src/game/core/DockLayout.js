// Shared by the ferry triggers and terrain mask so the end of each pier is
// reachable without opening the surrounding river to walking.
export const DOCKS = {
    mainland: {
        name: '莽原碼頭', destination: '水域廢墟',
        x: 4820, y: 1640, berth: { x: 5040, y: 1640 },
        landing: { x: 4600, y: 1640 }
    },
    ruins: {
        name: '廢墟碼頭', destination: '莽原碼頭',
        x: 3950, y: 2530, berth: { x: 4190, y: 2530 },
        landing: { x: 3730, y: 2530 }
    }
};

export function dockWalkway(dock) {
    return { left: dock.x - 165, right: dock.x + 170, top: dock.y - 40, bottom: dock.y + 75 };
}

export const SHALLOW_BERTH = { x: 3720, y: 2790 };
export const TUTORIAL_RETURN = {
    berth: { x: 55, y: 1650 },
    landing: { x: 350, y: 1650 }
};

// Only the southeastern basin below the current barrier is walkable.
export const LOWER_RIVER_AREA = [
    [SHALLOW_BERTH.x - 100, 2904], [SHALLOW_BERTH.x - 100, 2116],
    [5161, 2116], [5161, 2904]
];
export const CURRENT_WARNINGS = [
    { x: 5027.5, y: 2146, width: 265, height: 60, signX: 4840, signY: 1940 }
];
