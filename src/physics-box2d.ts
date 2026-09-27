import Box2DFactory from 'box2d-wasm';
import type { StageDef } from './data/maps';
import type { IPhysics } from './IPhysics';
import type { MapEntity, MapEntityState } from './types/MapEntity.type';
import { interpolateAngle } from './utils/interpolateAngle';

let box2dInitialization: ReturnType<typeof Box2DFactory> | undefined;

export class Box2dPhysics implements IPhysics {
  private Box2D!: typeof Box2D & EmscriptenModule;
  private gravity!: Box2D.b2Vec2;
  private world!: Box2D.b2World;
  private scratch!: Box2D.b2Vec2;
  private disposed = false;

  private marbleMap: { [id: number]: Box2D.b2Body } = {};
  private entities: ({ body: Box2D.b2Body; previousAngle: number } & MapEntityState)[] = [];

  private deleteCandidates: Box2D.b2Body[] = [];

  async init(): Promise<void> {
    this.Box2D = await (box2dInitialization ??= Box2DFactory());
    this.gravity = new this.Box2D.b2Vec2(0, 10);
    this.world = new this.Box2D.b2World(this.gravity);
    this.scratch = new this.Box2D.b2Vec2(0, 0);
  }

  clear(): void {
    this.clearEntities();
  }

  clearMarbles(): void {
    Object.values(this.marbleMap).forEach((body) => {
      this.world.DestroyBody(body);
    });
    this.marbleMap = {};
  }

  createStage(stage: StageDef): void {
    this.createEntities(stage.entities);
  }

  createEntities(entities?: MapEntity[]) {
    if (!entities) return;

    const bodyTypes = {
      static: this.Box2D.b2_staticBody,
      kinematic: this.Box2D.b2_kinematicBody,
    } as const;

    entities.forEach((entity) => {
      const bodyDef = new this.Box2D.b2BodyDef();
      bodyDef.set_type(bodyTypes[entity.type]);
      const body = this.world.CreateBody(bodyDef);
      this.Box2D.destroy(bodyDef);

      const fixtureDef = new this.Box2D.b2FixtureDef();
      fixtureDef.set_density(entity.props.density);
      fixtureDef.set_restitution(entity.props.restitution);

      let shape;
      switch (entity.shape.type) {
        case 'box':
          shape = new this.Box2D.b2PolygonShape();
          this.scratch.Set(0, 0);
          shape.SetAsBox(entity.shape.width, entity.shape.height, this.scratch, entity.shape.rotation);
          fixtureDef.set_shape(shape);
          body.CreateFixture(fixtureDef);
          this.Box2D.destroy(shape);
          break;
        case 'polyline':
          for (let i = 0; i < entity.shape.points.length - 1; i++) {
            const p1 = entity.shape.points[i];
            const p2 = entity.shape.points[i + 1];
            const v1 = new this.Box2D.b2Vec2(p1[0], p1[1]);
            const v2 = new this.Box2D.b2Vec2(p2[0], p2[1]);
            const edge = new this.Box2D.b2EdgeShape();
            edge.SetTwoSided(v1, v2);
            body.CreateFixture(edge, 1);
            // Box2D copies the edge into the fixture; these are JS-owned temporaries.
            this.Box2D.destroy(edge);
            this.Box2D.destroy(v1);
            this.Box2D.destroy(v2);
          }
          break;
        case 'circle':
          shape = new this.Box2D.b2CircleShape();
          shape.set_m_radius(entity.shape.radius);
          fixtureDef.set_shape(shape);
          body.CreateFixture(fixtureDef);
          this.Box2D.destroy(shape);
          break;
      }
      this.Box2D.destroy(fixtureDef);

      body.SetAngularVelocity(entity.props.angularVelocity);
      this.scratch.Set(entity.position.x, entity.position.y);
      body.SetTransform(this.scratch, 0);
      this.entities.push({
        body,
        previousAngle: 0,
        x: entity.position.x,
        y: entity.position.y,
        angle: 0,
        shape: entity.shape,
        life: entity.props.life ?? -1,
      });
    });
  }

