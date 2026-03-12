/**
 * Project Gallery Template Logic
 * Handles dynamic content loading and GSAP animations.
 */

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const projectId = params.get('id');

    if (!projectId) {
        showError('No se especificó un ID de proyecto.');
        return;
    }

    try {
        const response = await fetch('/static/projects.json');
        if (!response.ok) throw new Error('Falló la carga de datos.');

        const data = await response.json();
        const project = data.projects.find(p => p.id === projectId);

        if (!project) {
            showError(`No se encontró el proyecto: ${projectId}`);
            return;
        }

        renderProject(project);
        initLenis();
        initAnimations(project);

    } catch (error) {
        console.error(error);
        showError('Hubo un error al cargar la información del proyecto.');
    }
});

function showError(message) {
    const errorEl = document.getElementById('error-message');
    const contentEl = document.getElementById('project-content');
    if (errorEl && contentEl) {
        errorEl.querySelector('p').textContent = message;
        errorEl.style.display = 'flex';
        contentEl.style.display = 'none';
    }
}

function renderProject(project) {
    // 1. Hero Title
    const titleText = project.title;
    const firstLetter = titleText.charAt(0);
    const restOfTitle = titleText.slice(1);
    document.getElementById('hero-title').innerHTML = `<span class="retro-initial">${firstLetter}</span>${restOfTitle}`;
    document.title = `${titleText} - Posdata Studio`;

    // 1.5 Hero Description
    const descEl = document.getElementById('hero-description');
    if (descEl) {
        descEl.textContent = project.description || project.aboutText || "";
    }

    // 2. Mini Gallery
    const miniGallery = document.getElementById('mini-gallery');
    project.miniGallery.forEach(src => {
        const pic = document.createElement('picture');
        const img = document.createElement('img');
        img.src = src;
        img.alt = titleText;
        pic.appendChild(img);
        miniGallery.appendChild(pic);
    });

    // 3. Double Images
    const doubleImageContainer = document.getElementById('double-image');

    // If scrollPreview exists, it takes the FULL container — no other images rendered
    if (project.scrollPreview) {
        const previewItem = document.createElement('div');
        previewItem.className = 'double-image-item scroll-preview-full';

        const previewPic = document.createElement('picture');
        previewPic.classList.add('scroll-preview-card');

        const previewImg = document.createElement('img');
        previewImg.src = project.scrollPreview;
        previewImg.alt = 'Scroll preview';

        previewPic.appendChild(previewImg);
        previewItem.appendChild(previewPic);
        doubleImageContainer.appendChild(previewItem);
        return; // skip rendering doubleImages pairs
    }

    // No scrollPreview: render regular double image pairs
    project.doubleImages.forEach(pair => {
        const item = document.createElement('div');
        item.className = 'double-image-item';

        const pic = document.createElement('picture');

        const baseImg = document.createElement('img');
        baseImg.src = pair.base;
        baseImg.alt = 'Base layer';

        const overlayImg = document.createElement('img');
        overlayImg.src = pair.overlay;
        overlayImg.alt = 'Overlay layer';
        overlayImg.className = pair.overlayClass;

        pic.appendChild(baseImg);
        pic.appendChild(overlayImg);
        item.appendChild(pic);
        doubleImageContainer.appendChild(item);
    });

    // 4. About Text
    document.getElementById('about-text').textContent = project.aboutText;

    // 5. Fullscreen Images (rendered after about section)
    const fullscreenSection = document.getElementById('fullscreen-images');
    if (fullscreenSection && project.fullscreenImages && project.fullscreenImages.length > 0) {
        project.fullscreenImages.forEach(src => {
            const figure = document.createElement('figure');
            figure.className = 'fullscreen-image-item';

            const img = document.createElement('img');
            img.src = src;
            img.alt = titleText;

            figure.appendChild(img);
            fullscreenSection.appendChild(figure);
        });
    }
}

function initLenis() {
    const lenis = new Lenis();
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);
}

