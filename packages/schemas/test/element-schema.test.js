import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeElementValidator } from '../dist/validate.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const validate = makeElementValidator();

function loadExample(name) {
  const p = path.join(__dirname, '..', 'examples', name);
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

test('valid example should pass', () => {
  const ex = loadExample('simple-ui.json');
  const ok = validate(ex);
  assert.equal(ok, true, 'Example should validate');
});

// Negative test: missing meta

test('invalid example should fail', () => {
  const invalid = { elements: [] };
  const ok = validate(invalid);
  assert.equal(ok, false, 'Invalid specimen should fail');
});
