const display = document.getElementById('display');
const history = document.getElementById('history');
const buttons = Array.from(document.querySelectorAll('button'));

let expression = '0';
let justEvaluated = false;

function updateDisplay() {
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
    history.textContent = '';
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
    history.textContent = '';
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

function evaluateExpression() {
    try {
    let raw = sanitizeExpression(expression);
    raw = normalizePercent(raw);

    if (/[^0-9+\-*/().\s]/.test(raw)) {
        throw new Error('Invalid characters');
    }

    if (/[*+/\-.]$/.test(raw)) {
        raw = raw.slice(0, -1);
    }

    if (!raw.trim()) return;

    const result = Function(`"use strict"; return (${raw})`)();

    if (!Number.isFinite(result)) {
        throw new Error('Math error');
    }

    const cleaned = Number(result.toFixed(10)).toString();
    history.textContent = `${formatForDisplay(expression)} =`;
    expression = cleaned;
    justEvaluated = true;
    updateDisplay();
    } catch {
    display.value = 'Error';
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

updateDisplay();