document.addEventListener('DOMContentLoaded', () => {

    // Header Scroll Visibility Effect (Synced with GSAP)
    const header = document.querySelector('header');

    // We'll use ScrollTrigger to show the header after the Zoom effect wraps up
    // The previous manual scroll listener is replaced to avoid conflicts with pinning

    // Wait for GSAP to be registered (it is registered below, but safe to run logic inside DOMContentLoaded)
    // We will move the GSAP registration to the top of the file to be safe or ensure this runs after.
    // Actually, let's keep it simple: simpler manual check considering the pinning duration?
    // No, ScrollTrigger is cleaner.

    // We'll move this logic down to where we register ScrollTrigger


    // Intersection Observer for Fade-in Animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, observerOptions);

    const fadeElements = document.querySelectorAll('.fade-in-up');
    fadeElements.forEach(el => observer.observe(el));


    // Image Stack Cycling with Fade
    const stackImages = document.querySelectorAll('.stack-img');
    if (stackImages.length >= 3) {
        setInterval(() => {
            const top = document.querySelector('.stack-img.img-1');
            const mid = document.querySelector('.stack-img.img-2');
            const bot = document.querySelector('.stack-img.img-3');

            if (top && mid && bot) {
                // 1. Fade out the top image
                top.classList.add('fading-out');

                // 2. After fade is complete (500ms), rotate the stack
                setTimeout(() => {
                    // Move Top to Bottom (and reset fade)
                    top.classList.remove('img-1');
                    top.classList.add('img-3');
                    top.classList.remove('fading-out'); // Visible again at bottom

                    // Move Mid to Top
                    mid.classList.remove('img-2');
                    mid.classList.add('img-1');

                    // Move Bot to Mid
                    bot.classList.remove('img-3');
                    bot.classList.add('img-2');
                }, 500); // Sync with CSS opacity transition (0.5s)
            }
        }, 3000); // 3 seconds per slide
    }


    // Zoom Intro Effect (GSAP ScrollTrigger)
    gsap.registerPlugin(ScrollTrigger);

    const zoomImageContainer = document.querySelector('.zoom-image-container');

    // Only run if elements exist
    if (document.querySelector('.zoom-wrapper') && zoomImageContainer) {
        gsap.timeline({
            scrollTrigger: {
                trigger: ".zoom-wrapper",
                start: "top top",
                end: "+=150%", // Scroll distance to complete zoom
                pin: true,      // Pin the wrapper
                scrub: true,    // Smooth scrubbing
                // markers: true // Debugging
            }
        })
            .to(zoomImageContainer, {
                scale: 50,      // Massive scale to "fly through" the hole
                z: 350,         // Move along Z-axis
                transformOrigin: "center center",
                ease: "power1.inOut"
            })
            // Animate the background content from small (zoomed out) to normal (100%)
            .fromTo(".zoom-content .hero", {
                scale: 0.9,     // Start zoomed out (smaller)
                transformOrigin: "center center"
            }, {
                scale: 1,       // End at natural 100% size
                ease: "power1.inOut"
            }, "<");

        // Header Visibility Trigger
        // Sync header appearance with the end of the zoom scroll
        ScrollTrigger.create({
            trigger: ".zoom-wrapper",
            start: "top top",
            end: "+=150%", // Must match the pinning distance
            onLeave: () => header.classList.add('header-visible'), // Show when passed
            onEnterBack: () => header.classList.remove('header-visible'), // Hide when returning
            onUpdate: (self) => {
                // Ensure state is correct if refreshed in middle
                if (self.progress === 1) {
                    header.classList.add('header-visible');
                } else if (self.progress < 1) {
                    header.classList.remove('header-visible');
                }
            }
        });
    }

});
