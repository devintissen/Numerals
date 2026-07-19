const test = require('node:test');
const assert = require('node:assert/strict');

const { evaluateExpressionString, normalizePercent, sanitizeExpression } = require('../user_input.js');

test('parses basic arithmetic safely', () => {
  assert.equal(evaluateExpressionString('2+3*4'), 14);
  assert.equal(evaluateExpressionString('(10-4)/2'), 3);
});

test('normalizes percent expressions', () => {
  assert.equal(evaluateExpressionString(normalizePercent('50%+10')), 10.5);
});

test('sanitizes display symbols', () => {
  assert.equal(sanitizeExpression('1×2÷3−4'), '1*2/3-4');
});

test('rejects unexpected characters', () => {
  assert.throws(() => evaluateExpressionString('2;alert(1)'), /Invalid|Math/);
  assert.throws(() => evaluateExpressionString('2+constructor.constructor("return process")()'), /Invalid|Math/);
});
