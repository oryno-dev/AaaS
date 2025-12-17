import test from 'node:test';
import assert from 'node:assert/strict';
import { makeFrameEvaluator } from '@realify/compiler/dist/index.js';

const elements = { elements: [{ id: 'a', type: 'shape', bbox: { x: 0, y: 0, width: 10, height: 10 } }], meta: { width: 100, height: 100 } };

test('easeOut changes interpolation curve', () => {
  const ir = { timeline: 10, tracks: [ { kind: 'element', targetId: 'a', keyframes: [ { frame: 0, x: 0 }, { frame: 10, x: 10, easing: 'easeOut' } ] } ] };
  const evalFrame = makeFrameEvaluator(ir, elements);
  const mid = evalFrame(5).elements['a'].x;
  assert.ok(mid > 5, 'easeOut should yield value > linear mid');
});
