/**
 * Project Gallery Template Logic
 * Handles dynamic content loading and GSAP animations.
 */

document.addEventListener('DOMContentLoaded', async () => {
    // Support both URL formats:
    //   /projects/gypsy-joyas  (path-based, Flask dynamic route)
    //   /project?id=gypsy-joyas (query string fallback)
    const pathMatch = window.location.pathname.match(/\/projects\/([^\/]+)/);
    const params = new URLSearchParams(window.location.search);
    const projectId = (pathMatch && pathMatch[1]) || params.get('id');

    if (!projectId) {
        showError('No se especificó un ID de proyecto.');
        return;
    }

    // Phase 1: Fetch + find project
    let project;
    try {
        const response = await fetch('/static/projects.json');
        if (!response.ok) throw new Error(`Fetch falló: ${response.status}`);
        const data = await response.json();
        project = data.projects.find(p => p.id === projectId);
        if (!project) {
            showError(`No se encontró el proyecto: "${projectId}"`);
            return;
        }
    } catch (error) {
        console.error('[project.js] Error en fetch:', error);
        showError(`Error cargando datos: ${error.message}`);
        return;
    }

    // Phase 2: Render DOM — always runs, stops on failure
    try {
        renderProject(project);
    } catch (error) {
        console.error('[project.js] Error en renderProject:', error);
        showError(`Error al renderizar: ${error.message}`);
        return;
    }

    // Phase 3: Lenis smooth scroll — optional
    try {
        if (typeof Lenis !== 'undefined' && typeof gsap !== 'undefined') {
            initLenis();
        } else {
            console.warn('[project.js] Lenis/GSAP no disponibles, omitiendo scroll suave.');
        }
    } catch (error) {
        console.warn('[project.js] initLenis falló (no crítico):', error.message);
    }

    // Phase 4: GSAP animations — optional
    try {
        if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
            initAnimations(project);
        } else {
            console.warn('[project.js] GSAP/ScrollTrigger no disponibles, omitiendo animaciones.');
        }
    } catch (error) {
        console.warn('[project.js] initAnimations falló (no crítico):', error.message);
    }
});

function showError(message) {
    const errorEl = document.getElementById('error-message');
    const contentEl = document.getElementById('project-content');
    if (errorEl) {
        const pEl = errorEl.querySelector('p');
        if (pEl) pEl.textContent = message;
        errorEl.style.display = 'flex';
    }
    if (contentEl) {
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

        // Longscreen animated image
        const previewImg = document.createElement('img');
        previewImg.src = project.scrollPreview;
        previewImg.alt = 'Scroll preview';
        previewPic.appendChild(previewImg);

        // Overlay dashboardscreen image
        if (project.fullscreenImages && project.fullscreenImages.length > 0) {
            const overlayImg = document.createElement('img');
            overlayImg.src = project.fullscreenImages[0];
            overlayImg.alt = 'Dashboard overlay';
            overlayImg.classList.add('scroll-preview-overlay');
            previewPic.appendChild(overlayImg);
        }

        previewItem.appendChild(previewPic);
        doubleImageContainer.appendChild(previewItem);
    } else {
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
    }

    // 3.5 Static Gallery (recap of the 6 mini gallery images)
    const staticGallery = document.getElementById('static-gallery');
    if (staticGallery && project.miniGallery && project.miniGallery.length > 0) {
        project.miniGallery.forEach(src => {
            const figure = document.createElement('figure');
            figure.className = 'static-gallery-item';

            const img = document.createElement('img');
            img.src = src;
            img.alt = titleText;

            const figcaption = document.createElement('figcaption');
            // Generate simple caption from filename (e.g., "uifooter" -> "UI FOOTER")
            let rawName = src.split('/').pop().split('.')[0];
            if (rawName.includes('__')) rawName = rawName.split('__')[1];
            
            // Basic formatting to look like "UI FOOTER" or "RESPONSIVE MOCKUP"
            let captionText = rawName
                .replace(/([A-Z])/g, ' $1')      // Add space before capitals
                .replace(/([a-z])([A-Z])/g, '$1 $2') 
                .replace(/-/g, ' ')              // Replace dashes
                .trim()
                .toUpperCase();
            
            // Hardcode some nicer spaces if it stays glued (e.g. uifooter => UI FOOTER)
            if (captionText === 'UIFOOTER') captionText = 'UI FOOTER';
            if (captionText === 'RESPONSIVEMOCKUP') captionText = 'RESPONSIVE MOCKUP';
            if (captionText === 'DESIGNTECHNICAL') captionText = 'DESIGN TECHNICAL';
            if (captionText === 'MOCKUPPHONE') captionText = 'MOCKUP PHONE';
            if (captionText === 'DESIGNSYSTEM') captionText = 'DESIGN SYSTEM';

            figcaption.textContent = captionText || titleText.toUpperCase();

            figure.appendChild(img);
            figure.appendChild(figcaption);
            staticGallery.appendChild(figure);
        });
    }

    // 4. Project Overview block
    const overviewSection = document.getElementById('project-overview');
    if (overviewSection && project.caseStudy && project.caseStudy.overview) {
        overviewSection.innerHTML = `
            <div class="cs-container">
                <div class="cs-block cs-overview">
                    <h3 class="cs-heading">PROJECT OVERVIEW</h3>
                    <p class="cs-text">${project.caseStudy.overview}</p>
                </div>
            </div>
        `;
    }

    // 5. Tech Stack (Case Study) block
    const caseStudySection = document.getElementById('case-study');
    if (caseStudySection && project.caseStudy && project.caseStudy.technologies && project.caseStudy.technologies.length > 0) {
        caseStudySection.innerHTML = `
            <div class="cs-container">
                <div class="cs-block cs-tech-stack">
                    <h3 class="cs-heading">TOOLS / TECHNOLOGIES</h3>
                    <ul class="cs-tech-list">
                        ${project.caseStudy.technologies.map(tech => `
                            <li>
                                <span class="cs-tech-label">${tech.label}</span>
                                <span class="cs-tech-value">${tech.value}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </div>
        `;
    }
}

function initLenis() {
    const lenis = new Lenis();
    lenis.on('scroll', () => {
        if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.update();
    });
    gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);
}

function initAnimations(project) {
    // Register only what's available — SplitText is not reliable as a CDN global
    const pluginsToRegister = [ScrollTrigger].filter(Boolean);
    if (typeof SplitText !== 'undefined') pluginsToRegister.push(SplitText);
    gsap.registerPlugin(...pluginsToRegister);

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
                // Phase 5: Split double image OR reveal preview overlay
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

                // Show the overlay image via CSS transition
                document.querySelectorAll('.scroll-preview-overlay').forEach(el => {
                    el.classList.add('is-visible');
                });
            }

            // Hide the overlay image if we scroll back up
            if (progress <= 0.8) {
                document.querySelectorAll('.scroll-preview-overlay').forEach(el => {
                    el.classList.remove('is-visible');
                });
            }
        }
    });
}
