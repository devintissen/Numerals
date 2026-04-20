const themeOptions = document.querySelectorAll('.Themes_Selector_Button:not([disabled])');

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

    console.log('Selected theme:', selectedTheme);
}

themeOptions.forEach(option => {
    option.setAttribute('aria-pressed', 'false');
    option.addEventListener('click', () => selectThemeButton(option));
});

if (themeOptions.length > 0) {
    selectThemeButton(themeOptions[0]);
}