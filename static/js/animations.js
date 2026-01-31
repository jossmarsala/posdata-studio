// Animations using GSAP
console.log('Animations script loaded');

document.addEventListener("DOMContentLoaded", () => {
    gsap.registerPlugin(ScrollTrigger);

    // Hero Sequence (Existing - ensuring no conflict, though not modifying it here)
    // ...

    // Services Folder Stacking Animation
    const serviceSection = document.querySelector(".services-folder-section");
    const folders = document.querySelectorAll(".folder-card");

    if (serviceSection && folders.length > 0) {
        // Initial setup - hide content or push down?
        // Let's set initial state: stacked at bottom. 
        // We do this via timeline to avoid FOUC or complex CSS initial states if JS fails.

        const mainTimeline = gsap.timeline({
            scrollTrigger: {
                trigger: serviceSection,
                start: "top top",
                end: "+=300%", // Scroll distance (adjust based on feel)
                scrub: true,
                pin: true,
                anticipatePin: 1
            }
        });

        // 1. Initial State: All folders are stacked at the bottom (except maybe the first one slightly visible?)
        // Actually, CSS puts them all at bottom:0.
        // We want to animate them UP.

        // Let's iterate through folders and animate them.
        // Strategy: 
        // - First folder slides up.
        // - Second folder slides up ON TOP of it.
        // - Etc.

        // We want the 'tabs' to be visible initially? Or just the first one?
        // User request: "visible solo el titulo" (only title visible initially) -> "se va mostrando una y ocultando la otra"

        // Calculate an offset so tabs are visible like a stack index
        const totalFolders = folders.length;

        // Set initial positions (optional, if CSS isn't enough)
        // Currently CSS has them at bottom:0. 
        // We might want to push them down so only tabs show? 
        // Height is 80vh. If we transform Y by 70vh, only top 10vh (tab) shows.

        // Initial state logic:
        folders.forEach((folder, i) => {
            const offset = i * 80; // 60px visible tab area for each index

            // Set initial state:
            // y: offset (fixed stagger that persists)
            // yPercent: 60 (Lifted up so all folders including the last ones are visible)
            gsap.set(folder, {
                y: offset,
                yPercent: 60
            });
        });

        // Animate them up sequentially
        folders.forEach((folder, i) => {
            // Animate yPercent to 0 (move to natural position + offset)
            // 'y' remains as set in initial state (offset), creating the stack effect
            mainTimeline.to(folder, {
                yPercent: 0,
                duration: 1,
                ease: "power2.out"
            }, i * 0.5); // Stagger start times
        });

        // Adjust z-indexes just in case CSS didn't map perfectly to expectation
        // CSS: folder-1 (z:1), folder-2 (z:2)...
    }
});
