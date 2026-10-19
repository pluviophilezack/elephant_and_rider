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
    paint(domain){
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

        // 1. 如果已經完全顯示了就不用重複播淡入動畫                                                                           
        if (this.marking_sprite[color].visible && this.marking_sprite[color].alpha === 1) return;

        // 2. 初始將透明度設為 0，並開啟可見性                                                                                 
        this.marking_sprite[color].setAlpha(0);
        this.marking_sprite[color].setVisible(true);

        // 3. 透過場景的 Tweens 系統進行漸變                                                                                   
        this.scene.tweens.add({
            targets: this.marking_sprite[color],
            alpha: 1,                // 目標透明度（1 = 完全不透明）                                                           
            duration: 5000,          // 漸變耗時（毫秒，1500ms = 1.5 秒）                                                      
            ease: 'Sine.easeInOut'   // 平滑緩和曲線（讓漸變更自然）                                                           
        });
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

        // 偵測下雨天顯示斑紋
        if (this.scene.hud.hasEnoughRainStones() && !this.wasPainted) {
            const moral_state = MoralState.getAll();
            console.log(moral_state);
            for (const [domain, score] of Object.entries(moral_state)){
                if (score > 0){
                    this.paint(domain);
                }
            }
            this.wasPainted = true;
        }
        
  }
}

