import { Scene } from 'phaser';
import { PlayerController } from '../core/PlayerController';
import { GameProgress } from '../core/GameProgress';
import { TextStyles } from '../core/theme';
import { MoralState } from '../core/MoralState';

export const EVENT_CREDITS_MENU_LABEL = '創作者足跡';

const PROXIMITY_RADIUS = 145;
const INSPIRATION_URL = 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3116962/';
const GIRAFFE_PROXIMITY_RADIUS = 120;
const GIRAFFE_ACHIEVEMENT_ID = 'apples_achievement';
const GIRAFFE_DIALOGUE = {
    locked: '「好餓⋯⋯」 \n【待解成就：餵飽高個兒】\n 再次啟程，拯救飢腸轆轆的長頸鹿',
    unlocked: '「謝謝你的三顆蘋果！」\n【成就達成：餵飽高個兒】\n 餵給長頸鹿三顆蘋果'
};

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
        this.playerController.applyCurrentMoralMarks(true);

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

        this.createAchievementGiraffe();

        this.createCreditsPanel();
        this.createBackControl();
        this.createBoardControl();
    }

    createAchievementGiraffe ()
    {
        this.giraffeActor = this.add.sprite(76, 408, 'giraffe')
            .setScale(0.42)
            .setFlipX(true)
            .setDepth(10);
        this.wasNearGiraffe = false;
        this.giraffeMessage = '';

        this.tweens.add({
            targets: this.giraffeActor,
            angle: { from: -2, to: 2 },
            duration: 1200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
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
        this.panelBackground = panelBackground;

        this.creditsText = this.add.text(512, 88, '', {
            ...TextStyles.fontSetting,
            fontSize: '24px',
            color: '#ffffff',
            align: 'center',
            lineSpacing: 6,
            wordWrap: { width: 550, useAdvancedWrap: true }
        }).setOrigin(0.5);
        this.researchLink = this.add.text(512, 0, '閱讀研究 ↗', {
            ...TextStyles.fontSetting, fontSize: '20px', color: '#b8e6ff'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        this.researchLink.on('pointerdown', () => window.open(INSPIRATION_URL, '_blank', 'noopener,noreferrer'));

        this.creditsPanel = this.add.container(0, 0, [panelBackground, this.creditsText, this.researchLink])
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

        const returnToMenu = () => {
            if (this.boardDialog?.open) return;
            const url = new URL(window.location.href);
            url.searchParams.delete('credits');
            window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
            this.scene.start('MainMenu', { forceShowMenu: true });
        };
        backText.on('pointerdown', returnToMenu);
        this.input.keyboard.on('keydown-ESC', returnToMenu);
    }

    update ()
    {
        if (this.boardDialog?.open) return;
        this.playerController?.update();
        this.researchLink.setVisible(false);

        const player = this.playerController?.sprite;
        if (!player) return;

        const giraffeDistance = Phaser.Math.Distance.Between(
            player.x,
            player.y,
            this.giraffeActor.x,
            this.giraffeActor.y
        );
        const isNearGiraffe = giraffeDistance <= GIRAFFE_PROXIMITY_RADIUS;

        if (isNearGiraffe) {
            if (!this.wasNearGiraffe) {
                const overworldScene = this.scene.get('Overworld');
                const hasAchievement = (overworldScene?.sharedState && typeof overworldScene.sharedState.apples_achievement === 'boolean')
                    ? overworldScene.sharedState.apples_achievement
                    : GameProgress.hasAchievement(GIRAFFE_ACHIEVEMENT_ID);

                this.giraffeMessage = hasAchievement
                    ? GIRAFFE_DIALOGUE.unlocked
                    : GIRAFFE_DIALOGUE.locked;
            }

            this.creditsText.setText(this.giraffeMessage);
            this.fitCreditsPanel();
            this.creditsPanel.setVisible(true);
            this.wasNearGiraffe = true;
            return;
        }

        if (giraffeDistance > GIRAFFE_PROXIMITY_RADIUS + 24) {
            this.wasNearGiraffe = false;
        }

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
            this.creditsText.setText([
                `美術設計：${nearestCredit.artist}`,
                '遊戲設計靈感來自 Jonathan Haidt 道德心理學的研究'
            ]);
            this.researchLink.setVisible(true);
        } else {
            this.creditsText.setText([
                nearestCredit.title,
                `關卡設計：${nearestCredit.designer}　程式實作：${nearestCredit.developer}`
            ]);
        }
        this.fitCreditsPanel();
        this.creditsPanel.setVisible(true);
    }

    fitCreditsPanel ()
    {
        const height = Math.max(112, this.creditsText.height + 32 + (this.researchLink.visible ? 32 : 0));
        this.panelBackground.setPosition(512, 32 + height / 2).setSize(590, height);
        this.creditsText.setPosition(512, 48 + this.creditsText.height / 2);
        this.researchLink.setY(48 + this.creditsText.height + 18);
    }

    createBoardControl ()
    {
        this.add.text(996, 26, '我的祈雨石棋盤', {
            ...TextStyles.fontSetting, fontSize: '24px', color: '#25292d'
        }).setOrigin(1, 0).setDepth(110).setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.showStoneBoard());
        this.events.once('shutdown', () => this.boardDialog?.remove());
    }

    showStoneBoard ()
    {
        if (this.boardDialog?.open) return;
        this.playerController.sprite.setVelocity(0, 0);
        const keyboard = this.input.keyboard;
        const keyboardWasEnabled = keyboard?.enabled;
        if (keyboard) {
            keyboard.resetKeys();
            keyboard.enabled = false;
        }
        const currentScores = MoralState.getAll();
        const scores = Object.values(currentScores).some(score => score !== 0)
            ? currentScores : (MoralState.getSavedFromStorage() ?? currentScores);
        const canvas = document.createElement('canvas');
        canvas.width = 900;
        canvas.height = 900;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#eef4ed';
        ctx.fillRect(0, 0, 900, 900);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#25292d';
        ctx.font = '32px naikaifont, sans-serif';
        ctx.fillText('我的祈雨石棋盤', 450, 52);
        ctx.drawImage(this.textures.get('stone_system').getSourceImage(), 100, 85, 700, 640);
        const slots = [
            ['ingroup', 'yellow', 247, 325], ['fairness', 'green', 451, 325],
            ['authority', 'pink', 651, 325], ['purity', 'blue', 339, 554],
            ['harm', 'purple', 560, 554]
        ];
        slots.forEach(([domain, color, x, y]) => {
            const score = Number.isFinite(scores[domain]) ? scores[domain] : 0;
            if (score > 0) {
                const stone = this.textures.get(`${color}_stone`).getSourceImage();
                const scale = Math.min(90 / stone.width, 110 / stone.height);
                ctx.drawImage(stone, x - stone.width * scale / 2, y - stone.height * scale / 2,
                    stone.width * scale, stone.height * scale);
            }
            ctx.fillStyle = '#25292d';
            ctx.font = '22px sans-serif';
            ctx.fillText(String(score), x, y + 70);
        });
        ctx.font = '24px naikaifont, sans-serif';
        ctx.fillText('大象與騎象人', 450, 798);
        ctx.font = '18px naikaifont, sans-serif';
        ctx.fillText('每一次選擇，留下屬於你的足跡。', 450, 839);

        const dialog = document.createElement('dialog');
        this.boardDialog = dialog;
        dialog.setAttribute('aria-label', '我的祈雨石棋盤');
        dialog.style.cssText = 'width:min(600px,90vw);max-height:90vh;border:0;border-radius:8px;padding:16px;background:#eef4ed;color:#25292d;overflow:auto';
        canvas.style.cssText = 'display:block;width:100%;height:auto;max-height:68vh;object-fit:contain';
        dialog.append(canvas);
        const controls = document.createElement('div');
        controls.style.cssText = 'display:flex;gap:12px;flex-wrap:wrap;align-items:center;justify-content:center;margin-top:12px';
        dialog.append(controls);
        const status = document.createElement('p');
        status.setAttribute('role', 'status');
        dialog.append(status);
        const addButton = (label, action) => {
            const button = document.createElement('button');
            button.textContent = label;
            button.style.cssText = 'padding:8px 12px;cursor:pointer;font-size:16px';
            button.onclick = action;
            controls.append(button);
        };
        addButton('下載 PNG', () => {
            const link = document.createElement('a');
            link.download = 'my-rain-stone-board.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        });
        const url = new URL(window.location.href);
        url.search = '';
        url.hash = '';
        const shareUrl = ['localhost', '127.0.0.1'].includes(url.hostname)
            ? 'https://github.com/pluviophilezack/elephant_and_rider' : url.href;
        addButton('分享棋盤', async () => {
            try {
                const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
                const file = new File([blob], 'my-rain-stone-board.png', { type: 'image/png' });
                if (navigator.canShare?.({ files: [file] })) {
                    await navigator.share({ title: '我的祈雨石棋盤', files: [file] });
                } else {
                    await navigator.clipboard.writeText(shareUrl);
                    status.textContent = '已複製遊戲連結；可下載棋盤圖片後附在貼文中。';
                }
            } catch (error) {
                if (error.name !== 'AbortError') status.textContent = '目前無法分享，請下載圖片或使用社群連結。';
            }
        });
        for (const [label, href] of [
            ['Facebook ↗', `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`],
            ['LINE ↗', `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}`]
        ]) {
            const link = document.createElement('a');
            link.textContent = label;
            link.href = href;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            controls.append(link);
        }
        addButton('關閉', () => dialog.close());
        dialog.addEventListener('close', () => {
            if (keyboard) {
                keyboard.resetKeys();
                keyboard.enabled = keyboardWasEnabled;
            }
            dialog.remove();
        }, { once: true });
        document.body.append(dialog);
        dialog.showModal();
    }
}
