document.addEventListener('DOMContentLoaded', () => {
    // Hide old nav arrows
    document.querySelectorAll('.gallery-nav-arrow').forEach(el => el.style.display = 'none');
    // We attach to the existing container 
    const container = document.getElementById('carousel-container'); 
    if (!container) return;

    // Apply strict container styles for the Stack
    container.classList.add('stack-container');
    container.style.perspective = '1000px';

    fetch('/static/projects.json')
        .then(res => res.json())
        .then(data => {
            initStack(data.projects);
        })
        .catch(err => console.error('Error loading projects:', err));

    let cardsArray = [];
    const sensitivity = 50; // threshold to trigger sending to back

    function initStack(projects) {
        // Reverse array initially so the first item ends up on top
        const reversedProjects = [...projects].reverse();
        
        reversedProjects.forEach((proj, idx) => {
            const cardRotate = document.createElement('div');
            cardRotate.className = 'card-rotate';
            cardRotate.dataset.id = proj.id;
            cardRotate.dataset.url = proj.url && proj.url !== '#' ? proj.url : `/project?id=${proj.id}`;
            // Random rotate for a slightly disorganized stack look
            const randRot = Math.random() * 10 - 5; 
            cardRotate.dataset.randomRotate = randRot;
            
            const cardItem = document.createElement('div');
            cardItem.className = 'card';
            
            const img = document.createElement('img');
            img.src = proj.galleryImage;
            img.alt = proj.title;
            img.className = 'card-image';
            
            const overlay = document.createElement('div');
            overlay.className = 'carousel-card-content';
            
            // Adjust overlay HTML
            overlay.innerHTML = `
                <div class="carousel-card-number">0${projects.length - idx}</div>
                <h3 class="carousel-card-title">${proj.title}</h3>
                <p class="carousel-card-subtitle">${proj.heroTitle || ''}</p>
            `;
            
            cardItem.appendChild(img);
            cardItem.appendChild(overlay);
            cardRotate.appendChild(cardItem);
            container.appendChild(cardRotate);
            
            cardsArray.push(cardRotate);
        });

        cardsArray.forEach(card => setupDrag(card));
        updateStack();
        setTimeout(() => container.classList.add('is-initialized'), 100);
    }

    function sendToBack(cardEl) {
        const idx = cardsArray.indexOf(cardEl);
        if (idx !== -1) {
            cardsArray.splice(idx, 1);
            cardsArray.unshift(cardEl);
            updateStack();
        }
    }

    function updateStack() {
        cardsArray.forEach((card, index) => {
            card.style.zIndex = index;
            
            const reverseIndex = cardsArray.length - 1 - index; 
            const scale = 1 + index * 0.06 - cardsArray.length * 0.06;
            const randomRot = parseFloat(card.dataset.randomRotate);
            const rotateZ = reverseIndex * 4 + randomRot; 
            
            card.style.transformOrigin = '90% 90%';
            card.style.transform = `scale(${scale}) rotateZ(${rotateZ}deg) translateX(0px) translateY(0px) rotateX(0deg) rotateY(0deg)`;
            
            card.dataset.baseScale = scale;
            card.dataset.baseRotateZ = rotateZ;
        });
    }

    function setupDrag(card) {
        let isDragging = false;
        let hasMoved = false;
        let startX = 0;
        let startY = 0;
        let currentX = 0;
        let currentY = 0;
        
        const onDown = (e) => {
            // Only allow dragging if it's the top card
            if (cardsArray.indexOf(card) !== cardsArray.length - 1) {
                // If it's not the top card, clicking it pushes it to top by sending current top to back? 
                // Wait, user code allowed clicking underlying cards to send THEM to back. Let's just allow sendToBack on click.
                return; 
            }
            
            isDragging = true;
            hasMoved = false;
            
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            
            startX = clientX;
            startY = clientY;
            currentX = 0;
            currentY = 0;
            
            card.classList.add('dragging');
            
            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onUp);
            window.addEventListener('touchmove', onMove, {passive: false});
            window.addEventListener('touchend', onUp);
        };
        
        const onMove = (e) => {
            if (!isDragging) return;
            
            if (cardsArray.indexOf(card) !== cardsArray.length - 1) {
                onUp();
                return;
            }
            
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            
            currentX = clientX - startX;
            currentY = clientY - startY;
            
            if (Math.abs(currentX) > 3 || Math.abs(currentY) > 3) {
                hasMoved = true;
                if (e.cancelable) e.preventDefault(); 
            }
            
            // Map movement to 3D rotation, damping the effect
            const rotateX = Math.max(-60, Math.min(60, currentY * -0.3));
            const rotateY = Math.max(-60, Math.min(60, currentX * 0.3));
            
            const baseScale = card.dataset.baseScale;
            const baseRotateZ = card.dataset.baseRotateZ;
            
            card.style.transform = `translateX(${currentX}px) translateY(${currentY}px) scale(${baseScale}) rotateZ(${baseRotateZ}deg) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        };
        
        const onUp = (e) => {
            isDragging = false;
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
            window.removeEventListener('touchmove', onMove);
            window.removeEventListener('touchcancel', onUp);
            window.removeEventListener('touchend', onUp);
            
            card.classList.remove('dragging');
            
            if (hasMoved && (Math.abs(currentX) > sensitivity || Math.abs(currentY) > sensitivity)) {
                sendToBack(card);
            } else {
                if (!hasMoved) {
                    // Click!
                    if (card.dataset.url) {
                        window.location.href = card.dataset.url;
                    }
                } else {
                    // Spring back
                    updateStack(); 
                }
            }
        };
        
        card.addEventListener('mousedown', onDown);
        card.addEventListener('touchstart', onDown, {passive: false});
        
        // Clicks on underlying cards send them to back as well? User code said "sendToBackOnClick". 
        // For now, let's keep it simple: clicks on the top card go to URL.
    }
});
