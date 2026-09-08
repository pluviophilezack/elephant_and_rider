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
      paddingY: options.paddingY ?? 20,
      speakerLeftMargin: options.speakerLeftMargin ?? 16,
      speakerPaddingX: options.speakerPaddingX ?? 16,
      speakerPaddingY: options.speakerPaddingY ?? 6,
      roughness: options.roughness ?? 2.5, // 手繪波浪起伏程度
    };

    this.container = scene.add
      .container(0, 0)
      .setScrollFactor(0)
      .setDepth(1000);

    // 使用 Graphics 物件繪製手繪風格多邊形
    this.background = scene.add.graphics();
    this.speakerBg = scene.add.graphics();

    const speakerStyle = {
      ...TextStyles.fontSetting,
      align: "left",
      fontSize: "18px",
      color: "#5C5A93",
    };

    this.speakerText = scene.add
      .text(0, 0, "", speakerStyle)
      .setOrigin(0, 0.5);

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
      this.speakerBg,
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

    const hasSpeaker = Boolean(speaker.trim());
    this.speakerText.setText(speaker);
    this.speakerText.setVisible(hasSpeaker);
    this.speakerBg.setVisible(hasSpeaker);
    this.bodyText.setText(this._insertLineBreaks(text));

    this._layout();
  }

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

  /**
   * 繪製不規則手繪風外框（含填充與手繪感描邊）
   */
  _drawHandDrawnRect(graphics, x, y, width, height, seed = 0) {
    graphics.clear();

    const roughness = this.options.roughness;
    const segmentLength = 16; // 邊界分割長度，越小越細緻
    const points = [];

    // 計算四條邊的分割數
    const cols = Math.max(2, Math.ceil(width / segmentLength));
    const rows = Math.max(2, Math.ceil(height / segmentLength));

    // 確定性偽隨機函數（避免每幀重繪時閃爍）
    const getJitter = (i, offsetKey) => {
      const val = Math.sin(i * 12.9898 + offsetKey * 78.233 + seed) * 43758.5453;
      return (val - Math.floor(val) - 0.5) * 2 * roughness;
    };

    // 上邊 (左 -> 右)
    for (let i = 0; i <= cols; i++) {
      const px = x + (i / cols) * width;
      const py = y + (i === 0 || i === cols ? 0 : getJitter(i, 1));
      points.push({ x: px, y: py });
    }

    // 右邊 (上 -> 下)
    for (let i = 1; i <= rows; i++) {
      const px = x + width + (i === rows ? 0 : getJitter(i, 2));
      const py = y + (i / rows) * height;
      points.push({ x: px, y: py });
    }

    // 下邊 (右 -> 左)
    for (let i = 1; i <= cols; i++) {
      const px = x + width - (i / cols) * width;
      const py = y + height + (i === cols ? 0 : getJitter(i, 3));
      points.push({ x: px, y: py });
    }

    // 左邊 (下 -> 上)
    for (let i = 1; i < rows; i++) {
      const px = x + getJitter(i, 4);
      const py = y + height - (i / rows) * height;
      points.push({ x: px, y: py });
    }

    // 填充白色背景
    graphics.fillStyle(0xffffff, 1);
    graphics.beginPath();
    graphics.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      graphics.lineTo(points[i].x, points[i].y);
    }
    graphics.closePath();
    graphics.fillPath();

    // 繪製手繪筆觸外框
    graphics.lineStyle(2, 0xffffff, 0.85);
    graphics.beginPath();
    graphics.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      graphics.lineTo(points[i].x, points[i].y);
    }
    graphics.closePath();
    graphics.strokePath();
  }

  _layout() {
    if (this.destroyed) return;

    const viewportWidth = this.scene.scale.width;
    const viewportHeight = this.scene.scale.height;
    const width = Math.min(this.options.maxWidth, viewportWidth - 48);
    const contentWidth = width - this.options.paddingX * 2;

    this.bodyText.setWordWrapWidth(contentWidth);
    this.bodyText.setAlign("center");

    const bodyHeight = this.bodyText.height;
    const height = this.options.paddingY * 2 + bodyHeight;

    // 繪製主對話框 (以中心原點 (0,0) 為基準計算左上角)
    const mainLeft = -width / 2;
    const mainTop = -height / 2;
    this._drawHandDrawnRect(this.background, mainLeft, mainTop, width, height, 101);

    this.bodyText.setPosition(0, 0);

    // 繪製說話者標籤框 (speaker div)
    if (this.speakerText.visible) {
      const spPadX = this.options.speakerPaddingX;
      const spPadY = this.options.speakerPaddingY;

      const spWidth = this.speakerText.width + spPadX * 2;
      const spHeight = this.speakerText.height + spPadY * 2;

      const speakerLeft = mainLeft + this.options.speakerLeftMargin;
      const speakerTop = mainTop - spHeight;

      this._drawHandDrawnRect(this.speakerBg, speakerLeft, speakerTop, spWidth, spHeight, 202);

      this.speakerText.setPosition(
        speakerLeft + spPadX,
        speakerTop + spHeight / 2
      );
    }

    this.container.setPosition(
      viewportWidth / 2,
      viewportHeight - this.options.bottomMargin - height / 2
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