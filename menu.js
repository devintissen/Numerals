        const openMenu = document.getElementById("openMenu");
        const closeMenu = document.getElementById("closeMenu");
        const sideMenu = document.getElementById("sideMenu");
        const overlay = document.getElementById("overlay");

        function openSideMenu() {
        sideMenu.classList.add("open");
        overlay.classList.add("active");
        }

        function closeSideMenu() {
        sideMenu.classList.remove("open");
        overlay.classList.remove("active");
        }

        openMenu.addEventListener("click", openSideMenu);
        closeMenu.addEventListener("click", closeSideMenu);
        overlay.addEventListener("click", closeSideMenu);

// Mouse Back/Forward buttons step through the sheet's levels like a browser:
// 0 = calculator, 1 = menu sheet, 2 = history page.
// Back goes down one level. Forward climbs back up, but only as far as Back
// has already come down from, the way a browser's forward history works.
const MOUSE_BACK = 3;
const MOUSE_FORWARD = 4;
let forwardLimit = 0;

function currentSheetLevel() {
    if (!sideMenu.classList.contains("open")) return 0;
    return sideMenu.classList.contains("show-history") ? 2 : 1;
}

function goBack() {
    const level = currentSheetLevel();
    if (level === 0) return;
    forwardLimit = Math.max(forwardLimit, level);
    if (level === 2) setHistoryPageOpen(false);
    else closeSideMenu();
}

function goForward() {
    const level = currentSheetLevel();
    if (level >= forwardLimit) return;
    if (level === 0) openSideMenu();
    else setHistoryPageOpen(true);
}

// Opening something from the UI starts a new path, so the old forward steps
// no longer apply (same as clicking a link after going back in a browser).
openMenu.addEventListener("click", () => { forwardLimit = 0; });
document.getElementById("openHistory").addEventListener("click", () => { forwardLimit = 0; });

// Swallow mousedown too, so Chromium never tries its own back/forward.
document.addEventListener("mousedown", (event) => {
    if (event.button === MOUSE_BACK || event.button === MOUSE_FORWARD) event.preventDefault();
});

document.addEventListener("mouseup", (event) => {
    if (event.button === MOUSE_BACK) {
        event.preventDefault();
        goBack();
    } else if (event.button === MOUSE_FORWARD) {
        event.preventDefault();
        goForward();
    }
});