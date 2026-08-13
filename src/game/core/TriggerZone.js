// 核心系統：在大地圖上建立事件觸發區（trigger zone）的共用小工具，供 domain_elephants 事件使用
export function createTriggerZone(scene, { x, y, width, height }) {
    const zone = scene.add.zone(x, y, width, height);
    scene.physics.add.existing(zone, true);
    return zone;
}
