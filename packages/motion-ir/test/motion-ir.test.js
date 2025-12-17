import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateMotionIR } from '../dist/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const elements = JSON.parse(fs.readFileSync(path.join(__dirname, '../../schemas/examples/simple-ui.json'), 'utf8'));

function loadFixture(name) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', name), 'utf8'));
}

test('valid motion passes validator', () => {
  const ir = loadFixture('motion-valid.json');
  const res = validateMotionIR(ir, elements, { maxZoom: 4 });
  assert.equal(res.ok, true, JSON.stringify(res.issues));
});

test('rejects missing element in element track', () => {
  const ir = loadFixture('motion-valid.json');
  ir.tracks[0].targetId = 'missing';
  const res = validateMotionIR(ir, elements);
  assert.equal(res.ok, false);
});

test('rejects camera out of bounds', () => {
  const ir = loadFixture('motion-valid.json');
  ir.tracks[1].keyframes[1].x = elements.meta.width + 10;
  const res = validateMotionIR(ir, elements);
  assert.equal(res.ok, false);
});
