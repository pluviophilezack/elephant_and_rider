/**
 * 偵測當前裝置是否為行動裝置或平板
 * @returns {boolean}
 */
export function isMobileOrTablet() {
    const ua = navigator.userAgent;

    // 1. 常見手機與平板 User-Agent 特徵
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
    if (mobileRegex.test(ua)) {
        return true;
    }

    // 2. iPadOS 特殊處理 (Safari 預設回傳 Macintosh，但具備觸控點)
    const isIPad = /Macintosh/i.test(ua) && Boolean(navigator.maxTouchPoints && navigator.maxTouchPoints > 1);
    if (isIPad) {
        return true;
    }

    // 3. 特性檢查：主指標為粗觸控 (coarse) 且不支援懸停 (hover: none)
    if (window.matchMedia && window.matchMedia('(pointer: coarse) and (hover: none)').matches) {
        return true;
    }

    return false;
}
