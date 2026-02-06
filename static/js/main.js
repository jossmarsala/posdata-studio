document.addEventListener('DOMContentLoaded', () => {

    // Register GSAP ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

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
                duration: 20 + Math.random() * 5, // Slower rotation for elegance
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
            interval = setInterval(nextImage, 1800); // Slower interval (1.5s) for better viewing
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

        // 3D Tilt Effect for Foreground Cards
        container.addEventListener('mousemove', (e) => {
            const rect = container.getBoundingClientRect();
            const x = e.clientX - rect.left; // x position within the element
            const y = e.clientY - rect.top;  // y position within the element

            // Calculate center of the element
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            // Calculate rotation based on cursor position relative to element center
            // Adjust divisor (20) to control sensitivity/intensity
            const rotateX = (centerY - y) / 10;
            const rotateY = (x - centerX) / 10;

            fgCards.forEach(card => {
                card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            });
        });

        // Reset on mouse leave
        container.addEventListener('mouseleave', () => {
            fgCards.forEach(card => {
                card.style.transform = `rotateX(0deg) rotateY(0deg)`;
            });
        });
    }


    // Hero Title Reveal Animation Logic (Run on Load)
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle) {
        // Split text into spans
        const text = heroTitle.textContent.trim();
        heroTitle.textContent = "";
        text.split("").forEach((char) => {
            const span = document.createElement("span");
            span.textContent = char === " " ? "\u00A0" : char;
            heroTitle.appendChild(span);
        });

        // Set initial state hidden
        gsap.set(".hero-title span", {
            clipPath: "inset(100% 0 0 0)"
        });

        // Animate immediately
        //animateHeroTitle();
    }

    // Loading Text Reveal (Matches Hero)
    const loadingText = document.querySelector('.loading-text');
    if (loadingText) {
        const text = loadingText.textContent.trim();
        loadingText.textContent = "";
        text.split("").forEach((char) => {
            const span = document.createElement("span");
            span.textContent = char === " " ? "\u00A0" : char;
            loadingText.appendChild(span);
        });

        gsap.set(".loading-text span", {
            clipPath: "inset(100% 0 0 0)"
        });

        gsap.to(".loading-text span", {
            clipPath: "inset(-20% -20% -20% -20%)",
            duration: 1.2,
            ease: "power2.out",
            delay: 1, // Start after logo
            stagger: {
                each: 0.05,
                from: "start"
            }
        });
    }

    // Filetab Label Animation (Reveal on Scroll)
    const filetabLabels = document.querySelectorAll('.filetab-label');
    filetabLabels.forEach(label => {
        const text = label.textContent.trim();
        label.textContent = "";
        text.split("").forEach((char) => {
            const span = document.createElement("span");
            span.textContent = char === " " ? "\u00A0" : char;
            label.appendChild(span);
        });

        // Set initial state hidden
        gsap.set(label.querySelectorAll("span"), {
            clipPath: "inset(100% 0 0 0)"
        });

        // ScrollTrigger Animation
        gsap.to(label.querySelectorAll("span"), {
            scrollTrigger: {
                trigger: label,
                start: "top 85%",
                toggleActions: "play none none reverse"
            },
            clipPath: "inset(-20% -20% -20% -20%)",
            duration: 1.2,
            ease: "power2.out",
            stagger: {
                each: 0.05,
                from: "start"
            }
        });
    });

    // Zoom Intro Effect (GSAP ScrollTrigger)

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
                ease: "power1.inOut",
                duration: 1
            })
            // Animate the background content from small (zoomed out) to normal (100%)
            .fromTo(".zoom-content .hero", {
                scale: 0.9,     // Start zoomed out (smaller)
                transformOrigin: "center center"
            }, {
                scale: 1,       // End at natural 100% size
                ease: "power1.inOut",
                duration: 1
            }, "<")
            .call(animateHeroTitle, null, 0.08); // Trigger at 50% (scale ~0.95)

        // Header Visibility & Title Animation Trigger
        // Sync header and title appearance with the end of the zoom scroll
        ScrollTrigger.create({
            trigger: ".zoom-wrapper",
            start: "top top",
            end: "+=100%", // Must match the pinning distance
            onLeave: () => {
                header.classList.add('header-visible');
                // animateHeroTitle(); // Removed to sync with zoom completion
            },
            onEnterBack: () => {
                header.classList.remove('header-visible');
                // resetHeroTitle(); 
            },
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



    function animateHeroTitle() {
        if (!heroTitle) return;
        gsap.to(".hero-title span", {
            clipPath: "inset(-20% -20% -20% -20%)",
            duration: 1.2,
            ease: "power2.out",
            delay: 0.5, // Small delay for effect
            stagger: {
                each: 0.05,
                from: "start"
            }
        });
    }

    // Mobile Menu Toggle (SVG Logic)
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');
    const navLinksItems = document.querySelectorAll('.nav-links a');

    // Check if we restored the wrapper class, otherwise fallback to body or ignore blur
    // The previous HTML edit added .blur-target to <main>
    const blurTarget = document.querySelector('.blur-target');

    if (navToggle && navLinks) {
        navToggle.addEventListener('click', (e) => {
            e.preventDefault();

            // Toggle active class on SVG (triggers nav-anim animations)
            navToggle.classList.toggle('active');

            // Toggle active class on Nav Links (triggers visibility)
            navLinks.classList.toggle('active');
        });

        // Close menu when clicking a link
        navLinksItems.forEach(link => {
            link.addEventListener('click', () => {
                navToggle.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });
    }

});
