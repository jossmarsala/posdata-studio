/**
 * Contact Form — Posdata Studio
 * AJAX submit, client-side validation, GSAP animations, anti-bot honeypot
 */

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('contact-form');
    if (!form) return;


    // --- GSAP entry animations ---
    if (typeof gsap !== 'undefined') {
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: '.contact-section',
                start: 'top 75%',
                once: true
            }
        });

        tl.to('.contact-visual__img', { opacity: 1, y: 0, duration: 1, ease: 'power2.out' })
          .to('.contact-title',    { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }, '-=0.7')
          .to('.form-field',       { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', stagger: 0.1 }, '-=0.4')
          .to('.contact-submit-row', { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.2');
    } else {
        // Fallback: show everything immediately
        document.querySelectorAll('.contact-visual__img, .contact-title, .form-field, .contact-submit-row')
            .forEach(el => { el.style.opacity = '1'; el.style.transform = 'none'; });
    }

    // --- Form submission ---
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const btn = form.querySelector('.contact-submit-btn');
        const btnText = btn.querySelector('.submit-text');
        const originalText = btnText.textContent;

        // Client-side validation
        const name = form.querySelector('#contact-name').value.trim();
        const email = form.querySelector('#contact-email').value.trim();
        const message = form.querySelector('#contact-message').value.trim();

        if (!name || !email || !message) {
            showToast('Por favor, completá todos los campos.', 'error');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showToast('Ingresá un email válido.', 'error');
            return;
        }

        if (message.length < 10) {
            showToast('El mensaje es muy corto.', 'error');
            return;
        }

        // Disable button
        btn.disabled = true;
        btnText.textContent = 'Enviando...';

        try {
            const formData = new FormData(form);
            const response = await fetch('/api/contact', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (response.ok && data.success) {
                showToast('¡Mensaje enviado! Te responderemos pronto.', 'success');
                form.reset();
            } else {
                showToast(data.error || 'Hubo un error. Intentá de nuevo.', 'error');
            }
        } catch (err) {
            console.error('[contact.js]', err);
            showToast('Error de conexión. Intentá de nuevo.', 'error');
        } finally {
            btn.disabled = false;
            btnText.textContent = originalText;
        }
    });
});

function showToast(message, type) {
    // Remove existing toast
    const existing = document.querySelector('.contact-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `contact-toast contact-toast--${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            toast.classList.add('is-visible');
        });
    });

    setTimeout(() => {
        toast.classList.remove('is-visible');
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}
