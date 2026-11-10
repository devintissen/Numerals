// Keeps a list of past calculations. The menu sheet shows the latest few, and
// the History header opens a full history page that slides in from the right.

const HISTORY_STORAGE_KEY = 'calculationHistory';
const HISTORY_PREVIEW_COUNT = 3;
const HISTORY_MAX_ENTRIES = 100;
const CLEAR_CONFIRM_MS = 3000;

const historySheet = document.getElementById('sideMenu');
const historyPage = document.getElementById('historyPage');
const menuPage = document.getElementById('menuPage');
const historyPreview = document.getElementById('historyPreview');
const historyPreviewEmpty = document.getElementById('historyPreviewEmpty');
const historyFull = document.getElementById('historyFull');
const historyFullEmpty = document.getElementById('historyFullEmpty');
const openHistoryButton = document.getElementById('openHistory');
const closeHistoryButton = document.getElementById('closeHistory');
const clearHistoryButton = document.getElementById('clearHistory');

let calculationHistory = loadHistory();
let clearArmed = false;
let clearDisarmTimer = null;

function loadHistory() {
    try {
        const saved = JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY));
        if (!Array.isArray(saved)) return [];
        // Only keep well-formed entries, in case storage was edited by hand.
        return saved
            .filter(entry => entry && typeof entry.expression === 'string' && typeof entry.result === 'string')
            .slice(0, HISTORY_MAX_ENTRIES);
    } catch {
        return [];
    }
}

function saveHistory() {
    try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(calculationHistory));
    } catch {
        // Storage can be full or blocked; history still works for this session.
    }
}

const SVG_NS = 'http://www.w3.org/2000/svg';

// Placeholder icons drawn as inline SVG; swap for real artwork later.
const COPY_ICON = [
    ['rect', { x: 8, y: 8, width: 12, height: 12, rx: 2 }],
    ['path', { d: 'M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2' }],
];
const COPIED_ICON = [
    ['path', { d: 'M5 12.5l4.5 4.5L19 7.5' }],
];

function drawIcon(svg, shapes) {
    svg.replaceChildren();
    shapes.forEach(([tag, attributes]) => {
        const shape = document.createElementNS(SVG_NS, tag);
        Object.entries(attributes).forEach(([name, value]) => shape.setAttribute(name, value));
        svg.append(shape);
    });
}

// The whole row (calculation text + icon) is one button that copies the result.
function createCopyButton(displayResult, content) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'History_Copy';
    button.setAttribute('aria-label', `Copy result ${displayResult}`);
    button.title = 'Copy result';

    const indicator = document.createElement('span');
    indicator.className = 'History_Copy_Indicator';

    const icon = document.createElementNS(SVG_NS, 'svg');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('aria-hidden', 'true');
    icon.classList.add('History_Copy_Icon');
    drawIcon(icon, COPY_ICON);

    indicator.append(icon);
    button.append(content, indicator);

    let resetTimer = null;
    button.addEventListener('click', () => {
        // History stores the display form (with "−"); copy a plain number.
        const plainResult = displayResult.replace(/−/g, '-');
        if (window.numeralsClipboard) {
            window.numeralsClipboard.copyResult(plainResult);
        }

        // Briefly show a checkmark so the user knows it worked.
        drawIcon(icon, COPIED_ICON);
        button.classList.add('copied');
        clearTimeout(resetTimer);
        resetTimer = setTimeout(() => {
            drawIcon(icon, COPY_ICON);
            button.classList.remove('copied');
        }, 1200);
    });

    return button;
}

function fillList(list, emptyMessage, entries) {
    list.replaceChildren();

    entries.forEach(entry => {
        const item = document.createElement('li');
        item.className = 'History_Item';

        const text = document.createElement('div');
        text.className = 'History_Text';

        const expression = document.createElement('span');
        expression.className = 'History_Expression';
        expression.textContent = `${entry.expression} =`;

        const result = document.createElement('span');
        result.className = 'History_Result';
        result.textContent = entry.result;

        text.append(expression, result);
        item.append(createCopyButton(entry.result, text));
        list.append(item);
    });

    emptyMessage.hidden = calculationHistory.length > 0;
}

function renderHistory() {
    fillList(historyPreview, historyPreviewEmpty, calculationHistory.slice(0, HISTORY_PREVIEW_COUNT));
    fillList(historyFull, historyFullEmpty, calculationHistory);
    clearHistoryButton.hidden = calculationHistory.length === 0;
}

function addHistoryEntry(expression, result) {
    calculationHistory.unshift({ expression, result });
    if (calculationHistory.length > HISTORY_MAX_ENTRIES) {
        calculationHistory.length = HISTORY_MAX_ENTRIES;
    }
    saveHistory();
    renderHistory();
}

function clearHistory() {
    calculationHistory = [];
    saveHistory();
    renderHistory();
}

function disarmClear() {
    clearArmed = false;
    clearTimeout(clearDisarmTimer);
    clearHistoryButton.textContent = 'Clear';
    clearHistoryButton.classList.remove('armed');
}

// Clearing can't be undone, so the first click only asks for confirmation.
function onClearClick() {
    if (!clearArmed) {
        clearArmed = true;
        clearHistoryButton.textContent = 'Clear all?';
        clearHistoryButton.classList.add('armed');
        clearDisarmTimer = setTimeout(disarmClear, CLEAR_CONFIRM_MS);
        return;
    }

    disarmClear();
    clearHistory();
    // The Clear button is now hidden, so give keyboard focus somewhere to go.
    closeHistoryButton.focus();
}

function setHistoryPageOpen(open) {
    if (!open) disarmClear();
    historySheet.classList.toggle('show-history', open);
    // Keep the hidden page out of tab order and screen readers.
    historyPage.inert = !open;
    historyPage.setAttribute('aria-hidden', String(!open));
    menuPage.inert = open;
    menuPage.setAttribute('aria-hidden', String(open));
    if (open) historyPage.scrollTop = 0;
}

openHistoryButton.addEventListener('click', () => setHistoryPageOpen(true));
closeHistoryButton.addEventListener('click', () => setHistoryPageOpen(false));
clearHistoryButton.addEventListener('click', onClearClick);

// Return to the menu page once the sheet has finished closing, so it opens
// on the menu next time without the switch being visible.
historySheet.addEventListener('transitionend', (event) => {
    if (event.target === historySheet && event.propertyName === 'transform'
        && !historySheet.classList.contains('open')) {
        setHistoryPageOpen(false);
    }
});

window.NumeralsHistory = { add: addHistoryEntry };

renderHistory();
