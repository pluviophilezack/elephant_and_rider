// 專案總入口：等待網頁 DOM 載入完成後啟動 Phaser 遊戲
import StartGame from './game/main';
import { THEME_FONT } from './game/core/theme';
import { isMobileOrTablet } from './utils/device';

const GAME_URL_PLACEHOLDER = 'https://google.com';

function showDesktopOnlyScreen() {
    const screen = document.createElement('div');
    screen.id = 'device-block-screen';
    screen.style.fontFamily = THEME_FONT;

    // 1. 上方標題
    const header = document.createElement('div');
    header.className = 'device-block-header';
    header.style.fontFamily = THEME_FONT;
    header.innerText = '大象與騎象人';

    // 2. 中間內容區（指引文字與按鈕）
    const content = document.createElement('div');
    content.className = 'device-block-content';

    const title = document.createElement('div');
    title.className = 'device-block-title';
    title.style.fontFamily = THEME_FONT;
    title.innerText = '操控大象需要鍵盤，請用電腦遊玩！';

    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-link-btn';
    copyBtn.style.fontFamily = THEME_FONT;
    copyBtn.innerText = '複製遊戲連結';

    const hint = document.createElement('div');
    hint.className = 'copy-hint';
    hint.style.fontFamily = THEME_FONT;

    copyBtn.addEventListener('click', async () => {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(GAME_URL_PLACEHOLDER);
            } else {
                const tempInput = document.createElement('input');
                tempInput.value = GAME_URL_PLACEHOLDER;
                document.body.appendChild(tempInput);
                tempInput.select();
                document.execCommand('copy');
                document.body.removeChild(tempInput);
            }
            hint.innerText = '已複製遊戲連結至剪貼簿！';
        } catch {
            hint.innerText = `複製失敗，請手動複製：${GAME_URL_PLACEHOLDER}`;
        }
    });

    content.appendChild(title);
    content.appendChild(copyBtn);
    content.appendChild(hint);

    // 3. 下方主角動畫（原地交替兩張圖片）
    const animContainer = document.createElement('div');
    animContainer.className = 'character-anim-container';

    const characterImg = document.createElement('img');
    characterImg.className = 'character-sprite';
    const frames = [
        'assets/main_characters/main_character_moving_01.png',
        'assets/main_characters/main_character_moving_02.png'
    ];
    let currentFrameIndex = 0;
    characterImg.src = frames[currentFrameIndex];
    characterImg.alt = '主角';

    // 每 200ms 切換一次圖片，呈現原地走路動畫
    setInterval(() => {
        currentFrameIndex = (currentFrameIndex + 1) % frames.length;
        characterImg.src = frames[currentFrameIndex];
    }, 200);

    animContainer.appendChild(characterImg);

    screen.appendChild(header);
    screen.appendChild(content);
    screen.appendChild(animContainer);

    document.body.appendChild(screen);

    // 移除遊戲容器以節省資源並徹底阻擋
    const appEl = document.getElementById('app');
    if (appEl) {
        appEl.remove();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (isMobileOrTablet()) {
        showDesktopOnlyScreen();
        return;
    }

    StartGame('game-container');
});

document.addEventListener('contextmenu', (event) => {
    event.preventDefault();
});

