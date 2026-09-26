// Permanent terrain uses the same static Arcade walls as authority_herd.
// The dry river overlay is an alpha mask, so its shoreline stays aligned with
// the artwork (including the winding tributary). White roads and the separate
// fairness_water pond are deliberately absent from this mask.
import { DOCKS, dockWalkway } from './DockLayout.js';

const CELL_SIZE = 8;

// Outline of the two adjoining hills in the lower-right quadrant.
// Coordinates refer to a 1300 x 731 preview of background_whole.
export const HILL_OUTLINE = [
    [768, 496], [795, 471], [822, 450], [848, 434], [868, 431],
    [900, 436], [928, 424], [955, 407], [976, 402], [1006, 406],
    [1040, 415], [1081, 420], [1110, 424], [1157, 436],
    [1067, 439], [1097, 450], [1119, 458], [1119, 467],
    [1080, 476], [1015, 490], [925, 505], [849, 507], [782, 516]
];

function insidePolygon(x, y, points) {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
        const [ax, ay] = points[i];
        const [bx, by] = points[j];
        if ((ay > y) !== (by > y) && x < (bx - ax) * (y - ay) / (by - ay) + ax) {
            inside = !inside;
        }
    }
    return inside;
}

// Keep only river pixels connected to a map edge, ignoring stray opaque flecks
// in the transparent artwork. This also fills the full river, not just its edge.
export function createTerrainMask(rgba, columns, rows) {
    const mask = new Uint8Array(columns * rows);
    const queue = [];
    const visit = (x, y) => {
        if (x < 0 || y < 0 || x >= columns || y >= rows) return;
        const index = y * columns + x;
        if (mask[index] || rgba[index * 4 + 3] < 128) return;
        mask[index] = 1;
        queue.push(index);
    };
    for (let x = 0; x < columns; x++) {
        visit(x, 0);
        visit(x, rows - 1);
    }
    for (let y = 0; y < rows; y++) {
        visit(0, y);
        visit(columns - 1, y);
    }
    for (let head = 0; head < queue.length; head++) {
        const index = queue[head];
        const x = index % columns;
        const y = Math.floor(index / columns);
        visit(x - 1, y);
        visit(x + 1, y);
        visit(x, y - 1);
        visit(x, y + 1);
    }
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < columns; x++) {
            if (insidePolygon((x + 0.5) * 1300 / columns, (y + 0.5) * 731 / rows, HILL_OUTLINE)) {
                mask[y * columns + x] = 1;
            }
        }
    }
    return mask;
}

// Merge horizontal runs and matching adjacent rows, avoiding a body per pixel.
export function terrainRectangles(mask, columns, rows, width, height) {
    const rectangles = [];
    let previous = new Map();
    for (let y = 0; y < rows; y++) {
        const current = new Map();
        for (let x = 0; x < columns;) {
            if (!mask[y * columns + x]) { x++; continue; }
            const start = x;
            while (x < columns && mask[y * columns + x]) x++;
            const key = `${start}:${x}`;
            let rect = previous.get(key);
            if (rect) {
                rect.bottom = (y + 1) * height / rows;
            } else {
                rect = {
                    left: start * width / columns, right: x * width / columns,
                    top: y * height / rows, bottom: (y + 1) * height / rows
                };
                rectangles.push(rect);
            }
            current.set(key, rect);
        }
        previous = current;
    }
    return rectangles;
}

export function createTerrainCollision(scene) {
    const source = scene.textures.get('water_flow_dry').getSourceImage();
    const columns = Math.ceil(source.width / CELL_SIZE);
    const rows = Math.ceil(source.height / CELL_SIZE);
    const canvas = document.createElement('canvas');
    canvas.width = columns;
    canvas.height = rows;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(source, 0, 0, columns, rows);
    const mask = createTerrainMask(context.getImageData(0, 0, columns, rows).data, columns, rows);
    // Carve only the wooden pier footprint, allowing access to its far-end
    // trigger while the water beside and beyond the pier remains solid.
    for (const dock of Object.values(DOCKS)) {
        const area = dockWalkway(dock);
        const left = Math.max(0, Math.floor(area.left * columns / source.width));
        const right = Math.min(columns, Math.ceil(area.right * columns / source.width));
        const top = Math.max(0, Math.floor(area.top * rows / source.height));
        const bottom = Math.min(rows, Math.ceil(area.bottom * rows / source.height));
        for (let y = top; y < bottom; y++) {
            mask.fill(0, y * columns + left, y * columns + right);
        }
    }
    const walls = scene.physics.add.staticGroup();
    for (const rect of terrainRectangles(mask, columns, rows, source.width, source.height)) {
        const wall = scene.add.zone(
            (rect.left + rect.right) / 2, (rect.top + rect.bottom) / 2,
            rect.right - rect.left, rect.bottom - rect.top
        );
        walls.add(wall);
        // Follow the other event modules and show terrain boundaries in debug mode.
        wall.body.debugShowBody = true;
    }
    const collider = scene.physics.add.collider(scene.playerController.sprite, walls);
    scene.events.once('shutdown', () => {
        if (collider.world) collider.destroy();
        walls.destroy(true, true);
    });
    return { walls, collider };
}
