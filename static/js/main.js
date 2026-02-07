document.addEventListener('DOMContentLoaded', () => {
    // register gsap scrolltrigger
    gsap.registerPlugin(ScrollTrigger);

    const header = document.querySelector('header');

    // intersection observer for fade-in animations
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


    // image stack animation
    const container = document.getElementById("imageContainer");
    if (container) {
        const bgCards = container.querySelectorAll(".bg-card");
        const fgCards = container.querySelectorAll(".fg-card");
        let index = 0;
        let interval;
        const timelines = [];

        // background rotation
        bgCards.forEach(card => {
            // initial random rotation
            gsap.set(card, { rotation: Math.random() * 360 });

            const tl = gsap.timeline({ repeat: -1 });
            tl.to(card, {
                rotate: "+=360",
                rotate: "+=360",
                duration: 20 + Math.random() * 5, // slower rotation
                ease: "none"
            });
            timelines.push(tl);
        });

        // foreground sequence
        function nextImage() {
            if (fgCards.length > 0) {
                fgCards[index].classList.remove("active");
                index = (index + 1) % fgCards.length;
                fgCards[index].classList.add("active");
            }
        }

        function start() {
            interval = setInterval(nextImage, 1800); // slower interval
        }

        function pause() {
            timelines.forEach(tl => tl.pause());
            clearInterval(interval);
        }

        function resume() {
            timelines.forEach(tl => tl.play());
            start();
        }

        // 3d tilt effect
        const rotateAmplitude = 14;

        function handleMouse(e) {
            const rect = container.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const offsetX = x - centerX;
            const offsetY = y - centerY;

            const rotationX = (offsetY / centerY) * -rotateAmplitude;
            const rotationY = (offsetX / centerX) * rotateAmplitude;

            // apply to active card
            const activeCard = container.querySelector('.fg-card.active');
            if (activeCard) {
                gsap.to(activeCard, {
                    rotateX: rotationX,
                    rotateY: rotationY,
                    duration: 0.4,
                    ease: "power2.out",
                    overwrite: "auto"
                });
            }
        }

        function handleMouseEnter() {
            const activeCard = container.querySelector('.fg-card.active');
            if (activeCard) {
                gsap.to(activeCard, {
                    scale: 1.02,
                    duration: 0.4,
                    ease: "back.out(1.7)"
                });
            }
            // pause rotation on hover
            pause();
        }

        function handleMouseLeave() {
            // reset all cards
            fgCards.forEach(card => {
                gsap.to(card, {
                    rotateX: 0,
                    rotateY: 0,
                    scale: 1,
                    duration: 0.5,
                    ease: "power3.out"
                });
            });
            // resume rotation
            resume();
        }

        container.addEventListener('mousemove', handleMouse);
        container.addEventListener('mouseenter', handleMouseEnter);
        container.addEventListener('mouseleave', handleMouseLeave);

        // start rotation loop
        start();
    }

    // hero title reveal animation
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle) {
        // split text
        const text = heroTitle.textContent.trim();
        heroTitle.textContent = "";
        text.split("").forEach((char) => {
            const span = document.createElement("span");
            span.textContent = char === " " ? "\u00A0" : char;
            heroTitle.appendChild(span);
        });

        // set initial state hidden
        gsap.set(".hero-title span", {
            clipPath: "inset(100% 0 0 0)"
        });
    }

    // loading text reveal
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

    // zoom intro effect
    const zoomImageContainer = document.querySelector('.zoom-image-container');

    if (document.querySelector('.zoom-wrapper') && zoomImageContainer) {
        // explicitly set transforms to avoid css conflicts
        gsap.set(".hero-visual", {
            xPercent: -50,
            yPercent: -50
        });

        gsap.timeline({
            scrollTrigger: {
                trigger: ".zoom-wrapper",
                start: "top top",
                end: "+=250%", // scroll distance for effect
                pin: true,      // pin wrapper
                scrub: true,    // smooth scrubbing
            }
        })
            .to(zoomImageContainer, {
                scale: 50,      // massive scale
                z: 350,
                transformOrigin: "center center",
                ease: "power1.inOut",
                duration: 1
            })
            // animate background content
            .fromTo(".zoom-content .hero", {
                scale: 0.9,
                transformOrigin: "center center"
            }, {
                scale: 1,
                ease: "power1.inOut",
                duration: 1
            }, "<")
            // sync rotating images zoom
            .fromTo(".hero-visual", {
                scale: 0.9,
                transformOrigin: "50% 50%",
                xPercent: -48, // ensure stability
                yPercent: -50
            }, {
                scale: 1,
                transformOrigin: "50% 50%",
                xPercent: -48, // ensure stability
                yPercent: -50,
                ease: "power1.inOut",
                duration: 1
            }, "<")
            // sync hero title zoom
            .from(".hero-title", {
                scale: 0.9,
                transformOrigin: "center center",
                ease: "power1.inOut",
                duration: 1
            }, "<")
            .call(animateHeroTitle, null, 0.08)
            // phase 2: stacking overlay

            // overlay rises
            .to(".overlay-section", {
                y: "0%",
                ease: "none",
                duration: 1
            }, ">+1")

            // dissolve rotating images and hero content
            .to([".hero-visual", ".hero-content-right", ".hero-footer-strip"], {
                opacity: 0,
                duration: 0.3,
                ease: "power1.in"
            }, "<-0")



    }

    function animateHeroTitle() {
        if (!heroTitle) return;
        gsap.to(".hero-title span", {
            clipPath: "inset(-20% -20% -20% -20%)",
            duration: 1.2,
            ease: "power2.out",
            delay: 0.5,
            stagger: {
                each: 0.05,
                from: "start"
            }
        });
    }

    // navbar logic
    const menuBtn = document.getElementById("menu-btn");
    const dropdown = document.getElementById("dropdown");
    const content = document.getElementById("content");
    const navigation = document.getElementById("navigation");
    let isOpen = false;

    if (menuBtn && dropdown && content && navigation) {
        menuBtn.addEventListener("click", () => {
            if (!isOpen) {
                // opening menu
                const openTimeline = gsap.timeline();

                // reset visibility and position
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
                    )
                    .from(
                        ".dropdown__section--one p", {
                        opacity: 0,
                        y: 20,
                        duration: 0.4,
                        delay: 0.1, // Start immediately after h1
                        ease: "power2.out"
                    },
                        "-=0.2"
                    )
                    // stagger buttons
                    .from(
                        ".dropdown__button", {
                        opacity: 0,
                        y: 20,
                        duration: 0.3,
                        stagger: 0.1,
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
                    );

                dropdown.classList.add("open");
                menuBtn.textContent = "CLOSE";
            } else {
                // closing menu
                const closeTimeline = gsap.timeline();

                closeTimeline
                    // reverse animations
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
                    // slide dropdown back up
                    .add(() => {
                        gsap.to(dropdown, {
                            y: "0",
                            duration: 0.4,
                            ease: "power2.in"
                        });
                    })
                    // update menu button text
                    .add(() => {
                        dropdown.classList.remove("open");
                        menuBtn.textContent = "MENU";
                    });
            }

            isOpen = !isOpen;
        });
    }

});
