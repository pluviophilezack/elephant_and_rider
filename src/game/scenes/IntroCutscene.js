// 開頭動畫過場場景：引導玩家思考道德本質，展示心智模型（象與騎象人）後進入大地圖
import { Scene } from 'phaser';
import { THEME_FONT, TextStyles } from '../core/theme';

/**
 * 開頭過場動畫參數設定（可在此自由微調各項數值）
 */
export const INTRO_CONFIG = {
    // 1. 背景顏色（米白色，提供十六進位字串供後續微調）
    backgroundColor: '#f1af41',

    // 2. 文字外觀樣式
    textColor: '#3A3836',          // 米白底色下具典雅質感且高對比的深炭灰
    fontSize: '32px',
    lineSpacing: 12,

    // 3. 時間參數（毫秒）
    textDuration: 5000,            // 每段文字停留時間（預設 5 秒）
    textFadeDuration: 800,         // 文字淡入／淡出動畫時長
    pauseBetweenTexts: 400,        // 每段文字淡出後，下一段出現前的停頓空白時間
    characterFadeDuration: 1200,   // 主角（大象與騎象人）淡入動畫時長
    sceneTransitionFadeDuration: 800, // 結束轉場至 Overworld 的淡出時長

    // 4. 座標與版面佈局（遊戲畫布預設為 1024 x 768）
    earlyTextY: 384,               // 前三句文字的 Y 軸位置（畫面正中央）
    characterX: 512,               // 主角 X 軸置中
    characterY: 310,               // 主角 Y 軸位置（偏中央上方）
    characterScale: 0.5,           // 主角縮放比例
    lateTextY: 530                 // 後兩句文字（主角在場時）的 Y 軸位置（主角下方）
};

// 開頭對白腳本內容
const INTRO_SCRIPTS = [
    // 前三句（主角尚未出現）
    { text: '提到「道德」，你會想到什麼呢？', hasCharacter: false },
    { text: '你覺得道德可用推理演繹得出嗎？', hasCharacter: false },
    { text: '還是推理其實有極限，道德本屬於人性呢？', hasCharacter: false },
    // 後兩句（主角登場並同時顯示）
    { text: '這是你的心智，象與騎象人。', hasCharacter: true },
    { text: '你的冒險即將開始', hasCharacter: true }
];

export class IntroCutscene extends Scene {
    constructor() {
        super('IntroCutscene');
    }

