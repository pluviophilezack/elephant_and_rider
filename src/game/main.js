// 遊戲核心進入點：定義 Phaser GameConfig，並依序註冊所有場景（Scene）
import { Boot } from './scenes/Boot';
import { MainMenu } from './scenes/MainMenu';
import { Overworld } from './scenes/Overworld';
import { Ending } from './scenes/Ending';
import { AUTO, Game, Scale } from 'phaser';

//  Find out more information about the Game Config at:
//  https://docs.phaser.io/api-documentation/typedef/types-core#gameconfig
const config = {
    type: AUTO,
    width: 1024,
    height: 768,
    parent: 'game-container',
    backgroundColor: '#ffffff',
    scale: {
        mode: Scale.FIT,
        autoCenter: Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            debug: true
        }
    },
    scene: [
        Boot,
        MainMenu,
        Overworld,
        Ending
    ]
};

const StartGame = (parent) => {

    return new Game({ ...config, parent });

}

export default StartGame;
