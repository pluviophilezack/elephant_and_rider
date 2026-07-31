// 核心系統：主角（大象＋騎象人）在大地圖上的移動控制，使用 WASD／方向鍵
export class PlayerController {

    constructor(scene, sprite, speed = 200) {
        this.scene = scene;
        this.sprite = sprite;
        this.speed = speed;
        this.cursors = scene.input.keyboard.createCursorKeys();
        this.keys = scene.input.keyboard.addKeys('W,A,S,D');
    }

    // 每個 frame 呼叫一次，依按鍵狀態更新主角速度與朝向
    update() {
        const body = this.sprite.body;
        if (!body) return;

        let vx = 0;
        let vy = 0;

        if (this.cursors.left.isDown || this.keys.A.isDown) vx -= 1;
        if (this.cursors.right.isDown || this.keys.D.isDown) vx += 1;
        if (this.cursors.up.isDown || this.keys.W.isDown) vy -= 1;
        if (this.cursors.down.isDown || this.keys.S.isDown) vy += 1;

        const length = Math.hypot(vx, vy) || 1;
        body.setVelocity((vx / length) * this.speed, (vy / length) * this.speed);

        if (vx !== 0) {
            this.sprite.setFlipX(vx < 0);
        }
    }
}
