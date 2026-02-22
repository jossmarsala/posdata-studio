class CustomCursor {
    constructor() {
        this.ctx = {
            lotus: null,
            circle: null,
            pixel: null,
            overlay: null,
            mouse: { x: -100, y: -100 },
            circlePos: { x: -100, y: -100 },
            isInsideOverlay: false
        };

        this.init();
    }

    init() {
        this.createElements();
        this.ctx.overlay = document.querySelector('.overlay-section');
        this.bindEvents();
        this.loop();
    }

    createElements() {
        document.querySelectorAll('.custom-cursor').forEach(el => el.remove());

        this.ctx.lotus = document.createElement('img');
        this.ctx.lotus.src = '/static/assets/images/cursor/lotus-cursor.svg';
        this.ctx.lotus.className = 'custom-cursor cursor-lotus';
        document.body.appendChild(this.ctx.lotus);

        this.ctx.circle = document.createElement('img');
        this.ctx.circle.src = '/static/assets/images/cursor/circle-cursor.svg';
        this.ctx.circle.className = 'custom-cursor cursor-circle';
        document.body.appendChild(this.ctx.circle);

        this.ctx.pixel = document.createElement('img');
        this.ctx.pixel.src = '/static/assets/images/cursor/cursor-pixel.svg';
        this.ctx.pixel.className = 'custom-cursor cursor-pixel-dom u-hidden';
        document.body.appendChild(this.ctx.pixel);
    }

    bindEvents() {
        window.addEventListener('mousemove', (e) => {
            this.ctx.mouse.x = e.clientX;
            this.ctx.mouse.y = e.clientY;

            let isInside = false;

            if (this.ctx.overlay) {
                const rect = this.ctx.overlay.getBoundingClientRect();
                if (
                    e.clientX >= rect.left &&
                    e.clientX <= rect.right &&
                    e.clientY >= rect.top &&
                    e.clientY <= rect.bottom
                ) {
                    isInside = true;
                }
            }

            this.ctx.isInsideOverlay = isInside;

        }, { passive: true });
    }

    loop() {
        requestAnimationFrame(this.loop.bind(this));

        const { lotus, circle, pixel, mouse, circlePos, isInsideOverlay } = this.ctx;

        if (isInsideOverlay) {
            // --- MODE: PIXEL (Overlay) ---

            if (lotus) lotus.classList.add('u-hidden');
            if (circle) circle.classList.add('u-hidden');

            if (pixel) {
                pixel.classList.remove('u-hidden');
                pixel.style.transform = `translate(${mouse.x}px, ${mouse.y}px) translate(-50%, -50%)`;
            }

        } else {
            // --- MODE: LOTUS (Global) ---

            if (pixel) pixel.classList.add('u-hidden');

            if (lotus) {
                lotus.classList.remove('u-hidden');
                lotus.style.transform = `translate(${mouse.x}px, ${mouse.y}px) translate(-50%, -50%)`;
            }
            if (circle) circle.classList.remove('u-hidden');

            const ease = 0.15;
            circlePos.x += (mouse.x - circlePos.x) * ease;
            circlePos.y += (mouse.y - circlePos.y) * ease;

            const dist = Math.hypot(mouse.x - circlePos.x, mouse.y - circlePos.y);
            if (dist > 300) {
                circlePos.x = mouse.x;
                circlePos.y = mouse.y;
            }

            if (circle) {
                circle.style.transform = `translate(${circlePos.x}px, ${circlePos.y}px) translate(-50%, -50%)`;
            }
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new CustomCursor());
} else {
    new CustomCursor();
}
