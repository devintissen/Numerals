const themeOptions = document.querySelectorAll('.theme-option:not(.disabled)');

themeOptions.forEach(option => {
    option.addEventListener('click', () => {
    const currentSelected = document.querySelector('.theme-option.selected');
    if (currentSelected) {
        currentSelected.classList.remove('selected');
    }

    option.classList.add('selected');

    const selectedTheme = option.dataset.theme;
    console.log('Selected theme:', selectedTheme);

    // Example for later:
    // document.body.setAttribute('data-theme', selectedTheme);
    });
});