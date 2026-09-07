import { TextStyles } from "../core/theme";

export class DialogueBox {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.destroyed = false;
    this._advanceCallback = null;

    this.options = {
      maxWidth: options.maxWidth ?? 720,
      maxCharsPerLine: options.maxCharsPerLine ?? 20,
      bottomMargin: options.bottomMargin ?? 28,
      paddingX: options.paddingX ?? 32,
      paddingY: options.paddingY ?? 18,
    };

    this.container = scene.add
      .container(0, 0)
      .setScrollFactor(0)
      .setDepth(1000);

    // Border removed; solid white background
    this.background = scene.add.rectangle(0, 0, 600, 120, 0xffffff, 1);

    const speakerStyle = {
      ...TextStyles.fontSetting,
      align: "center",
      fontSize: "20px",
      color: "#5C5A93",
    };

    this.speakerText = scene.add
      .text(0, 0, "", speakerStyle)
      .setOrigin(0.5);

    const bodyStyle = {
      ...TextStyles.fontSetting,
      align: "center",
      fontSize: "26px",
      wordWrap: { width: 600 },
      color: "#5C5A93",
    };

    this.bodyText = scene.add
      .text(0, 0, "", bodyStyle)
      .setOrigin(0.5);

    this.container.add([
      this.background,
      this.speakerText,
      this.bodyText,
    ]);

    this._handleAdvance = this._handleAdvance.bind(this);
    this._handleKeyDown = this._handleKeyDown.bind(this);
    this._handleResize = this._handleResize.bind(this);

    scene.input.on("pointerdown", this._handleAdvance);
    scene.input.keyboard?.on("keydown", this._handleKeyDown);
    scene.scale.on("resize", this._handleResize);

    this.setDialogue({ text: "" });
  }

  setDialogue({ speaker = "", text = "" }) {
    if (this.destroyed) return;

    this.speakerText.setText(speaker);
    this.speakerText.setVisible(Boolean(speaker));
    this.bodyText.setText(this._insertLineBreaks(text));

    this._layout();
  }

  // Kept for compatibility with the original DialogueSystem API.
  setText(text) {
    this.setDialogue({ text });
  }

  onAdvance(callback) {
    this._advanceCallback = callback;
  }

  _handleAdvance() {
    if (!this.destroyed) {
      this._advanceCallback?.();
    }
  }

  _handleKeyDown(event) {
    if (event.repeat) return;

    if (event.code === "Space" || event.code === "Enter") {
      this._handleAdvance();
    }
  }

  _handleResize() {
    this._layout();
  }

  _insertLineBreaks(text) {
    const maxChars = this.options.maxCharsPerLine;
    const paragraphs = String(text ?? "").split("\n");

    return paragraphs
      .map((paragraph) => {
        const chars = Array.from(paragraph);
        const L = chars.length;

        const breakCount = Math.max(0, Math.floor((L - 1) / maxChars));
        let result = "";

        for (let i = 0; i < breakCount; i += 1) {
          result +=
            chars.slice(i * maxChars, (i + 1) * maxChars).join("") + "\n";
        }

        result += chars.slice(breakCount * maxChars).join("");
        return result;
      })
      .join("\n");
  }

  _layout() {
    if (this.destroyed) return;

    const viewportWidth = this.scene.scale.width;
    const viewportHeight = this.scene.scale.height;
    const width = Math.min(this.options.maxWidth, viewportWidth - 48);
    const contentWidth = width - this.options.paddingX * 2;

    this.bodyText.setWordWrapWidth(contentWidth);
    this.bodyText.setAlign("center");

    const speakerHeight = this.speakerText.visible
      ? this.speakerText.height
      : 0;
    const speakerGap = this.speakerText.visible ? 8 : 0;
    const bodyHeight = this.bodyText.height;

    const height =
      this.options.paddingY * 2 +
      speakerHeight +
      speakerGap +
      bodyHeight;

    this.background.setDisplaySize(width, height);

    let y = -height / 2 + this.options.paddingY;

    if (this.speakerText.visible) {
      this.speakerText.setPosition(0, y + speakerHeight / 2);
      y += speakerHeight + speakerGap;
    }

    this.bodyText.setPosition(0, y + bodyHeight / 2);
    y += bodyHeight;

    this.container.setPosition(
      viewportWidth / 2,
      viewportHeight - this.options.bottomMargin - height / 2,
    );
  }

  destroy() {
    if (this.destroyed) return;

    this.destroyed = true;
    this._advanceCallback = null;

    this.scene?.input?.off("pointerdown", this._handleAdvance);
    this.scene?.input?.keyboard?.off("keydown", this._handleKeyDown);
    this.scene?.scale?.off("resize", this._handleResize);

    this.container.destroy(true);
  }
}