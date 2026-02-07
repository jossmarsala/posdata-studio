// initialize cursor immediately if possible
function initCursor() {
    const bigBall = document.querySelector('.cursorball--big');
    const smallBall = document.querySelector('.cursorball--small');
    const hoverables = document.querySelectorAll('a, button, .hover-trigger');

    // only run if elements exist
    if (bigBall && smallBall) {
        // move cursor balls
        document.addEventListener('mousemove', (e) => {
            gsap.to(bigBall, {
                x: e.clientX - 15,
                y: e.clientY - 15,
                duration: 0.4,
                ease: "power2.out"
            });

            gsap.to(smallBall, {
                x: e.clientX - 5,
                y: e.clientY - 5,
                duration: 0.1,
                ease: "power2.out"
            });
        });

        // hover effects
        hoverables.forEach(el => {
            el.addEventListener('mouseenter', () => {
                gsap.to(bigBall, { scale: 1.5, duration: 0.3 });
            });
            el.addEventListener('mouseleave', () => {
                gsap.to(bigBall, { scale: 1, duration: 0.3 });
            });
        });
    }
}

// try initializing immediately
if (document.body) {
    initCursor();
} else {
    document.addEventListener('DOMContentLoaded', initCursor);
}
