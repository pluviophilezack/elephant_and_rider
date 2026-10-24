// 核心系統：追蹤玩家在單次遊玩中的五種道德數值（Purity/Fairness/Ingroup/Authority/Harm）
// 僅存在於記憶體中，不做存讀檔；每次從 MainMenu 重新開始遊戲時應呼叫 reset()

const DIMENSIONS = ['purity', 'fairness', 'ingroup', 'authority', 'harm'];

const counts = {
    purity: 0,
    fairness: 0,
    ingroup: 0,
    authority: 0,
    harm: 0
};

export const MoralState = {

    // 為指定道德向度增加分數（amount 可為負數）
    add(dimension, amount = 1) {
        if (!DIMENSIONS.includes(dimension)) {
            console.warn(`[MoralState] 未知的道德向度：${dimension}`);
            return;
        }
        counts[dimension] += amount;
        this.saveToStorage();
    },

    // 取得指定道德向度目前的分數
    get(dimension) {
        return counts[dimension] ?? 0;
    },

    // 取得所有道德向度分數的複本，供 Ending 場景判斷結局用
    getAll() {
        return { ...counts };
    },

    // 儲存目前數值到 localStorage（於通關/結局時呼叫）
    saveToStorage() {
        try {
            window.localStorage?.setItem('elephant_and_rider.moral_state', JSON.stringify(counts));
        } catch (e) {
            console.warn('[MoralState] 無法儲存道德數值至 localStorage:', e);
        }
    },

    // 從 localStorage 讀取先前結尾儲存的道德數值（供創作者足跡等場景使用）
    getSavedFromStorage() {
        try {
            const raw = window.localStorage?.getItem('elephant_and_rider.moral_state');
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    },

    // 重置所有道德數值，於重新開始遊戲時呼叫
    reset() {
        DIMENSIONS.forEach(dimension => {
            counts[dimension] = 0;
        });
    }
};
