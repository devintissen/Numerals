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
            .slice(0, HISTORY_MAX_ENTRIES)
            .map(entry => ({
                expression: entry.expression,
                result: entry.result,
                // Entries saved before timestamps existed have no `at`; they
                // are shown under "Earlier".
                at: Number.isFinite(entry.at) ? entry.at : null,
            }));
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

function createHistoryItem(entry) {
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
    return item;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(time) {
    const date = new Date(time);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
}

// "Today", "Yesterday", a weekday within the last week ("Mon, Nov 9"),
// then a plain date ("Nov 2"), with the year only when it isn't this year.
function dayLabel(dayStart, now) {
    // Math.round absorbs the 23/25-hour days around daylight-saving changes.
    const daysAgo = Math.round((startOfDay(now) - dayStart) / DAY_MS);
    if (daysAgo <= 0) return 'Today';
    if (daysAgo === 1) return 'Yesterday';

    const date = new Date(dayStart);
    if (daysAgo < 7) {
        return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    }
    const options = { month: 'short', day: 'numeric' };
    if (date.getFullYear() !== new Date(now).getFullYear()) options.year = 'numeric';
    return date.toLocaleDateString(undefined, options);
}

// Groups newest-first entries into days, keeping their order.
function groupByDay(entries, now) {
    const groups = [];
    entries.forEach(entry => {
        const key = entry.at === null ? 'earlier' : startOfDay(entry.at);
        let group = groups[groups.length - 1];
        if (!group || group.key !== key) {
            const label = key === 'earlier' ? 'Earlier' : dayLabel(key, now);
            group = { key, label, entries: [] };
            groups.push(group);
        }
        group.entries.push(entry);
    });
    return groups;
}

function renderPreview() {
    historyPreview.replaceChildren(
        ...calculationHistory.slice(0, HISTORY_PREVIEW_COUNT).map(createHistoryItem)
    );
    historyPreviewEmpty.hidden = calculationHistory.length > 0;
}

// The full page shows one section per day, each with its own heading.
function renderFullHistory() {
    const sections = groupByDay(calculationHistory, Date.now()).map(group => {
        const section = document.createElement('section');
        section.className = 'History_Day';

        const heading = document.createElement('h3');
        heading.className = 'History_Day_Heading';
        heading.textContent = group.label;

        const list = document.createElement('ul');
        list.className = 'History_List';
        list.append(...group.entries.map(createHistoryItem));

        section.append(heading, list);
        return section;
    });

    historyFull.replaceChildren(...sections);
    historyFullEmpty.hidden = calculationHistory.length > 0;
}

function renderHistory() {
    renderPreview();
    renderFullHistory();
    clearHistoryButton.hidden = calculationHistory.length === 0;
}

function addHistoryEntry(expression, result) {
    calculationHistory.unshift({ expression, result, at: Date.now() });
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
    if (open) {
        // Re-label on open, so "Today" moves to "Yesterday" after midnight.
        renderFullHistory();
        historyPage.scrollTop = 0;
    }
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
