import type { Camera } from './camera';
import { canvasHeight, canvasWidth, initialZoom, Themes, UI_FONT_FAMILY, winnerAreaHeight } from './data/constants';
import type { StageDef } from './data/maps';
import type { GameObject } from './gameObject';
import type { Marble } from './marble';
import type { ParticleManager } from './particleManager';
import type { ColorTheme } from './types/ColorTheme';
import type { MapEntityState } from './types/MapEntity.type';
import type { VectorLike } from './types/VectorLike';
import type { UIObject } from './UIObject';

export type RenderParameters = {
  camera: Camera;
  stage: StageDef;
  entities: MapEntityState[];
  marbles: Marble[];
  winners: Marble[];
  particleManager: ParticleManager;
  effects: GameObject[];
  winnerRank: number;
  winner: Marble | null;
  size: VectorLike;
  theme: ColorTheme;
  interpolation: number;
};

const MAX_DISPLAY_WIDTH = 1920;
const WINNER_TEXT_OFFSET = 30;
const PERSONACON_URLS = [
  new URL('../assets/personacons/01-month.png', import.meta.url),
  new URL('../assets/personacons/03-month.png', import.meta.url),
  new URL('../assets/personacons/06-month.png', import.meta.url),
  new URL('../assets/personacons/12-month.png', import.meta.url),
  new URL('../assets/personacons/24-month.png', import.meta.url),
  new URL('../assets/personacons/36-month.png', import.meta.url),
  new URL('../assets/personacons/48-month.png', import.meta.url),
];

export class RouletteRenderer {
  protected _canvas!: HTMLCanvasElement;
  protected _sceneCanvas!: HTMLCanvasElement;
  protected ctx!: CanvasRenderingContext2D;
  private _displayCtx!: CanvasRenderingContext2D;
  public sizeFactor = 1;

  protected _personaconImages: HTMLImageElement[] = [];
  private _personaconImageByName = new Map<string, HTMLImageElement>();
  protected _theme: ColorTheme = Themes.dark;
  get width() {
    return this._sceneCanvas.width;
  }

  get height() {
    return this._sceneCanvas.height;
  }

  get canvas() {
    return this._canvas;
  }

  set theme(value: ColorTheme) {
    this._theme = value;
  }

  async init() {
    await this._load();

    this._canvas = document.createElement('canvas');
    this._canvas.width = canvasWidth;
    this._canvas.height = canvasHeight;
    this._displayCtx = this._canvas.getContext('2d', {
      alpha: false,
    }) as CanvasRenderingContext2D;

    this._sceneCanvas = document.createElement('canvas');
    this._sceneCanvas.width = canvasWidth;
    this._sceneCanvas.height = canvasHeight;
    this.ctx = this._sceneCanvas.getContext('2d', {
      alpha: false,
    }) as CanvasRenderingContext2D;

    document.body.appendChild(this._canvas);

    const resizing = (entries?: ResizeObserverEntry[]) => {
      const realSize = entries ? entries[0].contentRect : this._canvas.getBoundingClientRect();
      if (realSize.width <= 0 || realSize.height <= 0) return;

      const width = Math.max(realSize.width / 2, 640);
      const height = (width / realSize.width) * realSize.height;
      this._sceneCanvas.width = width;
      this._sceneCanvas.height = height;
      this.sizeFactor = width / realSize.width;

      const displayWidth = Math.min(realSize.width, MAX_DISPLAY_WIDTH);
      this._canvas.width = displayWidth;
      this._canvas.height = (displayWidth / realSize.width) * realSize.height;
    };

    const resizeObserver = new ResizeObserver(resizing);

    resizeObserver.observe(this._canvas);
    resizing();
  }

