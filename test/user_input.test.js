const test = require('node:test');
const assert = require('node:assert/strict');

const { evaluateExpressionString, normalizePercent, sanitizeExpression } = require('../user_input.js');

test('parses basic arithmetic safely', () => {
  assert.equal(evaluateExpressionString('2+3*4'), 14);
  assert.equal(evaluateExpressionString('(10-4)/2'), 3);
  assert.equal(evaluateExpressionString('-2.5+3*2'), 3.5);
  assert.equal(evaluateExpressionString('-(2+3)*4'), -20);
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

test('rejects malformed expressions', () => {
  assert.throws(() => evaluateExpressionString('1+'), /Invalid/);
  assert.throws(() => evaluateExpressionString('(1+2'), /Invalid/);
  assert.throws(() => evaluateExpressionString('1..2'), /Invalid/);
});

test('reports division by zero to the caller', () => {
  assert.throws(() => evaluateExpressionString('10/0'), /Math error/);
});
