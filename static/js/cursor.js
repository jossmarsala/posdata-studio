class CustomCursor {
    constructor() {
        this.ctx = {
            lotus: null,
            circle: null,
            pixel: null, // New DOM element for pixel cursor
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

        // Lotus
        this.ctx.lotus = document.createElement('img');
        this.ctx.lotus.src = '/static/assets/images/cursor/lotus-cursor.svg';
        this.ctx.lotus.className = 'custom-cursor cursor-lotus';
        document.body.appendChild(this.ctx.lotus);

        // Circle
        this.ctx.circle = document.createElement('img');
        this.ctx.circle.src = '/static/assets/images/cursor/circle-cursor.svg';
        this.ctx.circle.className = 'custom-cursor cursor-circle';
        document.body.appendChild(this.ctx.circle);

        // Pixel (DOM Element - The "God Mode" Fix)
        // Replaces browser 'cursor: url(...)' to prevent disappearing
        this.ctx.pixel = document.createElement('img');
        this.ctx.pixel.src = '/static/assets/images/cursor/cursor-pixel.svg';
        this.ctx.pixel.className = 'custom-cursor cursor-pixel-dom';
        // Add specific style here or in CSS?
        // Let's ensure it has basic styles to match logic
        this.ctx.pixel.style.width = '40px'; // pixel cursor size (User requested larger)
        this.ctx.pixel.style.height = '40px';
        this.ctx.pixel.style.display = 'none'; // hidden initially
        document.body.appendChild(this.ctx.pixel);
    }

    bindEvents() {
        window.addEventListener('mousemove', (e) => {
            this.ctx.mouse.x = e.clientX;
            this.ctx.mouse.y = e.clientY;

            // GEOMETRIC CHECK
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

            // 1. Hide Lotus/Circle
            if (lotus) lotus.style.display = 'none';
            if (circle) circle.style.display = 'none';

            // 2. Show & Update Pixel
            if (pixel) {
                pixel.style.display = 'block';
                // No lerp for pixel cursor (snappy)
                // Offset might be needed if user wants top-left?
                // Default system cursor is top-left.
                // Our .custom-cursor CSS has transform: translate(-50%, -50%).
                // If we want it to feel like a pointer, we might want translate(0,0)?
                // Let's stick to centering for now unless it feels off.
                // actually pixel cursor usually pointer top-left.
                // Let's override transform for pixel?
                // CSS approach: .cursor-pixel-dom { transform: none !important; margin-top: ... }
                // Or handle here with fixed offset.
                // Let's just center it for now as per "cursor-pixel.svg" being a whole icon.
                pixel.style.transform = `translate(${mouse.x}px, ${mouse.y}px) translate(-50%, -50%)`;
            }

        } else {
            // --- MODE: LOTUS (Global) ---

            // 1. Hide Pixel
            if (pixel) pixel.style.display = 'none';

            // 2. Show Lotus/Circle
            if (lotus) {
                lotus.style.display = 'block';
                lotus.style.transform = `translate(${mouse.x}px, ${mouse.y}px) translate(-50%, -50%)`;
            }
            if (circle) circle.style.display = 'block';

            // 3. Lerp Circle
            const ease = 0.15;
            circlePos.x += (mouse.x - circlePos.x) * ease;
            circlePos.y += (mouse.y - circlePos.y) * ease;

            // Snap detection (if jump is huge, e.g. entering page)
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
