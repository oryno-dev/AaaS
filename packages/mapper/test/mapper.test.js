import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { svgToElementSchema } from '../dist/index.js';
import { makeElementValidator } from '@realify/schemas/dist/validate.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sampleSvg = fs.readFileSync(path.join(__dirname, 'samples', 'sample.svg'), 'utf8');
const validate = makeElementValidator();

test('mapper produces valid Element Schema', () => {
  const out = svgToElementSchema(sampleSvg, { source: 'sample.svg' });
  assert.equal(validate(out), true, JSON.stringify(validate.errors));
  assert.ok(out.elements.length >= 1);
});
