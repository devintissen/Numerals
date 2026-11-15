// Menu footer: "Numerals 1.1.1 · Updated Nov 12" plus an update status line.
//
// The status line stays hidden until something calls setUpdateStatus(). The
// updater isn't built yet, so for now only the version line is shown. When it
// is, it calls numeralsAbout.setUpdateStatus() and listens with
// numeralsAbout.onUpdateAction(). No markup is built from strings, so nothing
// passed in here can be turned into HTML.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// "Nov 12" this year, "Nov 12, 2025" for older releases.
function formatReleaseDate(date, now = new Date()) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
    const day = `${MONTHS[date.getMonth()]} ${date.getDate()}`;
    return date.getFullYear() === now.getFullYear() ? day : `${day}, ${date.getFullYear()}`;
}

// "just now", "5 min ago", "today", or a date for older checks.
function formatCheckedAt(date, now = new Date()) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
    const minutes = Math.floor((now - date) / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes} min ago`;
    if (date.toDateString() === now.toDateString()) return 'today';
    return formatReleaseDate(date, now);
}

// Only accept version strings like 1.2.0 or 1.2.0-beta.1 for display.
function cleanVersion(version) {
    return typeof version === 'string' && /^\d+\.\d+\.\d+(-[0-9A-Za-z.]+)?$/.test(version) ? version : '';
}

// What the status line shows for each state. `action` makes the text (or the
// part after the dot) a link that reports that action to onUpdateAction().
function describeStatus(state, details = {}) {
    const next = cleanVersion(details.version);
    switch (state) {
        case 'idle':
            return { text: 'Check for updates', action: 'check' };
        case 'checking':
            return { text: 'Checking for updates…' };
        case 'up-to-date': {
            const checked = formatCheckedAt(details.checkedAt);
            return { text: checked ? `Up to date · checked ${checked}` : 'Up to date' };
        }
        case 'downloading':
            return { text: next ? `Downloading ${next}…` : 'Downloading update…' };
        case 'ready':
            return { text: next ? `Restart to update to ${next}` : 'Restart to update', action: 'restart', strong: true };
        case 'error':
            return { text: 'Couldn’t check', linkText: 'Try again', action: 'retry' };
        case 'store':
            return { text: 'Updates via Microsoft Store', action: 'store' };
        default:
            return null;
    }
}

if (typeof document !== 'undefined') {
    const line = document.getElementById('aboutLine');
    const versionEl = document.getElementById('aboutVersion');
    const dateEl = document.getElementById('aboutDate');
    const statusEl = document.getElementById('aboutStatus');
    const actionListeners = [];

    function makeLink(text, action, strong) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = strong ? 'About_Link About_Link_Strong' : 'About_Link';
        button.textContent = text;
        button.addEventListener('click', () => {
            actionListeners.forEach((listener) => listener(action));
        });
        return button;
    }

    function setUpdateStatus(state, details) {
        const status = describeStatus(state, details);
        statusEl.replaceChildren();
        statusEl.hidden = !status;
        if (!status) return;

        if (status.action && status.linkText) {
            statusEl.append(`${status.text} · `, makeLink(status.linkText, status.action));
        } else if (status.action) {
            statusEl.append(makeLink(status.text, status.action, status.strong));
        } else {
            statusEl.append(status.text);
        }
    }

    function onUpdateAction(listener) {
        if (typeof listener === 'function') actionListeners.push(listener);
    }

    window.numeralsAbout = Object.freeze({ setUpdateStatus, onUpdateAction });

    if (window.numeralsApp && typeof window.numeralsApp.getInfo === 'function') {
        window.numeralsApp.getInfo().then((info) => {
            const version = cleanVersion(info && info.version);
            if (!version) return;
            versionEl.textContent = version;
            const released = typeof info.releaseDate === 'string' ? formatReleaseDate(new Date(info.releaseDate)) : '';
            dateEl.textContent = released ? ` · Updated ${released}` : '';
            line.hidden = false;
        }).catch(() => {
            // Leave the footer empty rather than showing a broken line.
        });
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { formatReleaseDate, formatCheckedAt, cleanVersion, describeStatus };
}
