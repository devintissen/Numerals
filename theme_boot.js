// Loaded as the very first thing inside <body>, before any content is parsed,
// so the saved theme is in place for the first frame. Without this, a dark-mode
// user would briefly see the light theme while the rest of the page loads.
// theme_selector.js takes over once the page has loaded.
(function () {
    let choice = 'system';
    try {
        choice = localStorage.getItem('selectedTheme') || 'system';
    } catch {
        // Storage unavailable: fall back to following the system.
    }

    const isDark =
        choice === 'dark' ||
        (choice !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');

    // Turn off CSS transitions until the first frame is drawn, so colors don't
    // fade in from the light theme. theme_selector.js removes this class.
    document.body.classList.add('Theme_Loading');
})();
