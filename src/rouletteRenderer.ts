import type { Camera } from './camera';
import { canvasHeight, canvasWidth, initialZoom, Themes, UI_FONT_FAMILY } from './data/constants';
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
    let marbleTransform: DOMMatrix | null = null;
    renderParameters.camera.renderScene(this.ctx, () => {
      this.onBeforeEntities();
      this.renderEntities(renderParameters.entities);
      this.renderEffects(renderParameters);
      marbleTransform = this.ctx.getTransform();
    });
    this.ctx.restore();
    this.onAfterScene();

    // Keep the map at scene resolution, but draw marbles and UI at display resolution.
    this._displayCtx.drawImage(this._sceneCanvas, 0, 0, this._canvas.width, this._canvas.height);
    const displayScale = this._canvas.width / this._sceneCanvas.width;
    if (marbleTransform) {
      const transform: DOMMatrix = marbleTransform;
      this._displayCtx.save();
      this._displayCtx.setTransform(
        transform.a * displayScale,
        transform.b * displayScale,
        transform.c * displayScale,
        transform.d * displayScale,
        transform.e * displayScale,
        transform.f * displayScale
      );
      this.renderMarbles(renderParameters, this._displayCtx);
      this._displayCtx.restore();
    }

    this._displayCtx.save();
    this._displayCtx.scale(displayScale, displayScale);
    uiObjects.forEach((obj) =>
      obj.render(this._displayCtx, renderParameters, this._sceneCanvas.width, this._sceneCanvas.height)
    );
    renderParameters.particleManager.render(this._displayCtx);
    this._displayCtx.restore();

    this.renderWinner(renderParameters, this._displayCtx, this._canvas.width, this._canvas.height);
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

  private renderMarbles({ marbles, camera, winnerRank, winners, size, interpolation }: RenderParameters, ctx: CanvasRenderingContext2D) {
    const winnerIndex = winnerRank - winners.length;

    const viewPort = { x: camera.x, y: camera.y, w: size.x, h: size.y, zoom: camera.zoom * initialZoom };
    marbles.forEach((marble, i) => {
      marble.render(
        ctx,
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
    height: number
  ) {
    if (!winner) return;
    const canvasRect = this._canvas.getBoundingClientRect();
    const timerRect = document.getElementById('resultTimerOverlay')?.getBoundingClientRect();
    if (!timerRect || canvasRect.width <= 0) return;

    const cssScale = width / canvasRect.width;
    const settingsRect = document.getElementById('settings')?.getBoundingClientRect();
    const settingsTop = settingsRect?.height ? settingsRect.top : canvasRect.bottom - 150;
    const roomBelowTimer = (settingsTop - timerRect.bottom - 30) / 156;
    const winnerScale = Math.max(1, Math.min(2, canvasRect.width / 960, roomBelowTimer));
    const panelWidth = Math.min(timerRect.width * winnerScale * cssScale, width - 32 * cssScale);
    const panelX = (timerRect.left + timerRect.width / 2 - canvasRect.left) * cssScale - panelWidth / 2;
    const panelY = (timerRect.bottom - canvasRect.top + 14) * cssScale;
    const panelHeight = Math.min(156 * winnerScale * cssScale, height - panelY - 16 * cssScale);
    if (panelHeight < 72 * cssScale) return;

    ctx.save();
    ctx.fillStyle = theme.winnerBackground;
    ctx.fillRect(panelX, panelY, panelWidth, panelHeight);

    // Keep enlarged pixel art crisp; smooth only when shrinking a source image.
    const marbleImage = this.getMarbleImage(winner.name);
    const marbleSize = Math.min(92 * winnerScale * cssScale, panelHeight * .54);
    const marbleCenterX = panelX + panelWidth - 18 * winnerScale * cssScale - marbleSize / 2;
    const nameCenterY = panelY + panelHeight * .7;
    const marbleCenterY = nameCenterY;

    if (marbleImage) {
      ctx.imageSmoothingEnabled = marbleImage.naturalWidth > marbleSize;
      ctx.imageSmoothingQuality = 'high';
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

    const textWidth = Math.max(1, panelWidth - marbleSize - 54 * winnerScale * cssScale);
    const textCenterX = panelX + 18 * winnerScale * cssScale + textWidth / 2;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = theme.winnerOutline;
    ctx.lineWidth = 3 * winnerScale * cssScale;
    ctx.font = `700 ${Math.min(42 * winnerScale * cssScale, panelHeight * .28)}px ${UI_FONT_FAMILY}`;
    ctx.fillStyle = theme.winnerText;
    if (theme.winnerOutline) {
      ctx.strokeText('당첨', textCenterX, panelY + panelHeight * .28);
    }
    ctx.fillText('당첨', textCenterX, panelY + panelHeight * .28);

    const characters = Array.from(winner.name);
    const maxNameSize = Math.min(58 * winnerScale * cssScale, panelHeight * .37);
    const nameBlockHeight = panelHeight * .46;
    let nameLines = [winner.name];
    let nameSize = 0;
    for (let lineCount = 1; lineCount <= Math.min(3, characters.length); lineCount++) {
      const lines = Array.from({ length: lineCount }, (_, index) =>
        characters.slice(Math.floor(index * characters.length / lineCount), Math.floor((index + 1) * characters.length / lineCount)).join('')
      );
      let candidateSize = Math.min(maxNameSize, nameBlockHeight / (lineCount * 1.08));
      ctx.font = `700 ${candidateSize}px ${UI_FONT_FAMILY}`;
      const widestLine = Math.max(...lines.map((line) => ctx.measureText(line).width));
      candidateSize *= Math.min(1, textWidth / Math.max(1, widestLine));
      if (candidateSize > nameSize) {
        nameLines = lines;
        nameSize = candidateSize;
      }
    }
    ctx.font = `700 ${nameSize}px ${UI_FONT_FAMILY}`;
    ctx.fillStyle = `hsl(${winner.hue} 100% ${theme.marbleLightness})`;
    const lineHeight = nameSize * 1.08;
    nameLines.forEach((line, index) => {
      const lineY = nameCenterY + (index - (nameLines.length - 1) / 2) * lineHeight;
      if (theme.winnerOutline) {
        ctx.strokeText(line, textCenterX, lineY);
      }
      ctx.fillText(line, textCenterX, lineY);
    });
    ctx.restore();
  }
}
