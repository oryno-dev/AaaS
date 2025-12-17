import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanAndStabilizeSvg } from '../dist/index.js';
const raw = `<svg viewBox="0 0 100 100"><rect x="10" y="10" width="20" height="20"/><animate attributeName="x" to="50"/></svg>`;
test('removes animation and adds stable ids', () => {
    const out = cleanAndStabilizeSvg(raw);
    assert.ok(!/\banimate\b/.test(out), 'animation tags removed');
    assert.ok(/id=/.test(out), 'id added');
});