  clearEntities() {
    this.deleteCandidates.forEach((body) => this.world.DestroyBody(body));
    this.deleteCandidates = [];
    this.entities.forEach((entity) => {
      this.world.DestroyBody(entity.body);
    });
    this.entities = [];
  }

  createMarble(id: number, x: number, y: number): void {
    const circleShape = new this.Box2D.b2CircleShape();
    circleShape.set_m_radius(0.25);

    const bodyDef = new this.Box2D.b2BodyDef();
    bodyDef.set_type(this.Box2D.b2_dynamicBody);
    this.scratch.Set(x, y);
    bodyDef.set_position(this.scratch);

    const body = this.world.CreateBody(bodyDef);
    body.CreateFixture(circleShape, 1 + Math.random());
    this.Box2D.destroy(circleShape);
    this.Box2D.destroy(bodyDef);
    body.SetAwake(false);
    body.SetEnabled(false);
    this.marbleMap[id] = body;
  }

  shakeMarble(id: number): void {
    const body = this.marbleMap[id];
    if (body) {
      this.scratch.Set(Math.random() * 10 - 5, Math.random() * 10 - 5);
      body.ApplyLinearImpulseToCenter(this.scratch, true);
    }
  }

  removeMarble(id: number): void {
    const marble = this.marbleMap[id];
    if (marble) {
      this.world.DestroyBody(marble);
      delete this.marbleMap[id];
    }
  }

  getMarblePosition(id: number): { x: number; y: number; angle: number } {
    const marble = this.marbleMap[id];
    if (marble) {
      const pos = marble.GetPosition();
      return { x: pos.x, y: pos.y, angle: marble.GetAngle() };
    } else {
      return { x: 0, y: 0, angle: 0 };
    }
  }

  getEntities(interpolation: number = 1): MapEntityState[] {
    return this.entities.map((entity) => {
      return {
        ...entity,
        angle: interpolateAngle(entity.previousAngle, entity.body.GetAngle(), interpolation),
      };
    });
  }

  impact(id: number): void {
    const src = this.marbleMap[id];
    if (!src) return;
    const sourcePosition = src.GetPosition();

    Object.values(this.marbleMap).forEach((body) => {
      if (body === src) return;

      const position = body.GetPosition();
      const distVector = this.scratch;
      distVector.Set(position.x, position.y);
      distVector.op_sub(sourcePosition);
      const distSq = distVector.LengthSquared();

      if (distSq < 100) {
        distVector.Normalize();
        const power = 1 - distVector.Length() / 10;
        distVector.op_mul(power * power * 5);
        body.ApplyLinearImpulseToCenter(distVector, true);
      }
    });
  }

  start(): void {
    for (const key in this.marbleMap) {
      const marble = this.marbleMap[key];
      marble.SetAwake(true);
      marble.SetEnabled(true);
    }
  }

  step(deltaSeconds: number): void {
    if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) return;
    this.deleteCandidates.forEach((body) => {
      this.world.DestroyBody(body);
    });
    this.deleteCandidates = [];

    for (const entity of this.entities) entity.previousAngle = entity.body.GetAngle();
    this.world.Step(deltaSeconds, 6, 2);

    for (let i = this.entities.length - 1; i >= 0; i--) {
      const entity = this.entities[i];
      if (entity.life > 0) {
        const edge = entity.body.GetContactList();
        if (edge.contact?.IsTouching()) {
          this.deleteCandidates.push(entity.body);
          this.entities.splice(i, 1);
        }
      }
    }
  }

  dispose(): void {
    if (this.disposed) return;
    this.clearMarbles();
    this.clearEntities();
    this.Box2D.destroy(this.scratch);
    this.Box2D.destroy(this.world);
    this.Box2D.destroy(this.gravity);
    this.disposed = true;
  }
}