function initAnimations(project) {
    gsap.registerPlugin(ScrollTrigger, SplitText);

    // --- Hero Title Animation ---
    const h1El = document.getElementById('hero-title');
    gsap.fromTo(h1El, {
        opacity: 0,
        y: 50,
    }, {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power2.out'
    });

    // --- Core Scroll Animation ---
    const miniGalleryPictures = gsap.utils.toArray('.mini-gallery picture');
    const totalImages = miniGalleryPictures.length;
    const centerIndex = (totalImages - 1) / 2;

    ScrollTrigger.create({
        trigger: '.hero-section',
        start: 'top top',
        end: `+=${window.innerHeight * 4}px`,
        pin: true,
        pinSpacing: true,
        scrub: 1,
        onUpdate: (self) => {
            const progress = self.progress;

            if (progress <= 0.2) {
                // Phase 1: Reveal from center scale
                const scaleProgress = progress / 0.2;
                miniGalleryPictures.forEach((picture) => {
                    gsap.set(picture, {
                        scale: scaleProgress,
                        x: 0,
                        y: 0,
                        opacity: progress > 0 ? 1 : 0
                    });
                });
                gsap.set('.double-image', { scale: 0 });
                gsap.set('.top-move', { y: '0%' });
                gsap.set('.bottom-move', { y: '0%' });

            } else if (progress > 0.2 && progress <= 0.5) {
                // Phase 2: Expand to grid
                const expandProgress = (progress - 0.2) / 0.3;
                miniGalleryPictures.forEach((picture, index) => {
                    const distanceFromCenter = index - centerIndex;
                    gsap.set(picture, {
                        scale: 1,
                        x: distanceFromCenter * 100 * expandProgress,
                        y: distanceFromCenter * 100 * expandProgress,
                        opacity: 1
                    });
                });
                gsap.set('.double-image', { scale: 0 });

            } else if (progress > 0.5 && progress <= 0.7) {
                // Phase 3: Fly out and reveal double image
                const finalProgress = (progress - 0.5) / 0.2;
                miniGalleryPictures.forEach((picture, index) => {
                    const distanceFromCenter = index - centerIndex;
                    if (index < totalImages / 2) {
                        gsap.set(picture, {
                            scale: 1,
                            x: distanceFromCenter * 100 + (-350 - distanceFromCenter * 100) * finalProgress,
                            y: distanceFromCenter * 100 + (-350 - distanceFromCenter * 100) * finalProgress,
                            opacity: 1 - finalProgress
                        });
                    } else {
                        gsap.set(picture, {
                            scale: 1,
                            x: distanceFromCenter * 100 + (350 - distanceFromCenter * 100) * finalProgress,
                            y: distanceFromCenter * 100 + (350 - distanceFromCenter * 100) * finalProgress,
                            opacity: 1 - finalProgress
                        });
                    }
                });
                gsap.set('.double-image', { scale: finalProgress });

            } else if (progress > 0.7 && progress <= 0.8) {
                // Phase 4: Hold double image
                gsap.set('.double-image', { scale: 1 });
                gsap.set('.top-move', { y: '0%' });
                gsap.set('.bottom-move', { y: '0%' });

            } else if (progress > 0.8) {
                // Phase 5: Split double image
                const moveProgress = (progress - 0.8) / 0.2;
                gsap.set('.double-image', { scale: 1 });
                gsap.set('.top-move', {
                    opacity: 1 - moveProgress,
                    y: (-100 * moveProgress) + '%'
                });
                gsap.set('.bottom-move', {
                    opacity: 1 - moveProgress,
                    y: (100 * moveProgress) + '%'
                });
            }
        }
    });

    // --- About Section Text Animation ---
    const h2 = new SplitText('#about-text', { type: 'words' });
    h2.words.forEach((word, index) => {
        ScrollTrigger.create({
            trigger: '.about-section',
            start: `top+=${index * 25 - 250} top`,
            end: `+=${index * 25 - 150} top`,
            scrub: 2,
            animation: gsap.fromTo(word, { y: 100 }, { y: 0, ease: 'power2.inOut' })
        });
    });
}