  private async _loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((rs) => {
      const img = new Image();
      img.addEventListener('load', () => {
        rs(img);
      });
      img.src = url;
    });
  }

  private async _load(): Promise<void> {
    this._personaconImages = await Promise.all(PERSONACON_URLS.map((url) => this._loadImage(url.toString())));
  }

  private getMarbleImage(name: string): HTMLImageElement | undefined {
    if (this._personaconImages.length === 0) {
      return undefined;
    }

    const cached = this._personaconImageByName.get(name);
    if (cached) return cached;

    let hash = 0;
    for (const character of name) {
      hash = (Math.imul(hash, 31) + (character.codePointAt(0) ?? 0)) >>> 0;
    }
    const image = this._personaconImages[hash % this._personaconImages.length];
    this._personaconImageByName.set(name, image);
    return image;
  }

  protected onBeforeEntities(): void {}
  protected onAfterScene(): void {}

  render(renderParameters: RenderParameters, uiObjects: UIObject[]) {
    this._theme = renderParameters.theme;
    this.ctx.fillStyle = this._theme.background;
    this.ctx.fillRect(0, 0, this._sceneCanvas.width, this._sceneCanvas.height);

    this.ctx.save();
    this.ctx.scale(initialZoom, initialZoom);
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'top';
    this.ctx.font = `400 0.4pt ${UI_FONT_FAMILY}`;
    this.ctx.lineWidth = 3 / (renderParameters.camera.zoom + initialZoom);
    renderParameters.camera.renderScene(this.ctx, () => {
      this.onBeforeEntities();
      this.renderEntities(renderParameters.entities);
      this.renderEffects(renderParameters);
      this.renderMarbles(renderParameters);
    });
    this.ctx.restore();
    this.onAfterScene();

    uiObjects.forEach((obj) =>
      obj.render(this.ctx, renderParameters, this._sceneCanvas.width, this._sceneCanvas.height)
    );
    renderParameters.particleManager.render(this.ctx);

    this._displayCtx.drawImage(this._sceneCanvas, 0, 0, this._canvas.width, this._canvas.height);

    // 당첨 UI는 저해상도 장면 캔버스를 거쳐 두 번 확대하지 않고 출력 캔버스에 바로 그린다.
    const displayScale = this._canvas.width / this._sceneCanvas.width;
    this.renderWinner(renderParameters, this._displayCtx, this._canvas.width, this._canvas.height, displayScale);
  }

  private renderEntities(entities: MapEntityState[]) {
    this.ctx.save();
    entities.forEach((entity) => {
      const transform = this.ctx.getTransform();
      this.ctx.translate(entity.x, entity.y);
      this.ctx.rotate(entity.angle);
      const shape = entity.shape;
      const entityTheme = this._theme.entity[shape.type];
      this.ctx.fillStyle = entityTheme.fill;
      this.ctx.strokeStyle = entityTheme.outline;
      this.ctx.shadowBlur = entityTheme.bloomRadius;
      this.ctx.shadowColor = entityTheme.bloom;
      switch (shape.type) {
        case 'polyline':
          if (shape.points.length > 0) {
            this.ctx.beginPath();
            this.ctx.moveTo(shape.points[0][0], shape.points[0][1]);
            for (let i = 1; i < shape.points.length; i++) {
              this.ctx.lineTo(shape.points[i][0], shape.points[i][1]);
            }
            this.ctx.stroke();
          }
          break;
        case 'box': {
          const w = shape.width * 2;
          const h = shape.height * 2;
          this.ctx.rotate(shape.rotation);
          this.ctx.fillRect(-w / 2, -h / 2, w, h);
          break;
        }
        case 'circle':
          this.ctx.beginPath();
          this.ctx.arc(0, 0, shape.radius, 0, Math.PI * 2, false);
          this.ctx.stroke();
          break;
      }

      this.ctx.setTransform(transform);
    });
    this.ctx.restore();
  }

  private renderEffects({ effects, camera }: RenderParameters) {
    effects.forEach((effect) => effect.render(this.ctx, camera.zoom * initialZoom, this._theme));
  }

  private renderMarbles({ marbles, camera, winnerRank, winners, size, interpolation }: RenderParameters) {
    const winnerIndex = winnerRank - winners.length;

    const viewPort = { x: camera.x, y: camera.y, w: size.x, h: size.y, zoom: camera.zoom * initialZoom };
    marbles.forEach((marble, i) => {
      marble.render(
        this.ctx,
        camera.zoom * initialZoom,
        i === winnerIndex,
        false,
        this.getMarbleImage(marble.name),
        viewPort,
        this._theme,
        interpolation
      );
    });
  }

  private renderWinner(
    { winner, theme }: RenderParameters,
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    scale: number
  ) {
    if (!winner) return;
    ctx.save();
    ctx.fillStyle = theme.winnerBackground;
    const scaledWinnerAreaHeight = winnerAreaHeight * scale;
    ctx.fillRect(width / 2, height - scaledWinnerAreaHeight, width / 2, scaledWinnerAreaHeight);

    // 원본 픽셀을 정수 배율로 확대해 당첨 퍼스나콘이 흐려지지 않게 한다.
    const marbleImage = this.getMarbleImage(winner.name);
    const targetMarbleSize = 100 * scale;
    const marbleSize = marbleImage
      ? marbleImage.naturalWidth * Math.max(1, Math.round(targetMarbleSize / marbleImage.naturalWidth))
      : targetMarbleSize;
    const marbleCenterX = width - marbleSize / 2 - 20 * scale;
    const marbleCenterY = height - scaledWinnerAreaHeight / 2;

    if (marbleImage) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        marbleImage,
        marbleCenterX - marbleSize / 2,
        marbleCenterY - marbleSize / 2,
        marbleSize,
        marbleSize
      );
    } else {
      ctx.beginPath();
      ctx.arc(marbleCenterX, marbleCenterY, marbleSize / 2, 0, Math.PI * 2);
      ctx.fillStyle = `hsl(${winner.hue} 100% ${theme.marbleLightness})`;
      ctx.fill();
    }

    ctx.fillStyle = theme.winnerText;
    ctx.strokeStyle = theme.winnerOutline;

    ctx.font = `700 ${48 * scale}px ${UI_FONT_FAMILY}`;
    ctx.textAlign = 'right';
    ctx.lineWidth = 4 * scale;
    const textRightX = marbleCenterX - marbleSize / 2 - 20 * scale;
    if (theme.winnerOutline) {
      ctx.strokeText('Winner', textRightX, height - 120 * scale + WINNER_TEXT_OFFSET * scale);
    }

    ctx.fillText('Winner', textRightX, height - 120 * scale + WINNER_TEXT_OFFSET * scale);
    ctx.font = `700 ${72 * scale}px ${UI_FONT_FAMILY}`;
    ctx.fillStyle = `hsl(${winner.hue} 100% ${theme.marbleLightness})`;
    if (theme.winnerOutline) {
      ctx.strokeText(winner.name, textRightX, height - 55 * scale + WINNER_TEXT_OFFSET * scale);
    }
    ctx.fillText(winner.name, textRightX, height - 55 * scale + WINNER_TEXT_OFFSET * scale);
    ctx.restore();
  }
}

