export class AudioManager {
    static instance = null;

    constructor(scene) {
        if (AudioManager.instance) return AudioManager.instance;
        this.scene = scene;
        this.currentBGM = null;
        this.currentBGMKey = '';
        this.sfxCache = {}; // 用於管理需要斷音重播的音效 (如魔杖揮舞)
        AudioManager.instance = this;
    }

    static getInstance(scene) {
        if (!AudioManager.instance && scene) {
            AudioManager.instance = new AudioManager(scene);
        } else if (scene) {
            AudioManager.instance.scene = scene; // 更新當前 Scene 參照
        }
        return AudioManager.instance;
    }

    // -------------------------------------------------------------
    // 1. 一般音效 SFX 播放 (支援快速連按時斷音重播)
    // -------------------------------------------------------------
    // -------------------------------------------------------------
    // 1. 一般音效 SFX 播放 (含安全防護與空白字元自動修正)
    // -------------------------------------------------------------
    playSFX(key, config = {}, interrupt = false) {
        if (!this.scene || !this.scene.sound) return;

        // 💡 自動修正與尋找可能的 Key 名稱 (包含處理空格與 %20)
        let validKey = key;
        if (!this.scene.cache.audio.exists(validKey)) {
            const alternativeKeys = [
                key.replace(/_/g, ' '),            // bgm_piano_magic motive
                key.replace(/ /g, '_'),            // bgm_piano_magic_motive
                key.replace(/_motive/, '%20motive'), // bgm_piano_magic%20motive
                'bgm_piano_magic%20motive'
            ];
            validKey = alternativeKeys.find(k => this.scene.cache.audio.exists(k));
        }

        // 若仍找不到對應音檔，則輸出警告並安全跳過，避免遊戲崩潰
        if (!validKey) {
            console.warn(`[AudioManager] 音效 Key "${key}" 尚未載入或不存在於 Cache 中，跳過播放。`);
            return;
        }

        // 若開啟 interrupt，快速點擊會中斷上一次音效並重新播放
        if (interrupt && this.sfxCache[validKey]) {
            this.sfxCache[validKey].stop();
        }

        const sound = this.scene.sound.add(validKey, { volume: 1.0, ...config });
        sound.play();

        if (interrupt) {
            this.sfxCache[validKey] = sound;
        }
    }

    // -------------------------------------------------------------
    // 2. BGM 播放與淡入淡出 (Fade In / Fade Out)
    // -------------------------------------------------------------
    playBGM(key, config = {}, fadeTimeMs = 1000) {
        if (!this.scene || !this.scene.sound) return;
        if (this.currentBGMKey === key && this.currentBGM?.isPlaying) return;

        // 若有舊 BGM，先淡出再播放新 BGM
        if (this.currentBGM && this.currentBGM.isPlaying) {
            this.fadeOutBGM(fadeTimeMs, () => {
                this._startBGM(key, config, fadeTimeMs);
            });
        } else {
            this._startBGM(key, config, fadeTimeMs);
        }
    }

    _startBGM(key, config, fadeTimeMs) {
        const targetVolume = config.volume ?? 0.6;
        this.currentBGMKey = key;
        this.currentBGM = this.scene.sound.add(key, { loop: true, ...config, volume: 0 });
        this.currentBGM.play();

        // BGM 淡入
        this.scene.tweens.add({
            targets: this.currentBGM,
            volume: targetVolume,
            duration: fadeTimeMs
        });
    }

    fadeOutBGM(fadeTimeMs = 2000, onComplete = null) {
        if (!this.currentBGM || !this.currentBGM.isPlaying) {
            onComplete?.();
            return;
        }

        this.scene.tweens.add({
            targets: this.currentBGM,
            volume: 0,
            duration: fadeTimeMs,
            onComplete: () => {
                this.currentBGM.stop();
                this.currentBGM.destroy();
                this.currentBGM = null;
                this.currentBGMKey = '';
                onComplete?.();
            }
        });
    }

    // -------------------------------------------------------------
    // 3. 特殊銜接曲目：Intro -> Loop (對應 bgm_rush_intro + bgm_rush_loop)
    // -------------------------------------------------------------
    playIntroThenLoop(introKey, loopKey, volume = 0.6) {
        if (!this.scene) return;
        
        if (this.currentBGM) this.currentBGM.stop();

        const intro = this.scene.sound.add(introKey, { loop: false, volume: volume });
        const loop = this.scene.sound.add(loopKey, { loop: true, volume: volume });

        this.currentBGM = intro;
        this.currentBGMKey = introKey;

        intro.once('complete', () => {
            loop.play();
            this.currentBGM = loop;
            this.currentBGMKey = loopKey;
        });

        intro.play();
    }

    // 💡 停止或淡出特定的 SFX 音效
    stopSFX(key, fadeTimeMs = 300) {
        if (!this.scene || !this.scene.sound) return;

        // 尋找快取或播放中的 Sound 物件
        const sounds = this.scene.sound.getAll(key);
        sounds.forEach(sound => {
            if (sound && sound.isPlaying) {
                if (fadeTimeMs > 0) {
                    this.scene.tweens.add({
                        targets: sound,
                        volume: 0,
                        duration: fadeTimeMs,
                        onComplete: () => {
                            sound.stop();
                            sound.destroy();
                        }
                    });
                } else {
                    sound.stop();
                    sound.destroy();
                }
            }
        });

        if (this.sfxCache[key]) {
            delete this.sfxCache[key];
        }
    }
}