    create() {
        this.isSceneActive = true;

        // 當場景關閉時標記，避免非同步回呼持續執行
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.isSceneActive = false;
        });

        // 1. 設定米白色底色
        this.cameras.main.setBackgroundColor(INTRO_CONFIG.backgroundColor);
        this.bgRect = this.add.rectangle(
            512,
            384,
            1024,
            768,
            Phaser.Display.Color.HexStringToColor(INTRO_CONFIG.backgroundColor).color
        ).setDepth(0);

        // 2. 建立主角 Sprite（預設為靜止圖樣，初始完全透明）
        this.mainCharacter = this.add.sprite(
            INTRO_CONFIG.characterX,
            INTRO_CONFIG.characterY,
            'main_character_stand_still'
        )
            .setScale(INTRO_CONFIG.characterScale)
            .setAlpha(0)
            .setDepth(10);

        // 3. 建立文字物件（套用 theme.js 的字型與設定參數）
        this.captionText = this.add.text(512, INTRO_CONFIG.earlyTextY, '', {
            ...TextStyles.fontSetting,
            fontFamily: THEME_FONT,
            fontSize: INTRO_CONFIG.fontSize,
            color: INTRO_CONFIG.textColor,
            lineSpacing: INTRO_CONFIG.lineSpacing,
            align: 'center',
            wordWrap: { width: 850 }
        })
            .setOrigin(0.5)
            .setAlpha(0)
            .setDepth(20);

        // 4. 開始執行對白過場序列
        this.playCutscene();
    }

    /**
     * 播放整段開頭動畫過場
     */
    async playCutscene() {
        // 第一階段：播放前三句問題
        for (let i = 0; i < 3; i++) {
            if (!this.isSceneActive) return;

            const item = INTRO_SCRIPTS[i];
            this.captionText.setPosition(512, INTRO_CONFIG.earlyTextY);
            this.captionText.setText(item.text);

            // 淡入
            await this.fadeObject(this.captionText, 1, INTRO_CONFIG.textFadeDuration);
            if (!this.isSceneActive) return;

            // 停留 5 秒（供玩家閱讀）
            await this.waitDuration(INTRO_CONFIG.textDuration);
            if (!this.isSceneActive) return;

            // 淡出
            await this.fadeObject(this.captionText, 0, INTRO_CONFIG.textFadeDuration);
            if (!this.isSceneActive) return;

            // 間隔停頓
            await this.waitDuration(INTRO_CONFIG.pauseBetweenTexts);
            if (!this.isSceneActive) return;
        }

        // 第二階段：淡入主角，並同時顯示第四句
        if (!this.isSceneActive) return;

        this.captionText.setPosition(512, INTRO_CONFIG.lateTextY);
        this.captionText.setText(INTRO_SCRIPTS[3].text);

        // 主角與第四句文字同時淡入
        await Promise.all([
            this.fadeObject(this.mainCharacter, 1, INTRO_CONFIG.characterFadeDuration),
            this.fadeObject(this.captionText, 1, INTRO_CONFIG.textFadeDuration)
        ]);
        if (!this.isSceneActive) return;

        // 停留 5 秒
        await this.waitDuration(INTRO_CONFIG.textDuration);
        if (!this.isSceneActive) return;

        // 第四句文字淡出（主角保持留在畫面上）
        await this.fadeObject(this.captionText, 0, INTRO_CONFIG.textFadeDuration);
        if (!this.isSceneActive) return;

        await this.waitDuration(INTRO_CONFIG.pauseBetweenTexts);
        if (!this.isSceneActive) return;

        // 第三階段：第五句「你將開始你的冒險。」
        this.captionText.setText(INTRO_SCRIPTS[4].text);
        await this.fadeObject(this.captionText, 1, INTRO_CONFIG.textFadeDuration);
        if (!this.isSceneActive) return;

        await this.waitDuration(INTRO_CONFIG.textDuration);
        if (!this.isSceneActive) return;

        await this.fadeObject(this.captionText, 0, INTRO_CONFIG.textFadeDuration);
        if (!this.isSceneActive) return;

        // 第四階段：整場淡出並轉場進入 Overworld 大地圖
        await Promise.all([
            this.fadeObject(this.mainCharacter, 0, INTRO_CONFIG.sceneTransitionFadeDuration),
            this.fadeCamera(INTRO_CONFIG.sceneTransitionFadeDuration)
        ]);
        if (!this.isSceneActive) return;

        this.scene.start('Overworld');
    }

    /**
     * 物件透明度動畫封裝（Promise）
     */
    fadeObject(target, toAlpha, duration) {
        return new Promise((resolve) => {
            if (!this.isSceneActive) {
                resolve();
                return;
            }
            this.tweens.add({
                targets: target,
                alpha: toAlpha,
                duration: duration,
                ease: 'Sine.easeInOut',
                onComplete: resolve
            });
        });
    }

    /**
     * 攝影機淡出封裝（Promise）
     */
    fadeCamera(duration) {
        return new Promise((resolve) => {
            if (!this.isSceneActive) {
                resolve();
                return;
            }
            this.cameras.main.fadeOut(duration, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', resolve);
        });
    }

    /**
     * 停留延遲時間封裝（Promise）
     */
    waitDuration(ms) {
        return new Promise((resolve) => {
            if (!this.isSceneActive) {
                resolve();
                return;
            }
            this.time.delayedCall(ms, resolve);
        });
    }
}
