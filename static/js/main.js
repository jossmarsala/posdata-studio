document.addEventListener('DOMContentLoaded', () => {

    // Register GSAP ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

    // Header Scroll Visibility Effect (Synced with GSAP)
    const header = document.querySelector('header');

    // Header Scroll Visibility Effect Removed



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

        // 3D Tilt Effect for Foreground Cards (Ported logic)
        // Constants
        const rotateAmplitude = 14;
        const springEase = "back.out(1.7)"; // Simulating spring stiffness/damping

        function handleMouse(e) {
            const rect = container.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Calculate offsets from center
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const offsetX = x - centerX;
            const offsetY = y - centerY;

            // Calculate rotation values
            // RotateX is inverted (movement up -> looks up -> rotate negative X?) 
            // Standard CSS rotateX: positive tips top away. 
            // If mouse is at top (negative offsetY), we want top to tip towards us? Or away?
            // React code: (offsetY / halfHeight) * -rotationAmplitude.
            // If mouse at bottom (+offsetY), result is negative rotateX.
            // Let's stick to the provided math.
            const rotationX = (offsetY / centerY) * -rotateAmplitude;
            const rotationY = (offsetX / centerX) * rotateAmplitude;

            // Apply to ONLY the active foreground card to prevent clipping with hidden ones
            const activeCard = container.querySelector('.fg-card.active');
            if (activeCard) {
                gsap.to(activeCard, {
                    rotateX: rotationX,
                    rotateY: rotationY,
                    duration: 0.4, // Smooth springy lag
                    ease: "power2.out", // Smooth easing
                    overwrite: "auto"
                });
            }
        }

        function handleMouseEnter() {
            const activeCard = container.querySelector('.fg-card.active');
            if (activeCard) {
                gsap.to(activeCard, {
                    scale: 1.02, // Subtle scale
                    duration: 0.4,
                    ease: springEase
                });
            }
            // Pause rotation on hover (existing logic)
            pause();
        }

        function handleMouseLeave() {
            // Reset ALL cards to ensure clean state
            fgCards.forEach(card => {
                gsap.to(card, {
                    rotateX: 0,
                    rotateY: 0,
                    scale: 1,
                    duration: 0.5,
                    ease: "power3.out"
                });
            });
            // Resume rotation (existing logic)
            resume();
        }

        container.addEventListener('mousemove', handleMouse);
        container.addEventListener('mouseenter', handleMouseEnter);
        container.addEventListener('mouseleave', handleMouseLeave);

        // Start the rotation loop initially
        start();
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



    // Zoom Intro Effect (GSAP ScrollTrigger)

    const zoomImageContainer = document.querySelector('.zoom-image-container');

    // Only run if elements exist
    if (document.querySelector('.zoom-wrapper') && zoomImageContainer) {
        gsap.timeline({
            scrollTrigger: {
                trigger: ".zoom-wrapper",
                start: "top top",
                end: "+=400%", // Extended scroll distance for sequential phases
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
            .call(animateHeroTitle, null, 0.08) // Trigger at 50% (scale ~0.95)
            // FASE 2: Stacking Overlay
            // Starts strictly after Phase 1 + Buffer

            // 1. Overlay rises
            .to(".overlay-section", {
                y: "0%",         // Slide up to cover
                ease: "none",    // Linear easing for direct scroll control (scrub)
                duration: 1      // Relative duration in timeline
            }, ">+1") // STRICT BUFFER: Wait 1s relative time

            // 2. Dissolve Rotating Images
            // Fade out subtly as overlay rises, BEFORE contact
            // Images are at z-index 60 (above overlay), so we dissolve them to avoid overlap
            .to(".hero-visual", {
                opacity: 0,
                scale: 0.9,     // Subtle shrinking
                duration: 0.3,  // Fast fade (user requested "even faster")
                ease: "power1.in"
            }, "<-0"); // Start just before overlay rises (almost sync)

        // Header Visibility Logic Removed

    }



    // Actually, let's look at lines 198-203. I can just edit that place.
    // But here I'm replacing line 208?
    // Wait, I need to edit the previous replace file call area.
    // The user wants me to implement this. I will look at the previous content again to be sure.
    // Lines 198-203 are where the overlay animation is.
    // I will use `replace_file_content` on that block.




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

    // Mobile Menu Toggle (SVG Logic) - REMOVED

    // New Navbar Logic "The Artisan" style
    const menuBtn = document.getElementById("menu-btn");
    const dropdown = document.getElementById("dropdown");
    const content = document.getElementById("content");
    const navigation = document.getElementById("navigation");
    let isOpen = false;

    if (menuBtn && dropdown && content && navigation) {
        menuBtn.addEventListener("click", () => {
            if (!isOpen) {
                // Opening the menu: Immediate and synchronized animations
                const openTimeline = gsap.timeline();

                // Reset the visibility and position of the h1, p, and links before animating
                gsap.set(
                    ".dropdown__section--one h1, .dropdown__section--one p, .dropdown__button", {
                    opacity: 1,
                    y: 0
                }
                );

                openTimeline
                    .to(dropdown, {
                        y: "50vh",
                        duration: 0.4,
                        ease: "power2.out"
                    })
                    .from(
                        ".dropdown__section--one h1", {
                        opacity: 0,
                        y: 20,
                        duration: 0.4,
                        ease: "power2.out",
                        delay: 0.2 // Start soon after dropdown starts
                    },
                        "-=0.3"
                    ) // Start 0.3 seconds BEFORE the dropdown finishes
                    .from(
                        ".dropdown__section--one p", {
                        opacity: 0,
                        y: 20,
                        duration: 0.4,
                        delay: 0.1, // Start immediately after h1
                        ease: "power2.out"
                    },
                        "-=0.2"
                    ) // Start 0.2 seconds before dropdown finishes
                    // Stagger buttons slightly
                    .from(
                        ".dropdown__button", {
                        opacity: 0,
                        y: 20,
                        duration: 0.3,
                        stagger: 0.1, // Stagger the buttons slightly
                        ease: "power2.out"
                    },
                        "-=0.2"
                    )
                    .to(
                        ".divider", {
                        width: "100%",
                        duration: 0.2,
                        ease: "power2.out"
                    },
                        "-=0.4"
                    ); // Sync with other elements

                dropdown.classList.add("open"); // Add "open" class for CSS
                menuBtn.textContent = "CLOSE";
            } else {
                // Closing the menu (reverse animations smoothly)
                const closeTimeline = gsap.timeline();

                closeTimeline
                    // Reverse animations
                    .to(".dropdown__button", {
                        opacity: 0,
                        y: 20,
                        duration: 0.3,
                        stagger: 0.05,
                        ease: "power2.in"
                    })
                    .to(
                        ".dropdown__section--one p", {
                        opacity: 0,
                        y: 20,
                        duration: 0.3,
                        ease: "power2.in"
                    },
                        "-=0.1"
                    )
                    .to(
                        ".dropdown__section--one h1", {
                        opacity: 0,
                        y: 20,
                        duration: 0.3,
                        ease: "power2.in"
                    },
                        "-=0.1"
                    )
                    .to(".divider", {
                        width: "0%",
                        duration: 0.4,
                        ease: "power2.in"
                    })
                    // Slide dropdown back up smoothly
                    .add(() => {
                        gsap.to(dropdown, {
                            y: "0",
                            duration: 0.4,
                            ease: "power2.in"
                        });
                    })
                    // Update menu button text after animations finish
                    .add(() => {
                        dropdown.classList.remove("open");
                        menuBtn.textContent = "MENU";
                    });
            }

            isOpen = !isOpen;
        });
    }

});
