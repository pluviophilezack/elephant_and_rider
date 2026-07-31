// 專案總入口：等待網頁 DOM 載入完成後啟動 Phaser 遊戲
import StartGame from './game/main';

document.addEventListener('DOMContentLoaded', () => {

    StartGame('game-container');

});
