import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { Roulette } from '../src/roulette.ts';
import { FixedStepClock } from '../src/fixed-step-clock.ts';

test('reset clears old round state and rebuilds the map after clearing physics', () => {
  const calls = [];
  const game = Object.create(Roulette.prototype);
  Object.assign(game, {
    _clock: new FixedStepClock(), _isRunning: true, _timeScale: 0.2,
    _effects: [{}], _winner: {}, _winners: [{}], _marbles: [{}], _goalDist: 1,
    _stage: { entities: [] },
    physics: { clearMarbles() { calls.push('marbles'); }, clear() { calls.push('map'); }, createStage() { calls.push('rebuild'); } },
    _camera: { initializePosition() {} },
  });
  game._clock.advance(0, 5, () => {});
  game._clock.advance(25, 5, () => {});
  game.reset();
  assert.deepEqual(calls, ['marbles', 'map', 'rebuild']);
  assert.equal(game._isRunning, false);
  assert.equal(game._timeScale, 1);
  assert.equal(game._winner, null);
  for (const field of ['_effects', '_winners', '_marbles']) assert.deepEqual(game[field], []);
  assert.equal(game._goalDist, Infinity);
  assert.equal(game._clock.simulatedMs, 0);
  assert.equal(game._clock.interpolation, 0);
});

test('empty or duplicate starts do not activate physics or reset the current clock', () => {
  const game = Object.create(Roulette.prototype);
  let starts = 0;
  Object.assign(game, {
    _clock: new FixedStepClock(), _isRunning: false, _marbles: [],
    physics: { start() { starts++; } }, _camera: { startFollowingMarbles() {} },
  });
  game.start(); assert.equal(starts, 0);
  game._marbles = [{ isActive: false }];
  game.start(); assert.equal(starts, 1); assert.equal(game._marbles[0].isActive, true);
  game._clock.advance(0, 1, () => {}); game._clock.advance(20, 1, () => {});
  game.start(); assert.equal(starts, 1); assert.ok(game._clock.simulatedMs > 0);
});

test('renderer and obstacles receive the same interpolation value', () => {
  const game = Object.create(Roulette.prototype);
  let physicsAlpha, params;
  Object.assign(game, {
    _stage: {}, _clock: new FixedStepClock(), _uiObjects: [],
    physics: { getEntities(alpha) { physicsAlpha = alpha; return []; } },
    _renderer: { width: 1280, height: 720, render(value) { params = value; } },
  });
  game._clock.advance(0, 1, () => {}); game._clock.advance(25, 1, () => {});
  game._render();
  assert.ok(Math.abs(physicsAlpha - 0.5) < 1e-6);
  assert.equal(params.interpolation, physicsAlpha);
});

test('invalid speed cannot poison the simulation clock', () => {
  const game = Object.create(Roulette.prototype);
  for (const value of [0, -1, NaN, Infinity]) assert.throws(() => game.setSpeed(value));
  for (const value of [1, 2, 5]) { game.setSpeed(value); assert.equal(game.getSpeed(), value); }
});

test('actual start-button handler resets engine and speed buttons to 1x before starting', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const handler = html.match(/document\.querySelector\('#btnStart'\)\.addEventListener\('click', \(\) => \{([\s\S]*?)\n    \}\);/)[1];
  const speedFunction = html.match(/function setSpeed\(speed\) \{[\s\S]*?\n  \}/)[0];
  const calls = [];
  const buttons = [1, 2, 5].map(speed => ({ dataset: { speed: String(speed) }, active: speed === 5,
    classList: { toggle(_className, active) { buttons.find(b => b.dataset.speed === String(speed)).active = active; } } }));
  const context = {
    ready: true,
    window: { roulette: { setSpeed(speed) { calls.push(speed); }, start() { calls.push('start'); } } },
    document: { querySelectorAll() { return buttons; }, querySelector() { return { classList: { add() {} } }; } },
    resetResultTimer() { calls.push('timer-reset'); },
  };
  vm.runInNewContext(`${speedFunction}\n(() => {${handler}})()`, context);
  assert.deepEqual(calls, [1, 'timer-reset', 'start']);
  assert.deepEqual(buttons.map(b => b.active), [true, false, false]);
});
