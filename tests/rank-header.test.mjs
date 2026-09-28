import assert from 'node:assert/strict';
import test from 'node:test';
import { RankRenderer } from '../src/rankRenderer.ts';

test('the ball count stays above the clipped rank list with 363 balls', () => {
  const calls = [];
  let clipRect;
  const ctx = {
    save() {},
    restore() {},
    beginPath() {},
    rect(...args) { clipRect = args; },
    clip() {},
    translate() {},
    strokeText() {},
    fillText(text, x, y) { calls.push({ text, x, y }); },
    measureText(text) { return { width: text.length * 8 }; },
  };
  const winners = Array.from({ length: 363 }, (_, index) => ({
    name: `참가자${index + 1}`,
    hue: 0,
  }));

  new RankRenderer().render(
    ctx,
    { winners, marbles: [], winnerRank: 362, theme: { marbleLightness: 65, rankStroke: '#000' } },
    640,
    360
  );

  const count = calls.find((call) => call.text === '363 / 363');
  assert.ok(count, 'the count is rendered');
  assert.equal(count.y, 2);
  assert.equal(clipRect[1], 26);
  assert.ok(clipRect[1] >= count.y + 16, 'rank clipping begins below the count');
  assert.equal(clipRect[3], 360 - clipRect[1]);
});
