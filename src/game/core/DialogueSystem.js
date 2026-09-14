import { DialogueBox } from '../ui/DialogueBox';

export const DialogueSystem = {
    _active: null,
    _queue: [],
    _isZooming: false, // 運鏡中狀態
    _isZoomed: false,  // 鏡頭是否處於 1.5x 狀態
    _baseZoom: 1,      // 原始鏡頭縮放比例

    show(scene, lines, onComplete) {
        const normalizedLines = (Array.isArray(lines) ? lines : [])
            .map((line) => typeof line === 'string' ? { text: line } : line)
            .filter((line) => line && typeof line.text === 'string' && line.text.trim());

        if (normalizedLines.length === 0) {
            onComplete?.();
            return { cancel() {}, isActive: () => false };
        }

        const job = {
            scene,
            lines: normalizedLines,
            onComplete,
            box: null,
            index: 0,
            finished: false,
            shutdownHandler: null
        };

        const handle = {
            cancel: () => this._finish(job, false),
            isActive: () => this._active === job && !job.finished
        };

        job.handle = handle;
        this._queue.push(job);
        this._startNext();

        return handle;
    },

    isShowing() {
        return Boolean(this._active) || this._isZooming;
    },

    _startNext() {
        if (this._active || this._queue.length === 0) return;

        const job = this._queue.shift();

        if (!job.scene?.sys?.isActive()) {
            this._startNext();
            return;
        }

        this._active = job;
        const camera = job.scene.cameras?.main;

        if (!this._isZoomed && camera) {
            this._baseZoom = camera.zoom || 1;
        }

        const startDialogueBox = () => {
            job.box = new DialogueBox(job.scene);

            job.shutdownHandler = () => this._finish(job, false);
            job.scene.events.once('shutdown', job.shutdownHandler);

            // 關鍵修復：防按鍵穿透鎖 (Debounce Lock)
            // 對話框剛產生的 250ms 內，忽略所有切換頁面的輸入觸發
            let canAdvance = false;
            job.scene.time.delayedCall(250, () => {
                canAdvance = true;
            });

            const showNext = () => {
                if (job.finished) return;

                if (job.index >= job.lines.length) {
                    this._finish(job, true);
                    return;
                }

                job.box.setDialogue(job.lines[job.index]);
                job.index += 1;
            };

            job.box.onAdvance(() => {
                // 只有過冷卻時間後才允許切換下一句
                if (canAdvance) {
                    showNext();
                }
            });

            // 顯示第一則對話 (lines[0])
            showNext();
        };

        // 階段一：鏡頭漸進 (1.5x, 耗時 1 秒)
        if (camera && !this._isZoomed) {
            this._isZooming = true;
            job.scene.tweens.add({
                targets: camera,
                zoom: this._baseZoom * 1.5,
                duration: 1000,
                ease: 'Cubic.easeInOut',
                onComplete: () => {
                    this._isZooming = false;
                    this._isZoomed = true;
                    if (!job.finished) {
                        startDialogueBox();
                    }
                }
            });
        } else {
            startDialogueBox();
        }
    },

    _finish(job, completed) {
        if (!job || job.finished) return;

        job.finished = true;
        job.scene?.events?.off('shutdown', job.shutdownHandler);
        job.box?.destroy();
        job.box = null;

        const camera = job.scene?.cameras?.main;

        const finalize = () => {
            if (this._active === job) {
                this._active = null;
            } else {
                this._queue = this._queue.filter((queuedJob) => queuedJob !== job);
            }

            if (completed) {
                job.onComplete?.();
            }

            this._startNext();
        };

        // 階段二：對話完結且無佇列時，鏡頭漸遠復原 (1 秒)
        if (camera && this._queue.length === 0 && this._isZoomed) {
            this._isZooming = true;
            job.scene.tweens.add({
                targets: camera,
                zoom: this._baseZoom,
                duration: 1000,
                ease: 'Cubic.easeInOut',
                onComplete: () => {
                    this._isZooming = false;
                    this._isZoomed = false;
                    finalize();
                }
            });
        } else {
            finalize();
        }
    }
};