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

const { appendValue, clearAll, toggleSign, evaluateExpression, getExpression } = require('../user_input.js');

function press(keys) {
  clearAll();
  for (const key of keys) {
    if (key === '±') toggleSign();
    else if (key === '=') evaluateExpression();
    else appendValue(key);
  }
  return getExpression();
}

test('ignores a second decimal point', () => {
  assert.equal(press(['.', '.', '5']), '0.5');
  assert.equal(press(['1', '.', '.', '2']), '1.2');
  assert.equal(press(['1', '+', '.', '.', '2']), '1+0.2');
});

test('sign toggle keeps the subtraction sign', () => {
  assert.equal(press(['5', '-', '3', '±']), '5--3');
  assert.equal(press(['5', '-', '3', '±', '=']), '8');
  assert.equal(press(['5', '-', '3', '±', '±']), '5-3');
  assert.equal(press(['5', '±']), '-5');
  assert.equal(press(['5', '*', '3', '±', '=']), '-15');
});

test('a number after a percent multiplies', () => {
  assert.equal(press(['9', '%', '5', '=']), '0.45');
  assert.equal(press(['5', '0', '%', '.', '5', '=']), '0.25');
});

const { MAX_EXPRESSION_LENGTH } = require('../user_input.js');

test('stops accepting input at the maximum expression length', () => {
  clearAll();
  for (let i = 0; i < MAX_EXPRESSION_LENGTH + 50; i += 1) {
    appendValue('1');
  }
  assert.equal(getExpression().length, MAX_EXPRESSION_LENGTH);
  clearAll();
  assert.equal(getExpression(), '0');
});

test('ignores values that are not calculator keys', () => {
  press(['1', '<img src=x>', '+', 'constructor', '2', '', '99']);
  assert.equal(getExpression(), '1+2');
});

function recordHistory(t) {
  const entries = [];
  global.window = { NumeralsHistory: { add: (expr, result) => entries.push([expr, result]) } };
  t.after(() => delete global.window);
  return entries;
}

test('records a calculation in history once', (t) => {
  const entries = recordHistory(t);
  press(['2', '+', '2', '=', '=', '=']);
  assert.deepEqual(entries, [['2+2', '4']]);
});

test('records percent and negative-number calculations in history', (t) => {
  const entries = recordHistory(t);
  press(['5', '0', '%', '=']);
  press(['5', '±', '+', '2', '=']);
  assert.deepEqual(entries, [['50%', '0.5'], ['−5+2', '−3']]);
});

test('does not record a lone number in history', (t) => {
  const entries = recordHistory(t);
  press(['=']);
  press(['5', '=']);
  press(['5', '±', '=']);
  press(['5', '+', '=']);
  assert.deepEqual(entries, []);
});

// Loads a fresh copy of the calculator against a minimal fake page and returns
// a function that sends it a keydown event.
function loadWithKeyboard(t, { sheetOpen }) {
  const listeners = {};
  global.document = {
    body: { addEventListener() {} },
    addEventListener: (type, listener) => { listeners[type] = listener; },
    getElementById: (id) => (id === 'sideMenu'
      ? { classList: { contains: (name) => name === 'open' && sheetOpen } }
      : null),
    querySelector: () => null,
    querySelectorAll: () => [],
  };
  t.after(() => delete global.document);

  const modulePath = require.resolve('../user_input.js');
  delete require.cache[modulePath];
  const calculator = require(modulePath);
  delete require.cache[modulePath];

  const sendKey = (key) => {
    const event = { key, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } };
    listeners.keydown(event);
    return event;
  };
  return { calculator, sendKey };
}

test('keyboard drives the calculator while the sheet is closed', (t) => {
  const { calculator, sendKey } = loadWithKeyboard(t, { sheetOpen: false });
  ['2', '+', '2'].forEach(sendKey);
  assert.equal(sendKey('Enter').defaultPrevented, true);
  assert.equal(calculator.getExpression(), '4');
});

test('keyboard leaves the calculator alone while the sheet is open', (t) => {
  const { calculator, sendKey } = loadWithKeyboard(t, { sheetOpen: true });
  calculator.appendValue('7');
  ['2', '+', 'Backspace', 'Escape', 'c'].forEach(sendKey);
  // Enter must not be cancelled, so it can activate the focused sheet button.
  assert.equal(sendKey('Enter').defaultPrevented, false);
  assert.equal(calculator.getExpression(), '7');
});
