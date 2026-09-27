import test from 'node:test';
import assert from 'node:assert/strict';
import { Box2dPhysics as Engine } from '../src/physics-box2d.ts';
import { Marble } from '../src/marble.ts';
import { Themes } from '../src/data/constants.ts';
import { RecordingContext } from './recording-context.mjs';

const withEngine = async fn => {
  const previousFetch=globalThis.fetch, previousRandom=Math.random;
  Math.random=()=>.5;
  if(Engine.name==='Box2dPhysics')globalThis.fetch=undefined;
  const p=new Engine();
  try {await p.init();globalThis.fetch=previousFetch;await fn(p);}
  finally {globalThis.fetch=previousFetch;Math.random=previousRandom;p.dispose();}
};
const depth=(m,e)=>{
  const a=e.angle+e.shape.rotation,co=Math.cos(a),s=Math.sin(a),dx=m.x-e.x,dy=m.y-e.y;
  const x=Math.abs(dx*co+dy*s)-e.shape.width,y=Math.abs(-dx*s+dy*co)-e.shape.height;
  return .25-Math.hypot(Math.max(x,0),Math.max(y,0))-Math.min(Math.max(x,y),0);
};
for(const omega of [-10,-5.5,2,5.5,10])for(const halfWidth of [2,8])test(`rotating contact: omega ${omega}, half width ${halfWidth}`,()=>withEngine(p=>{
  if(p.Box2D){const v=new p.Box2D.b2Vec2(0,0);p.world.SetGravity(v);p.Box2D.destroy(v);}
  else p.world.gravity={x:0,y:0};
  p.createStage({title:'regression',goalY:100,zoomY:99,entities:[{
    type:'kinematic',position:{x:0,y:0},shape:{type:'box',width:halfWidth,height:.1,rotation:0},
    props:{density:1,restitution:0,angularVelocity:omega},
  }]});
  p.createMarble(0,-Math.sign(omega)*halfWidth*.75,-.5);p.start();
  let worst=0;
  // Five fixed steps per rendered frame is 5x, not one enlarged physics timestep.
  for(let frame=0;frame<24;frame++)for(let sub=0;sub<5;sub++){
    const before=p.getEntities()[0].angle;p.step(1/60);const e=p.getEntities()[0];
    worst=Math.max(worst,depth(p.getMarblePosition(0),e));
    const middle=p.getEntities(.5)[0].angle;
    const expected=before+Math.atan2(Math.sin(e.angle-before),Math.cos(e.angle-before))/2;
    assert.ok(Math.abs(Math.sin(middle)-Math.sin(expected))<1e-5,'render interpolation lost the outer tick');
  }
  assert.ok(worst<.025,`deep isolated penetration ${worst} (marble diameter .5)`);
}));

test('3000 minimap marbles: same positions, colours and radii without matrix copies',()=>{
  const ctx=new RecordingContext();ctx.translate(10,10);ctx.scale(4,4);
  ctx.getTransform=ctx.setTransform=()=>assert.fail('minimap must not copy transforms per marble');
  const physics={createMarble(){}};
  for(let id=0;id<3000;id++){
    const m=new Marble(physics,id,3000,`b${id}`);
    m._previousPosition={x:id*.01,y:id*.02,angle:0};m._position={x:id*.01+1,y:id*.02+2,angle:1};
    m.render(ctx,1,false,true,undefined,{x:0,y:0,w:1,h:1,zoom:1},Themes.dark,.5);
    const draw=ctx.records.at(-1);
    assert.ok(Math.abs(draw.center.x-(10+(id*.01+.5)*4))<1e-10);
    assert.ok(Math.abs(draw.center.y-(10+(id*.02+1)*4))<1e-10);
    assert.equal(draw.radius,m.size*4);assert.equal(ctx.fillStyle,m.color);
  }
  assert.equal(ctx.records.length,3000);
  assert.deepEqual(ctx.matrix,[4,0,0,4,10,10]);
});
