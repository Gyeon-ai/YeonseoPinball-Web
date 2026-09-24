import { initialZoom, YEONSEO_BORDER_COLORS } from './data/constants';
import type { RenderParameters } from './rouletteRenderer';
import type { ColorTheme } from './types/ColorTheme';
import type { MapEntityState } from './types/MapEntity.type';
import type { Rect } from './types/rect.type';
import type { VectorLike } from './types/VectorLike';
import type { UIObject } from './UIObject';
import { bound } from './utils/bound.decorator';

const MINIMAP_SCALE = 4;
const MINIMAP_ENTITY_STROKE_WIDTH = 0.38;

export class Minimap implements UIObject {
  private ctx!: CanvasRenderingContext2D;
  private lastParams: RenderParameters | null = null;

  private _onViewportChangeHandler: ((pos?: VectorLike) => void) | null = null;
  private boundingBox: Rect;
  private mousePosition: { x: number; y: number } | null = null;

  constructor() {
    this.boundingBox = {
      x: 10,
      y: 10,
      w: 26 * MINIMAP_SCALE,
      h: 0,
    };
  }

  getBoundingBox(): Rect | null {
    return this.boundingBox;
  }

  onViewportChange(callback: (pos?: VectorLike) => void) {
    this._onViewportChangeHandler = callback;
  }

  update(): void {
    // nothing to do
  }

  @bound
  onMouseMove(e?: { x: number; y: number }) {
    if (!e) {
      this.mousePosition = null;
      if (this._onViewportChangeHandler) {
        this._onViewportChangeHandler();
      }
      return;
    }
    if (!this.lastParams) return;
    this.mousePosition = {
      x: e.x,
      y: e.y,
    };
    if (this._onViewportChangeHandler) {
      this._onViewportChangeHandler({
        x: this.mousePosition.x / MINIMAP_SCALE,
        y: this.mousePosition.y / MINIMAP_SCALE,
      });
    }
  }

  render(ctx: CanvasRenderingContext2D, params: RenderParameters) {
    if (!ctx) return;
    const { stage } = params;
    if (!stage) return;
    this.boundingBox.h = stage.goalY * MINIMAP_SCALE;

    this.lastParams = params;

    this.ctx = ctx;
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.fillStyle = params.theme.minimapBackground;
    ctx.translate(10, 10);
    ctx.scale(MINIMAP_SCALE, MINIMAP_SCALE);
    ctx.fillRect(0, 0, 26, stage.goalY);

    // 카메라 줌과 무관한 고정 픽셀 두께로 그려 사선이 끊기거나 계단처럼 보이지 않게 한다.
    this.ctx.lineWidth = MINIMAP_ENTITY_STROKE_WIDTH;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.drawEntities(params.entities, params.theme);
    this.drawMarbles(params);
    this.drawViewport(params);

    ctx.restore();
    ctx.save();
    ctx.strokeStyle = this.createHairGradient(
      ctx,
      this.boundingBox.x,
      this.boundingBox.y,
      this.boundingBox.x + this.boundingBox.w,
      this.boundingBox.y + this.boundingBox.h
    );
    ctx.lineWidth = 1.5;
    ctx.strokeRect(this.boundingBox.x, this.boundingBox.y, this.boundingBox.w, this.boundingBox.h);
    ctx.restore();
  }

  private createHairGradient(
    ctx: CanvasRenderingContext2D,
    x0: number,
    y0: number,
    x1: number,
    y1: number
  ): CanvasGradient {
    const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
    YEONSEO_BORDER_COLORS.forEach((color, index) => {
      gradient.addColorStop(index / (YEONSEO_BORDER_COLORS.length - 1), color);
    });
    return gradient;
  }

  private drawViewport(params: RenderParameters) {
    this.ctx.save();
    const { camera, size } = params;
    const zoom = camera.zoom * initialZoom;
    const w = size.x / zoom;
    const h = size.y / zoom;
    const left = camera.x - w / 2;
    const top = camera.y - h / 2;
    this.ctx.strokeStyle = this.createHairGradient(this.ctx, left, top, left + w, top + h);
    this.ctx.lineWidth = 1 / zoom;
    this.ctx.strokeRect(left, top, w, h);
    this.ctx.restore();
  }

  private drawEntities(entities: MapEntityState[], theme: ColorTheme) {
    this.ctx.save();
    entities.forEach((entity) => {
      this.ctx.save();
      this.ctx.fillStyle = theme.entity[entity.shape.type].fill;
      this.ctx.strokeStyle = theme.entity[entity.shape.type].outline;
      this.ctx.translate(entity.x, entity.y);
      this.ctx.rotate(entity.angle);

      this.ctx.save();
      const shape = entity.shape;
      switch (shape.type) {
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
      }
      this.ctx.restore();
      this.ctx.restore();
    });
    this.ctx.restore();
  }

  private drawMarbles(params: RenderParameters) {
    const { marbles } = params;
    const viewPort = {
      x: params.camera.x,
      y: params.camera.y,
      w: params.size.x,
      h: params.size.y,
      zoom: params.camera.zoom * initialZoom,
    };
    marbles.forEach((marble) => {
      marble.render(this.ctx, 1, false, true, undefined, viewPort, params.theme, params.interpolation);
    });
  }
}

