import test from 'node:test';
import assert from 'node:assert/strict';
import { HUD } from '../src/game/ui/HUD.js';

function displayObject() {
    return {
        active: true, visible: true,
        setScrollFactor() { return this; }, setDepth() { return this; },
        setOrigin() { return this; }, setStrokeStyle() { return this; },
        setAlpha() { return this; }, setScale() { return this; }, add() {},
        setText(value) { this.text = value; return this; },
        setVisible(value) { this.visible = value; return this; },
        destroy() { this.active = false; }
    };
}

test('HUD stays hidden at zero, completes at five, and clamps the maximum', () => {
    const scene = {
        sharedState: {},
        add: Object.fromEntries(['container', 'rectangle', 'image', 'text'].map(key => [key, displayObject])),
        time: { addEvent: () => ({ remove() {} }) }
    };
    const hud = new HUD(scene);
    const dry = displayObject();
    hud.bindRiverFlow(dry);
    assert.equal(hud.container.visible, false);
    hud.setRainStoneCount(1);
    assert.equal(hud.container.visible, true);
    hud.setRainStoneCount(3);
    assert.equal(dry.visible, true);
    hud.setRainStoneCount(4);
    assert.equal(dry.visible, false);
    assert.equal(scene.sharedState.rain, true);
    assert.equal(hud.hasEnoughRainStones(), false);
    hud.setRainStoneCount(5);
    assert.equal(hud.hasEnoughRainStones(), true);
    assert.equal(hud.text.text, '5 / 5');
    hud.setRainStoneCount(6);
    assert.equal(hud.rainStoneCount, 5);
    hud.setRainStoneCount(3);
    assert.equal(dry.visible, true);
    assert.equal(scene.sharedState.rain, false);
    assert.equal(hud.waterSprite, null);
    hud.resetRainStones();
    assert.equal(hud.container.visible, false);
});
