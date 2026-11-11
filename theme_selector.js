const themeOptions = document.querySelectorAll('.Themes_Selector_Button:not([disabled])');

// Follows the OS light/dark setting (Windows: Settings > Personalization >
// Colors > "Choose your app mode"; macOS: Appearance).
const systemDarkQuery = window.matchMedia('(prefers-color-scheme: dark)');

// Mapping for image sources based on theme
const imageMappings = {
    'Menu.png': { light: 'Images/Menu.png', dark: 'Images/Menu White.png' },
    'Checkmark.png': { light: 'Images/Checkmark.png', dark: 'Images/Checkmark White.png' },
    'Positive_Negative.png': { light: 'Images/Positive_Negative.png', dark: 'Images/Positive Negative White.png' },
    'Divide.png': { light: 'Images/Divide.png', dark: 'Images/Divide White.png' },
    'Multiplication.png': { light: 'Images/Multiplication.png', dark: 'Images/Multiplication White.png' }
};

// The option the user picked: 'light', 'dark' or 'system'.
let selectedThemeChoice = 'system';

function initializeImageData() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        if (!img.dataset.originalSrc) {
            img.dataset.originalSrc = img.src;
        }
    });
}

function updateImagesForTheme(theme) {
    // Get all img elements
    const images = document.querySelectorAll('img');

    images.forEach(img => {
        const originalSrc = img.dataset.originalSrc;
        const filename = originalSrc.split('/').pop();
        if (imageMappings[filename]) {
            img.src = imageMappings[filename][theme];
        }
    });
}

// Turns the user's choice into the theme actually drawn ('light' or 'dark').
function resolveTheme(choice) {
    if (choice === 'system') return systemDarkQuery.matches ? 'dark' : 'light';
    return choice;
}

function applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);

    // Update images based on the applied theme
    updateImagesForTheme(theme);

    // Match the native Windows minimize/close button colors to the theme
    if (window.windowControls) {
        window.windowControls.setTheme(theme);
    }
}

function selectThemeButton(button) {
    const currentSelected = document.querySelector('.Themes_Selector_Button.selected');

    if (currentSelected) {
        currentSelected.classList.remove('selected');
        currentSelected.setAttribute('aria-pressed', 'false');
    }

    button.classList.add('selected');
    button.setAttribute('aria-pressed', 'true');

    selectedThemeChoice = button.dataset.theme;
    applyTheme(resolveTheme(selectedThemeChoice));

    // Save the selected option (including 'system') to localStorage
    localStorage.setItem('selectedTheme', selectedThemeChoice);
}

themeOptions.forEach(option => {
    option.setAttribute('aria-pressed', 'false');
    option.addEventListener('click', () => selectThemeButton(option));
});

// When following the system, switch live as soon as the OS setting changes.
systemDarkQuery.addEventListener('change', () => {
    if (selectedThemeChoice === 'system') {
        applyTheme(resolveTheme('system'));
    }
});

// Initialize image data on load
initializeImageData();

// Load the saved option; new installs follow the system by default.
const savedTheme = localStorage.getItem('selectedTheme') || 'system';
const initialButton =
    Array.from(themeOptions).find(button => button.dataset.theme === savedTheme)
    || Array.from(themeOptions).find(button => button.dataset.theme === 'system')
    || themeOptions[0];

if (initialButton) {
    selectThemeButton(initialButton);
}
