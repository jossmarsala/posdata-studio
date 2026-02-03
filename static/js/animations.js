// Animations using GSAP
console.log('Animations script loaded');

document.addEventListener("DOMContentLoaded", () => {
    gsap.registerPlugin(ScrollTrigger);

    // Hero Sequence (Existing - ensuring no conflict, though not modifying it here)
    // ...

    // Services Folder Stacking Animation
    const tabs = document.querySelectorAll('.filetab');
    const container = document.querySelector('.filetabs-container');
    let currentIndex = 0;
    let intervalId;

    // Order of tabs in DOM: Pink (0), Blue (1), White (2), Green (3)
    // To show Pink(0), we shift 1, 2, 3.
    // To show Blue(1), we shift 2, 3.
    // To show White(2), we shift 3.
    // To show Green(3), we shift none.

    // Total states = 4.

    // Total states = 4.

    function updateTabs() {
        // Reset all first
        tabs.forEach(tab => tab.classList.remove('shifted'));

        // Apply shifts based on currentIndex (which tab we want to REVEAL)
        // If index 0 (Pink) is active, all subsequent tabs must move down.
        // If index 3 (Green) is active, none move down (default state).

        for (let i = currentIndex + 1; i < tabs.length; i++) {
            // Prevent green tab from moving
            if (tabs[i].classList.contains('filetab-green')) continue;

            tabs[i].classList.add('shifted');
        }

        // Prepare next index
        currentIndex = (currentIndex + 1) % tabs.length;
    }

    // Start Animation
    if (tabs.length > 0) {
        // Run immediately? User said "vayan desplegando". 
        // Let's start interval.
        intervalId = setInterval(updateTabs, 4000);

        // Initial call to set state 0?
        // By default CSS has them stacked (State 3 - Green Active). 
        // If we want to start by revealing Pink, we should call updateTabs immediately?
        // Or better, allow user to see Green first.
    }

});
