/**
 * Infinite Loop Horizontal Carousel — "Trabajos" section
 * GSAP-driven drag + inertia. "Staircase" layout: center card is tallest,
 * cards get shorter toward edges. ALL cards bottom-aligned.
 * Project titles sit ABOVE each card (outside the image).
 */

document.addEventListener('DOMContentLoaded', () => {
    // Hide old nav arrows
    document.querySelectorAll('.gallery-nav-arrow').forEach(el => el.style.display = 'none');

    const wrapper = document.getElementById('carousel-container');
    if (!wrapper) return;

    // Clean up old classes
    wrapper.classList.remove('stack-container');
    wrapper.classList.add('loop-carousel');

    fetch('/static/projects.json')
        .then(res => res.json())
        .then(data => initCarousel(data.projects))
        .catch(err => console.error('Error loading projects:', err));

    /* ─────────────────── CONFIG ─────────────────── */
    const CARD_WIDTH = 340;
    const CARD_GAP = 24;
    const CARD_MAX_HEIGHT = 460;     // center card height
    const HEIGHT_STEP = 50;          // each step away from center loses this much height
    const SCALE_ACTIVE = 1;
    const SCALE_INACTIVE = 0.95;
    const OPACITY_ACTIVE = 1;
    const OPACITY_INACTIVE = 0.5;
    const HOVER_CYCLE_MS = 1300;
    const INERTIA_DURATION = 0.9;
    const SNAP_DURATION = 0.5;

    /* ─────────────────── STATE ─────────────────── */
    let trackOffset = 0;
    let cards = [];
    let realCount = 0;
    let totalSlotWidth = 0;
    let trackWidth = 0;
    let isDragging = false;
    let hasDragged = false;
    let dragStartX = 0;
    let dragStartOffset = 0;
    let velocity = 0;
    let lastDragX = 0;
    let lastDragTime = 0;
    let hoverIntervals = new Map();
    let activeIndex = -1;

    /* ─────────────────── RESPONSIVE CARD SIZE ─────────────────── */
    function getCardWidth() {
        const w = window.innerWidth;
        if (w <= 480) return 200;
        if (w <= 768) return 240;
        if (w <= 1024) return 300;
        return CARD_WIDTH;
    }

    function getCardMaxHeight() {
        const w = window.innerWidth;
        if (w <= 480) return 300;
        if (w <= 768) return 350;
        if (w <= 1024) return 400;
        return CARD_MAX_HEIGHT;
    }

    function getHeightStep() {
        const w = window.innerWidth;
        if (w <= 480) return 30;
        if (w <= 768) return 35;
        return HEIGHT_STEP;
    }

    function getCardGap() {
        const w = window.innerWidth;
        if (w <= 480) return 14;
        if (w <= 768) return 18;
        return CARD_GAP;
    }

    function recalcSlotWidth() {
        totalSlotWidth = getCardWidth() + getCardGap();
        trackWidth = totalSlotWidth * realCount;
    }

    /* ─────────────────── INIT ─────────────────── */
    function initCarousel(projects) {
        realCount = projects.length;
        recalcSlotWidth();

        // Build: [clone-set] [real-set] [clone-set]
        const allSets = [projects, projects, projects];

        allSets.forEach((set, setIdx) => {
            set.forEach((proj, idx) => {
                const globalIdx = setIdx * realCount + idx;
                const card = createCard(proj, idx, globalIdx);
                wrapper.appendChild(card);
                cards.push(card);
            });
        });

        // Start centered on the middle (real) set, first card
        const viewportW = wrapper.offsetWidth;
        trackOffset = -(trackWidth) + (viewportW / 2) - (getCardWidth() / 2);

        positionCards();
        updateFocus();

        // Bind events
        wrapper.addEventListener('mousedown', onDragStart);
        wrapper.addEventListener('touchstart', onDragStart, { passive: false });
        window.addEventListener('mousemove', onDragMove);
        window.addEventListener('touchmove', onDragMove, { passive: false });
        window.addEventListener('mouseup', onDragEnd);
        window.addEventListener('touchend', onDragEnd);

        window.addEventListener('resize', () => {
            recalcSlotWidth();
            positionCards();
            updateFocus();
        });

        setTimeout(() => wrapper.classList.add('is-initialized'), 150);

        // Show footer hint
        const footer = wrapper.closest('.gallery-interactive')?.querySelector('footer');
        if (footer) footer.style.opacity = '1';
    }

    /* ─────────────────── CARD CREATION ─────────────────── */
    function createCard(proj, localIdx, globalIdx) {
        // Outer wrapper — holds the title ABOVE and the image card BELOW
        const outer = document.createElement('div');
        outer.className = 'lc-card-outer';
        outer.dataset.url = proj.url && proj.url !== '#' ? proj.url : `/project?id=${proj.id}`;
        outer.dataset.localIdx = localIdx;
        outer.dataset.globalIdx = globalIdx;
        outer.dataset.projectId = proj.id;

        // Title label above the card
        const titleLabel = document.createElement('div');
        titleLabel.className = 'lc-card-label';
        titleLabel.innerHTML = `<span class="lc-card-label__radio"></span><span class="lc-card-label__name">${proj.title}</span>`;
        outer.appendChild(titleLabel);

        // Card inner (the image area)
        const card = document.createElement('div');
        card.className = 'lc-card';

        // Determine images for hover cycling
        const images = (proj.miniGallery && proj.miniGallery.length > 0)
            ? proj.miniGallery
            : [proj.galleryImage];
        outer.dataset.images = JSON.stringify(images);

        // Image stack
        const imgStack = document.createElement('div');
        imgStack.className = 'lc-card__images';

        images.forEach((src, i) => {
            const img = document.createElement('img');
            img.src = src;
            img.alt = proj.title;
            img.className = 'lc-card__img' + (i === 0 ? ' lc-card__img--active' : '');
            img.draggable = false;
            imgStack.appendChild(img);
        });

        card.appendChild(imgStack);

        outer.appendChild(card);

        // Hover image cycling
        outer.addEventListener('mouseenter', () => startHoverCycle(outer));
        outer.addEventListener('mouseleave', () => stopHoverCycle(outer));

        return outer;
    }

    /* ─────────────────── POSITIONING ─────────────────── */
    function positionCards() {
        const cw = getCardWidth();
        const maxH = getCardMaxHeight();
        const hStep = getHeightStep();
        const gap = getCardGap();
        const slot = cw + gap;
        const viewportCenter = wrapper.offsetWidth / 2;

        cards.forEach((outer, i) => {
            const x = trackOffset + i * slot;
            const cardCenter = x + cw / 2;
            const distFromCenter = Math.abs(cardCenter - viewportCenter);

            // Staircase: height decreases the further from center
            const steps = Math.min(Math.floor(distFromCenter / slot), 4);
            const cardHeight = Math.max(maxH - steps * hStep, maxH * 0.55);

            // Set outer position (bottom-aligned: positioned from the bottom of the container)
            gsap.set(outer, {
                x: x,
                width: cw,
                force3D: true
            });

            // Set card inner height
            const cardInner = outer.querySelector('.lc-card');
            if (cardInner) {
                gsap.set(cardInner, {
                    height: cardHeight
                });
            }
        });
    }

    /* ─────────────────── INFINITE LOOP WRAPPING ─────────────────── */
    function wrapOffset() {
        const slot = getCardWidth() + getCardGap();
        const tw = slot * realCount;
        const minBound = -(tw * 2) + wrapper.offsetWidth / 2;
        const maxBound = wrapper.offsetWidth / 2;

        if (trackOffset < minBound) {
            trackOffset += tw;
        } else if (trackOffset > maxBound) {
            trackOffset -= tw;
        }
    }

    /* ─────────────────── FOCUS (CENTER MODE) ─────────────────── */
    function updateFocus() {
        const cw = getCardWidth();
        const gap = getCardGap();
        const slot = cw + gap;
        const maxH = getCardMaxHeight();
        const hStep = getHeightStep();
        const viewportCenter = wrapper.offsetWidth / 2;
        let closestIdx = 0;
        let closestDist = Infinity;

        cards.forEach((outer, i) => {
            const cardCenterX = trackOffset + i * slot + cw / 2;
            const dist = Math.abs(cardCenterX - viewportCenter);

            if (dist < closestDist) {
                closestDist = dist;
                closestIdx = i;
            }

            // Scale & opacity based on distance
            const maxDist = slot * 2;
            const t = Math.min(dist / maxDist, 1);

            const scale = SCALE_ACTIVE + (SCALE_INACTIVE - SCALE_ACTIVE) * t;
            const opacity = OPACITY_ACTIVE + (OPACITY_INACTIVE - OPACITY_ACTIVE) * t;

            // Height staircase based on distance
            const steps = Math.min(dist / slot, 4);
            const cardHeight = Math.max(maxH - steps * hStep, maxH * 0.55);

            gsap.to(outer, {
                scale: scale,
                opacity: opacity,
                duration: isDragging ? 0.1 : 0.35,
                ease: 'power2.out',
                overwrite: 'auto'
            });

            const cardInner = outer.querySelector('.lc-card');
            if (cardInner) {
                gsap.to(cardInner, {
                    height: cardHeight,
                    duration: isDragging ? 0.1 : 0.35,
                    ease: 'power2.out',
                    overwrite: 'auto'
                });
            }
        });

        // Toggle active class
        if (closestIdx !== activeIndex) {
            if (activeIndex >= 0 && activeIndex < cards.length) {
                cards[activeIndex].classList.remove('lc-card-outer--active');
            }
            activeIndex = closestIdx;
            cards[activeIndex].classList.add('lc-card-outer--active');

            // Update subtitle number
            const numEl = wrapper.closest('.gallery-interactive')?.querySelector('.subtitle-number');
            if (numEl) {
                const localIdx = parseInt(cards[activeIndex].dataset.localIdx);
                numEl.textContent = String(localIdx + 1).padStart(2, '0');
            }
        }
    }

    /* ─────────────────── DRAG ─────────────────── */
    function onDragStart(e) {
        if (e.target.closest('.lc-card__close')) return;

        isDragging = true;
        hasDragged = false;
        wrapper.classList.add('is-dragging');

        gsap.killTweensOf(trackState);

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        dragStartX = clientX;
        dragStartOffset = trackOffset;
        lastDragX = clientX;
        lastDragTime = Date.now();
        velocity = 0;
    }

    function onDragMove(e) {
        if (!isDragging) return;
        if (e.cancelable) e.preventDefault();

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const dx = clientX - dragStartX;

        if (Math.abs(dx) > 3) hasDragged = true;

        trackOffset = dragStartOffset + dx;

        // Calculate velocity
        const now = Date.now();
        const dt = now - lastDragTime;
        if (dt > 0) {
            velocity = (clientX - lastDragX) / dt * 16;
        }
        lastDragX = clientX;
        lastDragTime = now;

        wrapOffset();
        positionCards();
        updateFocus();
    }

    const trackState = { value: 0 };

    function onDragEnd(e) {
        if (!isDragging) return;
        isDragging = false;
        wrapper.classList.remove('is-dragging');

        const clampedVelocity = Math.max(-30, Math.min(30, velocity));

        if (Math.abs(clampedVelocity) < 0.5) {
            snapToNearest();
            return;
        }

        const inertiaDistance = clampedVelocity * 25;
        const targetOffset = trackOffset + inertiaDistance;

        trackState.value = trackOffset;

        gsap.to(trackState, {
            value: targetOffset,
            duration: INERTIA_DURATION,
            ease: 'power3.out',
            onUpdate: () => {
                trackOffset = trackState.value;
                wrapOffset();
                positionCards();
                updateFocus();
            },
            onComplete: () => {
                snapToNearest();
            }
        });
    }

    function snapToNearest() {
        const cw = getCardWidth();
        const gap = getCardGap();
        const slot = cw + gap;
        const viewportCenter = wrapper.offsetWidth / 2;

        let bestIdx = 0;
        let bestDist = Infinity;

        cards.forEach((card, i) => {
            const cardCenter = trackOffset + i * slot + cw / 2;
            const dist = Math.abs(cardCenter - viewportCenter);
            if (dist < bestDist) {
                bestDist = dist;
                bestIdx = i;
            }
        });

        const targetOffset = viewportCenter - bestIdx * slot - cw / 2;

        trackState.value = trackOffset;

        gsap.to(trackState, {
            value: targetOffset,
            duration: SNAP_DURATION,
            ease: 'power2.out',
            onUpdate: () => {
                trackOffset = trackState.value;
                wrapOffset();
                positionCards();
                updateFocus();
            },
            onComplete: () => {
                wrapOffset();
                positionCards();
                updateFocus();
            }
        });
    }

    /* ─────────────────── CLICK ─────────────────── */
    wrapper.addEventListener('click', (e) => {
        if (hasDragged) return;

        const outer = e.target.closest('.lc-card-outer');
        if (!outer) return;

        if (e.target.closest('.lc-card__close')) return;

        if (outer.classList.contains('lc-card-outer--active')) {
            const url = outer.dataset.url;
            if (url) window.location.href = url;
        } else {
            // Snap to clicked card
            const idx = cards.indexOf(outer);
            if (idx >= 0) {
                const cw = getCardWidth();
                const gap = getCardGap();
                const slot = cw + gap;
                const viewportCenter = wrapper.offsetWidth / 2;
                const targetOffset = viewportCenter - idx * slot - cw / 2;

                trackState.value = trackOffset;
                gsap.to(trackState, {
                    value: targetOffset,
                    duration: 0.6,
                    ease: 'power2.out',
                    onUpdate: () => {
                        trackOffset = trackState.value;
                        wrapOffset();
                        positionCards();
                        updateFocus();
                    }
                });
            }
        }
    });

    /* ─────────────────── HOVER IMAGE CYCLING ─────────────────── */
    function startHoverCycle(outer) {
        const images = outer.querySelectorAll('.lc-card__img');
        if (images.length <= 1) return;

        let currentIdx = 0;
        images.forEach((img, i) => {
            if (img.classList.contains('lc-card__img--active')) currentIdx = i;
        });

        const interval = setInterval(() => {
            images[currentIdx].classList.remove('lc-card__img--active');
            currentIdx = (currentIdx + 1) % images.length;
            images[currentIdx].classList.add('lc-card__img--active');
        }, HOVER_CYCLE_MS);

        hoverIntervals.set(outer, interval);
    }

    function stopHoverCycle(outer) {
        const interval = hoverIntervals.get(outer);
        if (interval) {
            clearInterval(interval);
            hoverIntervals.delete(outer);
        }
    }
});
