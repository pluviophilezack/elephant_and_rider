import { DialogueBox } from '../ui/DialogueBox';

export const DialogueSystem = {
    _active: null,
    _queue: [],

    // lines accepts strings or objects:
    // { speaker: '猴長老', text: '歡迎來到象群。' }
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
        return Boolean(this._active);
    },

    _startNext() {
        if (this._active || this._queue.length === 0) return;

        const job = this._queue.shift();

        // Do not show queued dialogue for a scene that is no longer active.
        if (!job.scene?.sys?.isActive()) {
            this._startNext();
            return;
        }

        this._active = job;
        job.box = new DialogueBox(job.scene);

        job.shutdownHandler = () => this._finish(job, false);
        job.scene.events.once('shutdown', job.shutdownHandler);

        const showNext = () => {
            if (job.finished) return;

            if (job.index >= job.lines.length) {
                this._finish(job, true);
                return;
            }

            job.box.setDialogue(job.lines[job.index]);
            job.index += 1;
        };

        job.box.onAdvance(showNext);
        showNext();
    },

    _finish(job, completed) {
        if (!job || job.finished) return;

        job.finished = true;
        job.scene?.events?.off('shutdown', job.shutdownHandler);
        job.box?.destroy();

        if (this._active === job) {
            this._active = null;
        } else {
            this._queue = this._queue.filter((queuedJob) => queuedJob !== job);
        }

        if (completed) {
            job.onComplete?.();
        }

        this._startNext();
    }
};