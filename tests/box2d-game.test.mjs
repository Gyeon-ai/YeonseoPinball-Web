import test from 'node:test';
import assert from 'node:assert/strict';
import { Box2dPhysics } from '../src/physics-box2d.ts';
import { Marble } from '../src/marble.ts';
import { stages } from '../src/data/maps.ts';
import { Skills } from '../src/data/constants.ts';
for(const [map,stage] of stages.entries())test(`Box2D map ${map}: actual marbles and skills reach goal`,async()=>{
  const savedFetch=globalThis.fetch,savedRandom=Math.random;globalThis.fetch=undefined;
  let seed=20260928+map;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const p=new Box2dPhysics();await p.init();globalThis.fetch=savedFetch;
  try {
    p.createStage(stage);const marbles=Array.from({length:30},(_,id)=>new Marble(p,id,30,`b${id}`,.1));
    p.start();marbles.forEach(m=>m.isActive=true);let finished=false;
    for(let step=0;step<12000&&!finished;step++){
      p.step(1/60);
      for(const m of marbles){m.update(1000/60);assert.ok([m.x,m.y,m.angle].every(Number.isFinite));if(m.skill===Skills.Impact)p.impact(m.id);if(m.y>stage.goalY)finished=true;}
    }
    assert.ok(finished,'no goal within 200 simulated seconds');
  } finally {p.dispose();globalThis.fetch=savedFetch;Math.random=savedRandom;}
});
