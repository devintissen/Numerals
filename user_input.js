const display = typeof document !== 'undefined' ? document.getElementById('display') : null;
const history = typeof document !== 'undefined' ? document.getElementById('history') : null;
const buttons = typeof document !== 'undefined' ? Array.from(document.querySelectorAll('button')) : [];

let expression = '0';
let justEvaluated = false;

function updateDisplay() {
    if (!display) return;
    display.value = formatForDisplay(expression);
}

function formatForDisplay(expr) {
    return expr
    .replace(/\*/g, '×')
    .replace(/\//g, '÷')
    .replace(/-/g, '−');
}

function sanitizeExpression(expr) {
    return expr
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-');
}

function isOperator(char) {
    return ['+', '-', '*', '/', '%'].includes(char);
}

function getLastNumberSegment(expr) {
    const match = expr.match(/(-?\d*\.?\d+)$/);
    return match ? match[0] : '';
}

function appendValue(value) {
    if (justEvaluated && !isOperator(value)) {
    expression = '0';
    if (history) history.textContent = '';
    }
    justEvaluated = false;

    if (value === '.') {
    const lastSegment = getLastNumberSegment(expression);
    if (lastSegment.includes('.')) return;
    if (expression === '0' || isOperator(expression.slice(-1)) || expression.slice(-1) === '%') {
        expression += expression === '0' ? '.' : '0.';
        if (expression === '0.') expression = '0.';
        updateDisplay();
        return;
    }
    }

    if (isOperator(value)) {
    if (value === '%') {
        const lastChar = expression.slice(-1);
        if (expression === '0' || isOperator(lastChar) || lastChar === '.' || lastChar === '%') return;
        expression += '%';
        updateDisplay();
        return;
    }

    if (expression === '0' && value !== '-') {
        return;
    }

    const lastChar = expression.slice(-1);
    if (isOperator(lastChar)) {
        expression = expression.slice(0, -1) + value;
    } else if (lastChar === '.') {
        return;
    } else {
        expression += value;
    }
    updateDisplay();
    return;
    }

    if (expression === '0') {
    expression = value;
    } else {
    expression += value;
    }

    updateDisplay();
}

function clearAll() {
    expression = '0';
    if (history) history.textContent = '';
    justEvaluated = false;
    updateDisplay();
}

function deleteLast() {
    if (justEvaluated) {
    clearAll();
    return;
    }

    expression = expression.length > 1 ? expression.slice(0, -1) : '0';
    if (expression === '-' || expression === '') expression = '0';
    updateDisplay();
}

function toggleSign() {
    if (expression === '0') return;

    const match = expression.match(/(-?\d*\.?\d+)%?$/);
    if (!match) return;

    const target = match[0];
    const hasPercent = target.endsWith('%');
    const numberPart = hasPercent ? target.slice(0, -1) : target;

    let toggled;
    if (numberPart.startsWith('-')) {
    toggled = numberPart.slice(1);
    } else {
    toggled = '-' + numberPart;
    }

    expression = expression.slice(0, -target.length) + toggled + (hasPercent ? '%' : '');
    updateDisplay();
}

function normalizePercent(expr) {
    return expr.replace(/(\d*\.?\d+)%/g, '($1/100)');
}

function tokenizeExpression(expr) {
    const tokens = [];
    let index = 0;

    while (index < expr.length) {
    const char = expr[index];

    if (/\s/.test(char)) {
        index += 1;
        continue;
    }

    if (/\d/.test(char) || char === '.') {
        let numberText = '';
        let sawDot = false;

        while (index < expr.length) {
        const current = expr[index];
        if (/\d/.test(current)) {
            numberText += current;
            index += 1;
            continue;
        }
        if (current === '.' && !sawDot) {
            numberText += current;
            sawDot = true;
            index += 1;
            continue;
        }
        break;
        }

        if (!numberText || numberText === '.') {
        throw new Error('Invalid expression');
        }

        tokens.push({ type: 'number', value: Number(numberText) });
        continue;
    }

    if (char === '(' || char === ')') {
        tokens.push({ type: 'paren', value: char });
        index += 1;
        continue;
    }

    if (['+', '-', '*', '/'].includes(char)) {
        tokens.push({ type: 'operator', value: char });
        index += 1;
        continue;
    }

    throw new Error('Invalid expression');
    }

    return tokens;
}

function evaluateExpressionString(raw) {
    const tokens = tokenizeExpression(raw);
    let index = 0;

    function peek() {
    return tokens[index] || null;
    }

    function consume(expectedValue) {
    const token = peek();
    if (!token) {
        throw new Error('Invalid expression');
    }
    if (expectedValue && token.value !== expectedValue) {
        throw new Error('Invalid expression');
    }
    index += 1;
    return token;
    }

    function parseExpression() {
    let value = parseTerm();
    while (peek() && peek().type === 'operator' && ['+', '-'].includes(peek().value)) {
        const operator = consume().value;
        const rhs = parseTerm();
        value = operator === '+' ? value + rhs : value - rhs;
    }
    return value;
    }

    function parseTerm() {
    let value = parseFactor();
    while (peek() && peek().type === 'operator' && ['*', '/'].includes(peek().value)) {
        const operator = consume().value;
        const rhs = parseFactor();
        if (operator === '*') {
        value *= rhs;
        } else {
        if (rhs === 0) throw new Error('Math error');
        value /= rhs;
        }
    }
    return value;
    }

    function parseFactor() {
    const token = peek();
    if (!token) {
        throw new Error('Invalid expression');
    }

    if (token.type === 'operator' && (token.value === '+' || token.value === '-')) {
        const operator = consume().value;
        const value = parseFactor();
        return operator === '-' ? -value : value;
    }

    if (token.type === 'paren' && token.value === '(') {
        consume('(');
        const value = parseExpression();
        consume(')');
        return value;
    }

    if (token.type === 'number') {
        return consume().value;
    }

    throw new Error('Invalid expression');
    }

    const result = parseExpression();
    if (peek()) {
    throw new Error('Invalid expression');
    }

    return result;
}

function evaluateExpression() {
    try {
    let raw = sanitizeExpression(expression);
    raw = normalizePercent(raw);

    if (/[^0-9+\-*/().\s]/.test(raw)) {
        throw new Error('Invalid characters');
    }

    if (/[*+\/\-.]$/.test(raw)) {
        raw = raw.slice(0, -1);
    }

    if (!raw.trim()) return;

    const result = evaluateExpressionString(raw);

    if (!Number.isFinite(result)) {
        throw new Error('Math error');
    }

    const cleaned = Number(result.toFixed(10)).toString();
    if (history) history.textContent = `${formatForDisplay(expression)} =`;
    expression = cleaned;
    justEvaluated = true;
    updateDisplay();
    } catch {
    if (display) display.value = 'Error';
    expression = '0';
    justEvaluated = true;
    }
}

function pressVisual(button) {
    button.classList.add('pressed');
    setTimeout(() => button.classList.remove('pressed'), 100);
}

function findButtonByKey(key) {
    const keyMap = {
    Enter: '[data-action="equals"]',
    '=': '[data-action="equals"]',
    Escape: '[data-action="clear"]',
    Backspace: '[data-action="delete"]',
    '.': '[data-value="."]',
    '+': '[data-value="+"]',
    '-': '[data-value="-"]',
    '*': '[data-value="*"]',
    '/': '[data-value="/"]',
    '%': '[data-value="%"]',
    'c': '[data-action="clear"]',
    };

    if (/^[0-9]$/.test(key)) {
    return document.querySelector(`[data-value="${key}"]`);
    }

    const selector = keyMap[key];
    return selector ? document.querySelector(selector) : null;
}

if (typeof document !== 'undefined' && document.body) {
    document.body.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;

    const { value, action } = button.dataset;

    if (value) appendValue(value);
    if (action === 'clear') clearAll();
    if (action === 'delete') deleteLast();
    if (action === 'sign') toggleSign();
    if (action === 'equals') evaluateExpression();
    });

    document.addEventListener('keydown', (event) => {
    const key = event.key;
    const visualButton = findButtonByKey(key);
    if (visualButton) pressVisual(visualButton);

    if (/^[0-9]$/.test(key)) {
        appendValue(key);
        return;
    }

    if (['+', '-', '*', '/', '%', '.'].includes(key)) {
        appendValue(key);
        return;
    }

    if (key === 'Enter' || key === '=') {
        event.preventDefault();
        evaluateExpression();
        return;
    }

    if (key === 'Backspace') {
        event.preventDefault();
        deleteLast();
        return;
    }

    if (key === 'Escape') {
        clearAll();
    }

    if (key === 'c') {
        clearAll();
    }
    });
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { evaluateExpressionString, normalizePercent, sanitizeExpression };
}

if (typeof window !== 'undefined') {
    window.NumeralsSafeEvaluator = { evaluateExpressionString, normalizePercent, sanitizeExpression };
}

updateDisplay();