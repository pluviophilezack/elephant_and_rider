// 核心系統：主角（大象＋騎象人）在大地圖上的移動控制，使用 WASD／方向鍵
export class PlayerController {

    constructor(scene, x, y) {
        this.scene = scene;
        //建立主角(預設靜止圖樣)
        this.sprite = scene.physics.add.sprite(x, y, 'main_character_stand_still');
        this.sprite.setCollideWorldBounds(true);

        // 加入sprite
        scene.player = this.sprite.setScale(0.4); 
        // 設定圖層順序，避免被底圖覆蓋
        this.sprite.setDepth(15);

        //碰撞範圍
        const rawWidth = this.sprite.body.width;
        const rawHeight = this.sprite.body.height;
        const boxWidth = rawWidth * 1;
        const boxHeight = rawHeight * 0.5;
        this.sprite.body.setSize(boxWidth, boxHeight);
        const offsetX = (rawWidth - boxWidth) / 2; // 水平置中
        const offsetY = rawHeight - boxHeight;     // 靠到底部
        this.sprite.body.setOffset(offsetX, offsetY);

        this.speed = 160;
        //輸入鍵盤監聽
        this.cursors = scene.input.keyboard.createCursorKeys();
        this.wasd = scene.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });

        this.initAnimations();
    }

    initAnimations(){
        //移動動畫
        if(!this.scene.anims.exists('walk')){
            this.scene.anims.create({
                key: 'walk',
                frames:[
                    {key: 'main_character_moving_01'},
                    {key: 'main_character_moving_02'}
                ],
                frameRate: 6,
                repeat: -1
            });
        }
    }
    getPosition() {
        return { x: this.sprite.x, y: this.sprite.y };
    }
    // 每個 frame 呼叫一次，依按鍵狀態更新主角速度與朝向
    update() {
        if (this.isAutoMoving) return;
        const body = this.sprite.body;
        if (!body) return;

        let velocityX = 0;
        let velocityY = 0;

        if (this.cursors.left.isDown || this.wasd.left.isDown) {
            velocityX -= this.speed;
            this.sprite.setFlipX(true);//向左翻轉
        }
        if (this.cursors.right.isDown || this.wasd.right.isDown) {
            velocityX += this.speed;
            this.sprite.setFlipX(false);
        }
        if (this.cursors.up.isDown || this.wasd.up.isDown) velocityY -= this.speed;
        if (this.cursors.down.isDown || this.wasd.down.isDown) velocityY += this.speed;

        // 對角線斜向移動時進行速度等比修正
        if (velocityX !== 0 && velocityY !== 0) {
            velocityX *= 0.7071;
            velocityY *= 0.7071;
        }
        this.sprite.setVelocity(velocityX, velocityY);
        
        // 切換動畫或靜止狀態
        if (velocityX !== 0 || velocityY !== 0) {
          this.sprite.play('walk', true);
        } else {
          this.sprite.stop();
          this.sprite.setTexture('main_character_stand_still');
        }
  }
}

