const themeOptions = document.querySelectorAll('.Themes_Selector_Button:not([disabled])');

// Mapping for image sources based on theme
const imageMappings = {
    'Menu.png': { light: 'Images/Menu.png', dark: 'Images/Menu White.png' },
    'Checkmark.png': { light: 'Images/Checkmark.png', dark: 'Images/Checkmark White.png' },
    'Postive_Negative.png': { light: 'Images/Postive_Negative.png', dark: 'Images/Positive Negative White.png' },
    'Divide.png': { light: 'Images/Divide.png', dark: 'Images/Divide White.png' },
    'Multiplication.png': { light: 'Images/Multiplication.png', dark: 'Images/Multiplication White.png' }
};

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

function selectThemeButton(button) {
    const currentSelected = document.querySelector('.Themes_Selector_Button.selected');

    if (currentSelected) {
        currentSelected.classList.remove('selected');
        currentSelected.setAttribute('aria-pressed', 'false');
    }

    button.classList.add('selected');
    button.setAttribute('aria-pressed', 'true');

    const selectedTheme = button.dataset.theme;
    document.body.setAttribute('data-theme', selectedTheme);

    // Update images based on the selected theme
    updateImagesForTheme(selectedTheme);

    // Save the selected theme to localStorage
    localStorage.setItem('selectedTheme', selectedTheme);
}

themeOptions.forEach(option => {
    option.setAttribute('aria-pressed', 'false');
    option.addEventListener('click', () => selectThemeButton(option));
});

// Initialize image data on load
initializeImageData();

// Load saved theme or default to first option
const savedTheme = localStorage.getItem('selectedTheme');
let initialButton = themeOptions[0]; // default

if (savedTheme) {
    const savedButton = Array.from(themeOptions).find(button => button.dataset.theme === savedTheme);
    if (savedButton) {
        initialButton = savedButton;
    }
}

if (themeOptions.length > 0) {
    selectThemeButton(initialButton);
}