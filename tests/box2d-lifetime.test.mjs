import test from 'node:test';
import assert from 'node:assert/strict';
import { Box2dPhysics } from '../src/physics-box2d.ts';
import { stages } from '../src/data/maps.ts';
test('Box2D owned temporaries do not accumulate after skills or resets',async()=>{
  const previousFetch=globalThis.fetch;globalThis.fetch=undefined;
  const p=new Box2dPhysics();await p.init();globalThis.fetch=previousFetch;
  try {
    const ownTypes=['b2BodyDef','b2FixtureDef','b2PolygonShape','b2CircleShape','b2EdgeShape'];
    const cacheSize=type=>Object.keys(p.Box2D.getCache(p.Box2D[type])).length;
    const initial=Object.fromEntries(ownTypes.map(t=>[t,cacheSize(t)]));
    for(let round=0;round<5;round++){
      p.clearMarbles();p.clear();p.createStage(stages[round%4]);
      for(let id=0;id<500;id++)p.createMarble(id,10+id%10*.6,5-Math.floor(id/10));
      p.start();p.impact(0);p.step(1/60);
      for(const type of ownTypes)assert.equal(cacheSize(type),initial[type],`${type} leaked`);
      const vectors=cacheSize('b2Vec2');
      for(let n=0;n<100;n++){p.impact(n%500);p.shakeMarble(n%500);}
      assert.equal(cacheSize('b2Vec2'),vectors,'impact/shake allocated unreleased vectors');
    }
  } finally {p.dispose();p.dispose();globalThis.fetch=previousFetch;}
});
test('temporary pin deletion survives an immediate reset with reused marble IDs',async()=>{
  const previousFetch=globalThis.fetch;globalThis.fetch=undefined;
  const p=new Box2dPhysics();await p.init();globalThis.fetch=previousFetch;
  const stage={title:'pin',goalY:10,zoomY:9,entities:[{type:'static',position:{x:0,y:2},shape:{type:'circle',radius:.5},props:{density:1,restitution:0,angularVelocity:0,life:1}}]};
  try {
    p.createStage(stage);p.createMarble(0,0,1.3);p.start();p.step(1/60);
    assert.equal(p.getEntities().length,0);assert.equal(p.deleteCandidates.length,1);
    p.clearMarbles();p.clear();p.createStage(stage);p.createMarble(0,0,0);p.start();p.step(1/60);
    assert.equal(p.deleteCandidates.length,0);assert.equal(p.getEntities().length,1);
    assert.ok(p.getMarblePosition(0).y>0);
  } finally {p.dispose();globalThis.fetch=previousFetch;}
});
