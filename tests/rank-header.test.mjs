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

test('rank list shows the last 10 characters without an ellipsis', () => {
  const drawn = [];
  const ctx = {
    save() {},
    restore() {},
    beginPath() {},
    rect() {},
    clip() {},
    translate() {},
    rotate() {},
    strokeText() {},
    fillText(text) { drawn.push(text); },
    measureText(text) { return { width: text.length * 8 }; },
  };
  const exactName = '가'.repeat(10);
  const longName = '핀볼타요'.repeat(4);
  const winners = [
    { name: exactName, hue: 0 },
    { name: longName, hue: 0 },
    { name: longName, hue: 0 },
  ];
  const marbles = [{ name: longName, hue: 0 }];

  new RankRenderer().render(
    ctx,
    { winners, marbles, winnerRank: 2, theme: { marbleLightness: 65, rankStroke: '#000' } },
    640,
    360
  );

  const shortened = '타요핀볼타요핀볼타요';
  assert.ok(drawn.includes(`✔ ${exactName} #1`));
  assert.ok(drawn.includes(`✔ ${shortened} #2`));
  assert.ok(drawn.includes(`${shortened} #3`), 'winner keeps its full rank number');
  assert.ok(drawn.includes(`${shortened} #4`), 'remaining marble is shortened too');
  assert.ok(!drawn.some((text) => text.includes(longName) || text.includes('…')),
    'full long names and ellipses do not reach the canvas');
  assert.equal(winners[1].name, longName, 'result data remains unchanged');
  assert.equal(marbles[0].name, longName, 'remaining marble data remains unchanged');
});

test('an 11-character name loses only its first character', () => {
  const drawn = [];
  const ctx = {
    save() {}, restore() {}, beginPath() {}, rect() {}, clip() {}, translate() {}, rotate() {},
    strokeText() {},
    fillText(text) { drawn.push(text); },
    measureText(text) { return { width: text.length * 8 }; },
  };
  const longName = '앞' + '나'.repeat(10);
  new RankRenderer().render(
    ctx,
    {
      winners: [{ name: longName, hue: 0 }, { name: longName, hue: 0 }],
      marbles: [{ name: longName, hue: 0 }],
      winnerRank: 1,
      theme: { marbleLightness: 65, rankStroke: '#000' },
    },
    640,
    360
  );

  const rows = drawn.filter((text) => text.includes('#'));
  assert.equal(rows.length, 3);
  assert.deepEqual(rows, [
    `✔ ${'나'.repeat(10)} #1`,
    `${'나'.repeat(10)} #2`,
    `${'나'.repeat(10)} #3`,
  ]);
  assert.ok(rows.every((text) => !text.includes('앞') && !text.includes('…')));
});
