import { Skills, STUCK_DELAY, Themes, UI_FONT_FAMILY } from './data/constants';
import type { IPhysics } from './IPhysics';
import options from './options';
import type { ColorTheme } from './types/ColorTheme';
import type { VectorLike } from './types/VectorLike';
import { transformGuard } from './utils/transformGuard';
import { rad } from './utils/utils';
import { Vector } from './utils/Vector';

export class Marble {
  type = 'marble' as const;
  name: string = '';
  size: number = 0.5;
  color: string = 'red';
  hue: number = 0;
  impact: number = 0;
  weight: number = 1;
  skill: Skills = Skills.None;
  isActive: boolean = false;

  private _skillRate = 0.0005;
  private _coolTime = 5000;
  private _maxCoolTime = 5000;
  private _stuckTime = 0;
  private lastPosition: VectorLike = { x: 0, y: 0 };
  private _previousPosition: { x: number; y: number; angle: number } = { x: 0, y: 0, angle: 0 };
  private _position: { x: number; y: number; angle: number } = { x: 0, y: 0, angle: 0 };
  private theme: ColorTheme = Themes.dark;

  private physics: IPhysics;

  id: number;

  get position() {
    return this._position;
  }

  get x() {
    return this.position.x;
  }

  set x(v: number) {
    this.position.x = v;
  }

  get y() {
    return this.position.y;
  }

  set y(v: number) {
    this.position.y = v;
  }

  get angle() {
    return this.position.angle;
  }

  constructor(physics: IPhysics, order: number, max: number, name?: string, weight: number = 1) {
    this.name = name || `M${order}`;
    this.weight = weight;
    this.physics = physics;

    this._maxCoolTime = 1000 + (1 - this.weight) * 4000;
    this._coolTime = this._maxCoolTime * Math.random();
    this._skillRate = 0.2 * this.weight;

    const maxLine = Math.ceil(max / 10);
    const line = Math.floor(order / 10);
    const lineDelta = -Math.max(0, Math.ceil(maxLine - 5));
    this.hue = (360 / max) * order;
    this.color = `hsl(${this.hue} 100% 70%)`;
    this.id = order;

    const startX = 10.25 + (order % 10) * 0.6;
    const startY = maxLine - line + lineDelta;
    this._position = { x: startX, y: startY, angle: 0 };
    this._previousPosition = { ...this._position };
    physics.createMarble(order, startX, startY);
  }

  update(deltaTime: number, timeScale: number = 1) {
    const position = this.physics.getMarblePosition(this.id);
    this._previousPosition = this._position;
    this._position = position;

    // 이동 거리는 물리 시간 배율에 비례하므로 제곱 거리 기준도 함께 보정한다.
    const stuckDistanceSq = 0.00001 * timeScale * timeScale;
    if (this.isActive && Vector.lenSq(Vector.sub(this.lastPosition, position)) < stuckDistanceSq) {
      this._stuckTime += deltaTime;

      if (this._stuckTime > STUCK_DELAY) {
        this.physics.shakeMarble(this.id);
        this._stuckTime = 0;
      }
    } else {
      this._stuckTime = 0;
    }
    this.lastPosition = { x: position.x, y: position.y };

    this.skill = Skills.None;
    if (this.impact) {
      this.impact = Math.max(0, this.impact - deltaTime);
    }
    if (!this.isActive) return;
    if (options.useSkills) {
      this._updateSkillInformation(deltaTime);
    }
  }

  private _updateSkillInformation(deltaTime: number) {
    if (this._coolTime > 0) {
      this._coolTime -= deltaTime;
    }

    if (this._coolTime <= 0) {
      this.skill = Math.random() < this._skillRate ? Skills.Impact : Skills.None;
      this._coolTime = this._maxCoolTime;
    }
  }

