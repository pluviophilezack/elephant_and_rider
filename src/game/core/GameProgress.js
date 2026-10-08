const COMPLETION_STORAGE_KEY = 'elephant_and_rider.game_completed';
const ACHIEVEMENTS_STORAGE_KEY = 'elephant_and_rider.achievements';

let completedThisSession = false;
const achievementsThisSession = new Set();

function getStorage() {
    try {
        return window.localStorage;
    } catch {
        return null;
    }
}

function getStoredAchievements() {
    try {
        const storedValue = getStorage()?.getItem(ACHIEVEMENTS_STORAGE_KEY);
        const achievements = storedValue ? JSON.parse(storedValue) : [];
        return Array.isArray(achievements) ? achievements : [];
    } catch {
        return [];
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
    },

    unlockAchievement(achievementId) {
        if (!achievementId) return;

        achievementsThisSession.add(achievementId);
        const achievements = new Set(getStoredAchievements());
        achievements.add(achievementId);
        getStorage()?.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify([...achievements]));
    },

    hasAchievement(achievementId) {
        return achievementsThisSession.has(achievementId)
            || getStoredAchievements().includes(achievementId);
    }
};
