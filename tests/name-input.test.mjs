import assert from 'node:assert/strict';
import test from 'node:test';
import { parseName } from '../src/utils/utils.ts';

test('slash stays as part of the name', () => {
  assert.deepEqual(parseName('이름/3'), { name: '이름/3', count: 1 });
  assert.deepEqual(parseName('이름/3*2'), { name: '이름/3', count: 2 });
});

test('the existing ball count suffix still works', () => {
  assert.deepEqual(parseName('  이름*3  '), { name: '이름', count: 3 });
  assert.equal(parseName(' *3 '), null);
});
