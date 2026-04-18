function addPressEffect_opacity(button_opacity) {
    button_opacity.addEventListener('mousedown', () => button_opacity.classList.add('pressed'));
    button_opacity.addEventListener('touchstart', () => button_opacity.classList.add('pressed'));

    button_opacity.addEventListener('mouseup', () => button_opacity.classList.remove('pressed'));
    button_opacity.addEventListener('mouseleave', () => button_opacity.classList.remove('pressed'));

    button_opacity.addEventListener('touchend', () => button_opacity.classList.remove('pressed'));
    button_opacity.addEventListener('touchcancel', () => button_opacity.classList.remove('pressed'));
}

// Select all elements with data-pressable attribute
const pressableButtons_opacity = document.querySelectorAll('[data-pressable_opacity]');

// Add the press effect to each button
pressableButtons_opacity.forEach(addPressEffect_opacity);