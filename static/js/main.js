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
    // New Image Stack Animation (Rotation + Sequence)
    const container = document.getElementById("imageContainer");
    if (container) {
        const bgCards = container.querySelectorAll(".bg-card");
        const fgCards = container.querySelectorAll(".fg-card");
        let index = 0;
        let interval;
        const timelines = [];

        // Background rotation - Random start rotation to look more natural
        bgCards.forEach(card => {
            // Set initial random rotation so they aren't all aligned
            gsap.set(card, { rotation: Math.random() * 360 });

            const tl = gsap.timeline({ repeat: -1 });
            tl.to(card, {
                rotate: "+=360",
                duration: 20 + Math.random() * 10, // Slower rotation for elegance
                ease: "none"
            });
            timelines.push(tl);
        });

        // Foreground sequence
        function nextImage() {
            // Ensure elements exist before trying to access classList
            if (fgCards.length > 0) {
                fgCards[index].classList.remove("active");
                index = (index + 1) % fgCards.length;
                fgCards[index].classList.add("active");
            }
        }

        function start() {
            interval = setInterval(nextImage, 1500); // Slower interval (1.5s) for better viewing
        }

        function pause() {
            timelines.forEach(tl => tl.pause());
            clearInterval(interval);
        }

        function resume() {
            timelines.forEach(tl => tl.play());
            start();
        }

        container.addEventListener("mouseenter", pause);
        container.addEventListener("mouseleave", resume);

        start();
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
            end: "+=100%", // Must match the pinning distance
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
