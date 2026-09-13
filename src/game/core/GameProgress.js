const COMPLETION_STORAGE_KEY = 'elephant_and_rider.game_completed';

let completedThisSession = false;

function getStorage() {
    try {
        return window.localStorage;
    } catch {
        return null;
    }
}

export const GameProgress = {
    markCompleted() {
        completedThisSession = true;
        getStorage()?.setItem(COMPLETION_STORAGE_KEY, 'true');
    },

    hasCompletedGame() {
        return completedThisSession
            || getStorage()?.getItem(COMPLETION_STORAGE_KEY) === 'true'
            || (import.meta.env.DEV && new URLSearchParams(window.location.search).has('credits'));
    }
};
