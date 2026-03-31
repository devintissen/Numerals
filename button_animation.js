function addPressEffect(button) {
    button.addEventListener('mousedown', () => button.classList.add('pressed'));
    button.addEventListener('touchstart', () => button.classList.add('pressed'));

    button.addEventListener('mouseup', () => button.classList.remove('pressed'));
    button.addEventListener('mouseleave', () => button.classList.remove('pressed'));

    button.addEventListener('touchend', () => button.classList.remove('pressed'));
    button.addEventListener('touchcancel', () => button.classList.remove('pressed'));
}

// Select all elements with data-pressable attribute
const pressableButtons = document.querySelectorAll('[data-pressable]');

// Add the press effect to each button
pressableButtons.forEach(addPressEffect);