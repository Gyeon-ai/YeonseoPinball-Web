import assert from 'node:assert/strict';
import test from 'node:test';
import { RouletteRenderer } from '../src/rouletteRenderer.ts';
import { Themes, initialZoom } from '../src/data/constants.ts';
import { stages } from '../src/data/maps.ts';
import { RecordingContext } from './recording-context.mjs';

test('all map boxes retain Yeonseo colour and restore a matching outline', () => {
  for (const zoom of [1, 4]) {
    for (const stage of stages) {
      const ctx = new RecordingContext();
      const fills = [];
      const outlines = [];
      ctx.fillRect = function (...rect) {
        fills.push({ rect, colour: this.fillStyle, matrix: this.getTransform() });
      };
      ctx.strokeRect = function (...rect) {
        outlines.push({ rect, colour: this.strokeStyle, matrix: this.getTransform() });
      };
      ctx.scale(initialZoom * zoom, initialZoom * zoom);
      ctx.lineWidth = 3 / (zoom + initialZoom);
      const renderer = new RouletteRenderer();
      renderer.ctx = ctx;
      renderer.theme = Themes.dark;
      const boxes = stage.entities.filter(entity => entity.shape.type === 'box');
      renderer.renderEntities(boxes.map(entity => ({
        x: entity.position.x, y: entity.position.y,
        angle: 0.37, shape: entity.shape, life: -1,
      })));
      assert.equal(fills.length, boxes.length);
      assert.deepEqual(outlines, fills, 'outline matches the fill colour, geometry and rotation');
      assert.ok(outlines.every(outline => outline.colour === '#f0c9db'));
    }
  }
});