  render(
    ctx: CanvasRenderingContext2D,
    zoom: number,
    outline: boolean,
    isMinimap: boolean = false,
    skin: CanvasImageSource | undefined,
    viewPort: { x: number; y: number; w: number; h: number; zoom: number },
    theme: ColorTheme,
    interpolation: number = 1
  ) {
    this.theme = theme;
    const alpha = Math.max(0, Math.min(1, interpolation));
    const renderX = this._previousPosition.x + (this._position.x - this._previousPosition.x) * alpha;
    const renderY = this._previousPosition.y + (this._position.y - this._previousPosition.y) * alpha;
    const renderAngle = this._previousPosition.angle + (this._position.angle - this._previousPosition.angle) * alpha;
    const viewPortHw = viewPort.w / viewPort.zoom / 2;
    const viewPortHh = viewPort.h / viewPort.zoom / 2;
    const viewPortLeft = viewPort.x - viewPortHw;
    const viewPortRight = viewPort.x + viewPortHw;
    const viewPortTop = viewPort.y - viewPortHh - this.size / 2;
    const viewPortBottom = viewPort.y + viewPortHh;
    if (
      !isMinimap &&
      (renderX < viewPortLeft || renderX > viewPortRight || renderY < viewPortTop || renderY > viewPortBottom)
    ) {
      return;
    }
    const transform = ctx.getTransform();
    if (isMinimap) {
      this._renderMinimap(ctx, renderX, renderY);
    } else {
      this._renderNormal(ctx, zoom, outline, skin, renderX, renderY, renderAngle);
    }
    ctx.setTransform(transform);
  }

  private _renderMinimap(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.fillStyle = this.color;
    this._drawMarbleBody(ctx, true, x, y);
  }

  private _drawMarbleBody(ctx: CanvasRenderingContext2D, isMinimap: boolean, x: number, y: number) {
    ctx.beginPath();
    ctx.arc(x, y, isMinimap ? this.size : this.size / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  private _renderNormal(
    ctx: CanvasRenderingContext2D,
    zoom: number,
    outline: boolean,
    skin: CanvasImageSource | undefined,
    x: number,
    y: number,
    angle: number
  ) {
    const hs = this.size / 2;

    ctx.fillStyle = `hsl(${this.hue} 100% ${this.theme.marbleLightness + 25 * Math.min(1, this.impact / 500)}%`;

    // ctx.shadowColor = this.color;
    // ctx.shadowBlur = zoom / 2;
    if (skin) {
      transformGuard(ctx, () => {
        const imageSmoothingEnabled = ctx.imageSmoothingEnabled;
        const imageSmoothingQuality = ctx.imageSmoothingQuality;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.drawImage(skin, -hs, -hs, hs * 2, hs * 2);
        ctx.imageSmoothingEnabled = imageSmoothingEnabled;
        ctx.imageSmoothingQuality = imageSmoothingQuality;
      });
    } else {
      this._drawMarbleBody(ctx, false, x, y);
    }

    ctx.shadowColor = '';
    ctx.shadowBlur = 0;
    this._drawName(ctx, zoom, x, y);

    if (outline) {
      this._drawOutline(ctx, 2 / zoom, x, y);
    }

    if (options.useSkills) {
      this._renderCoolTime(ctx, zoom, x, y);
    }
  }

  private _drawName(ctx: CanvasRenderingContext2D, zoom: number, x: number, y: number) {
    transformGuard(ctx, () => {
      ctx.font = `450 12pt ${UI_FONT_FAMILY}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 1.25;
      ctx.fillStyle = this.color;
      ctx.shadowBlur = 0;
      ctx.translate(x, y + 0.25);
      ctx.scale(1 / zoom, 1 / zoom);
      ctx.strokeText(this.name, 0, 0);
      ctx.fillText(this.name, 0, 0);
    });
  }

  private _drawOutline(ctx: CanvasRenderingContext2D, lineWidth: number, x: number, y: number) {
    ctx.beginPath();
    ctx.strokeStyle = this.theme.marbleWinningBorder;
    ctx.lineWidth = lineWidth;
    ctx.arc(x, y, this.size / 2, 0, Math.PI * 2);
    ctx.stroke();
  }

  private _renderCoolTime(ctx: CanvasRenderingContext2D, zoom: number, x: number, y: number) {
    ctx.strokeStyle = this.theme.coolTimeIndicator;
    ctx.lineWidth = 1 / zoom;
    ctx.beginPath();
    ctx.arc(x, y, this.size / 2 + 2 / zoom, rad(270), rad(270 + (360 * this._coolTime) / this._maxCoolTime));
    ctx.stroke();
  }
}
