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