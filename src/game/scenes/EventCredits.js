import { Scene } from 'phaser';
import { PlayerController } from '../core/PlayerController';
import { TextStyles } from '../core/theme';

export const EVENT_CREDITS_MENU_LABEL = '創作者足跡';

const PROXIMITY_RADIUS = 145;

// Credits are kept here so names can be updated without touching scene logic.
const EVENT_CREDITS = [
    {
        title: '教學階段',
        texture: 'monkey_elder_pleased',
        scale: 0.58,
        x: 170,
        y: 205,
        designer: 'Zack Yu',
        developer: 'Zack Yu'
    },
    {
        title: '歌唱比賽的團隊精神',
        texture: 'bird_member_01',
        scale: 0.7,
        x: 512,
        y: 230,
        designer: 'Zack Yu',
        developer: 'Ranger'
    },
    {
        title: '喝水事件',
        texture: 'antelope_stand',
        scale: 0.5,
        x: 854,
        y: 210,
        designer: 'yujueq',
        developer: 'yujueq'
    },
    {
        title: '水域廢墟事件：被污染的聖物',
        texture: 'guard_saved',
        scale: 0.42,
        x: 170,
        y: 590,
        designer: 'Ranger',
        developer: 'Yuchi'
    },
    {
        title: '象群事件（跟隨事件＋王權事件）',
        texture: 'old_elephant_king',
        scale: 0.43,
        x: 512,
        y: 580,
        designer: 'Yuchi',
        developer: 'Andy'
    }
];

const ART_CREDIT = {
    role: 'art',
    texture: 'rider',
    scale: 0.4,
    x: 854,
    y: 580,
    artist: 'ingrid'
};

const CREDITS = [...EVENT_CREDITS, ART_CREDIT];

export class EventCredits extends Scene
{
    constructor ()
    {
        super('EventCredits');
    }

    create ()
    {
        const width = this.scale.width;
        const height = this.scale.height;

        this.cameras.main.setBackgroundColor(0xeeb92e);
        this.physics.world.setBounds(0, 0, width, height);
        this.createSavannaBackdrop(width, height);

        this.playerController = new PlayerController(this, width / 2, height / 2);
        this.playerController.speed = 220;

        this.creditActors = CREDITS.map((credit, index) => {
            const actor = this.add.sprite(credit.x, credit.y, credit.texture)
                .setScale(credit.scale)
                .setDepth(10);

            this.tweens.add({
                targets: actor,
                y: credit.y - 7,
                duration: 1100 + index * 90,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });

            return { ...credit, actor };
        });

        this.createCreditsPanel();
        this.createBackControl();
    }

    createSavannaBackdrop (width, height)
    {
        this.add.rectangle(width / 2, height / 2, width, height, 0xeeb92e)
            .setDepth(-30);

        const decorations = [
            { texture: 'apple_tree', x: 52, y: 680, scale: 0.32 },
            { texture: 'apple_tree', x: 972, y: 680, scale: 0.32, flipX: true },
            { texture: 'bush_01', x: 30, y: 330, scale: 0.55 },
            { texture: 'bush_02', x: 994, y: 330, scale: 0.55 },
            { texture: 'bush_02', x: 170, y: 748, scale: 0.48 },
            { texture: 'bush_01', x: 850, y: 748, scale: 0.48 },
            { texture: 'bush_01', x: 360, y: 24, scale: 0.42 },
            { texture: 'bush_02', x: 664, y: 24, scale: 0.42 }
        ];

        decorations.forEach((decoration) => {
            this.add.image(decoration.x, decoration.y, decoration.texture)
                .setScale(decoration.scale)
                .setFlipX(Boolean(decoration.flipX))
                .setDepth(-20);
        });
    }

    createCreditsPanel ()
    {
        const panelBackground = this.add.rectangle(512, 88, 590, 112, 0x20262b, 0.92)
            .setStrokeStyle(2, 0xffffff, 0.35);

        this.creditsText = this.add.text(512, 88, '', {
            ...TextStyles.fontSetting,
            fontSize: '24px',
            color: '#ffffff',
            align: 'center',
            lineSpacing: 6
        }).setOrigin(0.5);

        this.creditsPanel = this.add.container(0, 0, [panelBackground, this.creditsText])
            .setDepth(100)
            .setVisible(false);
    }

    createBackControl ()
    {
        const backText = this.add.text(28, 26, '返回主選單', {
            ...TextStyles.fontSetting,
            fontSize: '24px',
            color: '#25292d'
        }).setInteractive({ useHandCursor: true }).setDepth(110);

        const returnToMenu = () => this.scene.start('MainMenu');
        backText.on('pointerdown', returnToMenu);
        this.input.keyboard.on('keydown-ESC', returnToMenu);
    }

    update ()
    {
        this.playerController?.update();

        const player = this.playerController?.sprite;
        if (!player) return;

        let nearestCredit = null;
        let nearestDistance = Number.POSITIVE_INFINITY;

        this.creditActors.forEach((credit) => {
            const distance = Phaser.Math.Distance.Between(
                player.x,
                player.y,
                credit.actor.x,
                credit.actor.y
            );

            if (distance < nearestDistance) {
                nearestCredit = credit;
                nearestDistance = distance;
            }
        });

        if (!nearestCredit || nearestDistance > PROXIMITY_RADIUS) {
            this.creditsPanel.setVisible(false);
            return;
        }

        if (nearestCredit.role === 'art') {
            this.creditsText.setText(`美術設計：${nearestCredit.artist}`);
        } else {
            this.creditsText.setText([
                nearestCredit.title,
                `關卡設計：${nearestCredit.designer}　程式實作：${nearestCredit.developer}`
            ]);
        }
        this.creditsPanel.setVisible(true);
    }
}
