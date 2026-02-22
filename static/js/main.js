document.addEventListener('DOMContentLoaded', () => {
    gsap.registerPlugin(ScrollTrigger);

    const header = document.querySelector('header');

    // --- Loader Logic ---
    const startTime = Date.now();
    const minLoadTime = 1100;
    const loader = document.querySelector('.loading-screen');

    window.addEventListener('load', () => {
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, minLoadTime - elapsedTime);

        setTimeout(() => {
            if (loader) {
                loader.classList.add('loaded');
            }
        }, remainingTime);
    });
    // --------------------

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const fadeElements = document.querySelectorAll('.fade-in-up');
    fadeElements.forEach(el => observer.observe(el));

    const container = document.getElementById("imageContainer");
    if (container) {
        const bgCards = container.querySelectorAll(".bg-card");
        const fgCards = container.querySelectorAll(".fg-card");
        let index = 0;
        let interval;
        const timelines = [];

        bgCards.forEach(card => {
            gsap.set(card, { rotation: Math.random() * 360 });

            const tl = gsap.timeline({ repeat: -1 });
            tl.to(card, {
                rotate: "+=360",
                rotate: "+=360",
                duration: 20 + Math.random() * 5,
                ease: "none"
            });
            timelines.push(tl);
        });

        function nextImage() {
            if (fgCards.length > 0) {
                fgCards[index].classList.remove("active");
                index = (index + 1) % fgCards.length;
                fgCards[index].classList.add("active");
            }
        }

        function start() {
            interval = setInterval(nextImage, 1800);
        }

        function pause() {
            timelines.forEach(tl => tl.pause());
            clearInterval(interval);
        }

        function resume() {
            timelines.forEach(tl => tl.play());
            start();
        }

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
            pause();
        }

        function handleMouseLeave() {
            fgCards.forEach(card => {
                gsap.to(card, {
                    rotateX: 0,
                    rotateY: 0,
                    scale: 1,
                    duration: 0.5,
                    ease: "power3.out"
                });
            });
            resume();
        }

        container.addEventListener('mousemove', handleMouse);
        container.addEventListener('mouseenter', handleMouseEnter);
        container.addEventListener('mouseleave', handleMouseLeave);

        start();
    }

    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle) {
        const text = heroTitle.textContent.trim();
        heroTitle.textContent = "";
        text.split("").forEach((char, index) => {
            const span = document.createElement("span");
            span.textContent = char === " " ? "\u00A0" : char;
            if (index === 0 || index === 8) {
                span.classList.add("retro-initial");
            }
            heroTitle.appendChild(span);
        });

        gsap.set(".hero-title span", {
            clipPath: "inset(100% 0 0 0)"
        });
    }

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
            duration: 0.6,
            ease: "power2.out",
            delay: 0.1,
            stagger: {
                each: 0.05,
                from: "start"
            }
        });
    }

    const zoomImageContainer = document.querySelector('.zoom-image-container');

    if (document.querySelector('.zoom-wrapper') && zoomImageContainer) {
        gsap.set(".hero-visual", {
            xPercent: -50,
            yPercent: -50
        });

        const mm = gsap.matchMedia();

        mm.add("(min-width: 650px) and (max-width: 768px)", () => {
            createZoomTimeline(0.92);
        });

        mm.add("(max-width: 649px), (min-width: 769px)", () => {
            createZoomTimeline(1);
        });

        function createZoomTimeline(targetScale) {
            gsap.timeline({
                scrollTrigger: {
                    trigger: ".zoom-wrapper",
                    start: "top top",
                    end: "+=100%",
                    pin: true,
                    scrub: true,
                    onLeave: () => {
                        const title = document.querySelector('.hero-title');
                        if (title) {
                            const rect = title.getBoundingClientRect();
                            title.style.top = (window.scrollY + rect.top) + "px";
                            title.classList.add('scrolled-out');
                        }
                    },
                    onEnterBack: () => {
                        const title = document.querySelector('.hero-title');
                        if (title) {
                            title.classList.remove('scrolled-out');
                            title.style.top = "";
                        }
                    }
                }
            })
                .to(zoomImageContainer, {
                    scale: 50,
                    z: 350,
                    transformOrigin: "center center",
                    ease: "power1.inOut",
                    duration: 1
                })
                .fromTo(".zoom-content .hero .hero-wrapper", {
                    scale: 0.9,
                    transformOrigin: "center center"
                }, {
                    scale: 1,
                    ease: "power1.inOut",
                    duration: 1
                }, "<")
                .fromTo(".hero-visual", {
                    scale: 0.9,
                    transformOrigin: "50% 50%",
                    xPercent: -48,
                    yPercent: -50
                }, {
                    scale: targetScale,
                    transformOrigin: "50% 50%",
                    xPercent: -48,
                    yPercent: -50,
                    ease: "power1.inOut",
                    duration: 1
                }, "<")
                .from(".hero-title", {
                    scale: 0.9,
                    transformOrigin: "center center",
                    ease: "power1.inOut",
                    duration: 1
                }, "<")
                .call(animateHeroTitle, null, 0.08)
                .to(".overlay-section", {
                    y: "0%",
                    ease: "none",
                    duration: 1
                }, ">+1")
                .to([".hero-visual", ".hero-content-right", ".hero-footer-strip"], {
                    opacity: 0,
                    duration: 0.3,
                    ease: "power1.in"
                }, "<-0")
                .to({}, { duration: 1.5 })
                .to(".overlay-section", {
                    scale: 0.9,
                    borderRadius: "20px",
                    transformOrigin: "center center",
                    ease: "power1.inOut",
                    duration: 1
                })
                .to(".hero-title", {
                    scale: 0.9,
                    transformOrigin: "center center",
                    ease: "power1.inOut",
                    duration: 1
                }, "<");
        }
    }

    function animateHeroTitle() {
        if (!heroTitle) return;
        gsap.to(".hero-title span:not(.retro-initial)", {
            clipPath: "inset(-20% -20% -20% -20%)",
            duration: 1.2,
            ease: "power2.out",
            delay: 0.5,
            stagger: {
                each: 0.05,
                from: "start"
            }
        });
        gsap.to(".hero-title span.retro-initial", {
            clipPath: "inset(-75% -75% -75% -75%)",
            duration: 1.2,
            ease: "power2.out",
            delay: 0.5,
            stagger: {
                each: 0.05,
                from: "start"
            }
        });
    }

    const menuBtn = document.getElementById("menu-btn");
    const dropdown = document.getElementById("dropdown");
    const content = document.getElementById("content");
    const navigation = document.getElementById("navigation");
    let isOpen = false;

    if (menuBtn && dropdown && content && navigation) {
        menuBtn.addEventListener("click", () => {
            if (!isOpen) {
                const openTimeline = gsap.timeline();

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
                        delay: 0.2
                    },
                        "-=0.3"
                    )
                    .from(
                        ".dropdown__section--one p", {
                        opacity: 0,
                        y: 20,
                        duration: 0.4,
                        delay: 0.1,
                        ease: "power2.out"
                    },
                        "-=0.2"
                    )
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
                const closeTimeline = gsap.timeline();

                closeTimeline
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
                    .add(() => {
                        gsap.to(dropdown, {
                            y: "0",
                            duration: 0.4,
                            ease: "power2.in"
                        });
                    })
                    .add(() => {
                        dropdown.classList.remove("open");
                        menuBtn.textContent = "MENU";
                    });
            }

            isOpen = !isOpen;
        });
    }

});

const travelTxt = document.querySelector('.travel-txt');
if (travelTxt) {
    const w = window.innerWidth;

    const tweenLoop = gsap.to('.travel-txt', {
        xPercent: -100,
        duration: 15,
        ease: "none",
        repeat: -1,
        onUpdate: function () {
        }
    });

    tweenLoop.kill();

    const loopAnim = gsap.to('.travel-txt', {
        xPercent: -33.333,
        duration: 15,
        ease: "none",
        paused: true
    });

    const eachTxt = document.querySelectorAll('.travel-txt__each');
    const lastItem = eachTxt[eachTxt.length - 4];

    gsap.ticker.add(() => {

        if (!loopAnim.isActive()) loopAnim.play();

        if (lastItem) {
            const rect = lastItem.getBoundingClientRect();
            if (rect.left < 0) {
                loopAnim.play(0);
            }
        }
    });

    travelTxt.addEventListener('mouseenter', () => loopAnim.pause());
    travelTxt.addEventListener('mouseleave', () => loopAnim.play());
}
