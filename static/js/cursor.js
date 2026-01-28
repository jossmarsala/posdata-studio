// Initialize cursor immediately if possible
function initCursor() {
    const bigBall = document.querySelector('.cursorball--big');
    const smallBall = document.querySelector('.cursorball--small');
    const hoverables = document.querySelectorAll('a, button, .hover-trigger');

    // Only run if elements exist
    if (bigBall && smallBall) {
        // Move cursor balls
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

        // Hover effects (optional bit of polish based on common cursor behaviors)
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

// Try initializing immediately
if (document.body) {
    initCursor();
} else {
    document.addEventListener('DOMContentLoaded', initCursor);
}
