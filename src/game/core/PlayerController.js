// 核心系統：主角（大象＋騎象人）在大地圖上的移動控制，使用 WASD／方向鍵
import { DialogueSystem } from "./DialogueSystem";
import { MoralState } from "./MoralState";

export class PlayerController {

    constructor(scene, x, y) {
        this.baseSpeed = 160; 
        this.scene = scene;
        //建立主角(預設靜止圖樣)
        this.sprite = scene.physics.add.sprite(x, y, 'main_character_stand_still');
        this.sprite.setCollideWorldBounds(true);
        this.enabled = true;   // 🆕 新增：控制是否允許移動

        // 加入sprite
        scene.player = this.sprite.setScale(0.4); 
        // 設定圖層順序，避免被底圖覆蓋
        this.sprite.setDepth(15);

        // 預先加入顏色並隱藏
        const MARKING_COLORS = ['blue', 'green', 'purple', 'pink', 'yellow'];

        this.marking_sprite = {};

        MARKING_COLORS.forEach(color => {
            this.marking_sprite[color] = scene.add.image(x, y, color).setScale(0.45).setVisible(false).setDepth(20);
        })

        //碰撞範圍
        const rawWidth = this.sprite.body.width;
        const rawHeight = this.sprite.body.height;
        const boxWidth = rawWidth * 1;
        const boxHeight = rawHeight * 0.5;
        this.sprite.body.setSize(boxWidth, boxHeight);
        const offsetX = (rawWidth - boxWidth) / 2; // 水平置中
        const offsetY = rawHeight - boxHeight;     // 靠到底部
        this.sprite.body.setOffset(offsetX, offsetY);

        this.speed = 160*5;
        //輸入鍵盤監聽
        this.cursors = scene.input.keyboard.createCursorKeys();
        this.wasd = scene.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });

        this.initAnimations();

        // 當物理引擎把主角的最新 x, y 計算完畢後，立即同步斑紋位置，避免 1 幀延遲                                                 
        this.scene.events.on(Phaser.Scenes.Events.POST_UPDATE, this.syncMarkingPositions, this);                                   
                                                                                                                                    
        // （良好習慣）當場景被銷毀或重啟時，自動移除監聽器，避免記憶體洩漏                                                        
        this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {                                                              
            this.scene.events.off(Phaser.Scenes.Events.POST_UPDATE, this.syncMarkingPositions, this);                              
        });  

        this.wasPainted = false;
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

    // 🆕 新增：禁用玩家控制（停止移動，鎖定輸入）
    disable() {
        this.enabled = false;
        this.sprite.setVelocity(0, 0);
        this.sprite.stop();                // 停止動畫
        this.sprite.setTexture('main_character_stand_still');
    }

    // 🆕 新增：啟用玩家控制
    enable() {
        this.enabled = true;
    }

    // 加入斑紋
    paint(domain, animated = true){
        let color = null;
        switch (domain){
            case 'authority':
                color = 'pink';
                break;
            case 'fairness':
                color = 'green';
                break;
            case 'ingroup':
                color = 'yellow';
                break;
            case 'purity':
                color = 'blue';
                break;
            case 'harm':
                color = 'purple';
                break;
        }

        const sprite = this.marking_sprite?.[color];
        if (!sprite) return;

        // 如果已經完全顯示了就不用重複處理
        if (sprite.visible && sprite.alpha === 1) return;

        if (animated) {
            sprite.setAlpha(0);
            sprite.setVisible(true);
            this.scene.tweens.add({
                targets: sprite,
                alpha: 1,
                duration: 2000,
                ease: 'Sine.easeInOut'
            });
        } else {
            sprite.setAlpha(1);
            sprite.setVisible(true);
        }
    }

            // 斑紋跟隨主角
    syncMarkingPositions() {
        if (!this.sprite || !this.marking_sprite) return;                                                                          

        Object.values(this.marking_sprite).forEach(sprite => {
            // 只有顯示中的斑紋才需要更新，節省效能                                                                                
            if (!sprite.visible) return;

            // 1. 同步深度：永遠比主角高一層                                                                                       
            sprite.setDepth(this.sprite.depth + 1);

            // 2. 同步左右翻轉                                                                                                     
            sprite.setFlipX(this.sprite.flipX);

            // 3. 依翻轉方向動態計算 X 軸偏移量                                                                                    
            const offsetX = this.sprite.flipX ? 2 : 0;

            // 4. 對齊主角最新座標                                                                                                 
            sprite.setPosition(
                this.sprite.x + offsetX,
                this.sprite.y + 32
            );
        });
    }

    // 根據當前 MoralState 套用斑紋（適用於集滿祈雨石或切換場景時延續）
    applyCurrentMoralMarks(animated = true) {
        // 先取當前記憶體數值；若皆為 0（例如通關重啟或直入足跡場景），嘗試讀取先前結尾儲存的數值
        let moral_state = MoralState.getAll();
        const hasActiveScore = Object.values(moral_state).some(score => score > 0);
        if (!hasActiveScore) {
            const saved = MoralState.getSavedFromStorage();
            if (saved) {
                moral_state = saved;
            }
        }

        console.log('[PlayerController] 套用斑紋數值：', moral_state);

        for (const [domain, score] of Object.entries(moral_state)) {
            if (score > 0) {
                this.paint(domain, animated);
            }
        }
        this.wasPainted = true;

        // 立即校正一次斑紋座標與深度，確保剛進入場景靜止時位置正確
        this.syncMarkingPositions();
    }

    // 每個 frame 呼叫一次，依按鍵狀態更新主角速度與朝向
    update() {
        if(DialogueSystem.isShowing()){
            this.sprite.setVelocity(0, 0);
            this.sprite.stop();
            //this.sprite.setTexture('main_character_stand_still');//1010
            return;
        }

        if (!this.enabled) return; 
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

        // 偵測下雨天/集滿祈雨石顯示斑紋
        if (this.scene.hud?.hasEnoughRainStones() && !this.wasPainted) {
            this.applyCurrentMoralMarks(true);
        }
  }
}

