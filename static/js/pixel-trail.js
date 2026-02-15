import * as THREE from 'three';

class PixelTrailEffect {
    constructor(container) {
        this.container = container;
        this.canvas = null;
        this.renderer = null;
        this.scene = null;
        this.camera = null;
        this.material = null;
        this.trailCanvas = null;
        this.trailCtx = null;
        this.trailTexture = null;
        this.rafId = null;
        this.isActive = false;

        this.config = {
            gridSize: 100.0,
            trailSize: 3,       // Very thin (approx 1 "grid unit" or less)
            decay: 0.23,        // Low decay = Long tail ("Cola larga")
            pixelColor: new THREE.Color('#964015'),
            emitterOffset: { x: 12, y: 12 } // Bottom-right offset
        };

        // Initialize off-screen to prevent 0,0 masking at start
        this.mouse = { x: -1000, y: -1000 };
        // For shader uniform (0-1 space)
        this.mouseUv = new THREE.Vector2(-1000, -1000);

        this.init();
        this.bindEvents();
    }

    init() {
        if (!this.container) return;

        const width = this.container.offsetWidth;
        const height = this.container.offsetHeight;

        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(
            width / -2, width / 2,
            height / 2, height / -2,
            1, 1000
        );
        this.camera.position.z = 10;

        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        this.canvas = this.renderer.domElement;
        this.canvas.classList.add('pixel-trail-canvas');
        this.container.appendChild(this.canvas);

        this.initTrailTexture();
        this.initMaterial();

        const plane = new THREE.Mesh(
            new THREE.PlaneGeometry(width, height),
            this.material
        );
        this.scene.add(plane);

        window.addEventListener('resize', this.onResize.bind(this));
    }

    initTrailTexture() {
        this.trailCanvas = document.createElement('canvas');
        this.trailCanvas.width = 512;
        this.trailCanvas.height = 512;
        this.trailCtx = this.trailCanvas.getContext('2d');

        this.trailCtx.fillStyle = 'black';
        this.trailCtx.fillRect(0, 0, 512, 512);

        this.trailTexture = new THREE.CanvasTexture(this.trailCanvas);
        this.trailTexture.minFilter = THREE.LinearFilter;
        this.trailTexture.magFilter = THREE.LinearFilter;
    }

    initMaterial() {
        const vertexShader = `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;

        const fragmentShader = `
            uniform sampler2D mouseTrail;
            uniform float gridSize;
            uniform vec3 pixelColor;
            uniform vec2 uMouse;        // Mouse position in UV
            uniform float uGapRadius;   // Gap radius in UV
            uniform float uAspect;      // W/H aspect for proper circle
            
            varying vec2 vUv;

            void main() {
                // Pixelate
                vec2 gridUv = floor(vUv * gridSize) / gridSize;
                vec2 centerOffset = vec2(0.5 / gridSize); 
                vec2 sampleUv = gridUv + centerOffset;

                // Sample trail
                float trail = texture2D(mouseTrail, sampleUv).r;

                // Binary opacity
                float alpha = step(0.1, trail);

                // No mask needed if offset is sufficient, but keeping uniform structure valid
                gl_FragColor = vec4(pixelColor, alpha);
            }
        `;

        const width = this.container.offsetWidth;
        const height = this.container.offsetHeight;

        this.material = new THREE.ShaderMaterial({
            uniforms: {
                mouseTrail: { value: this.trailTexture },
                gridSize: { value: this.config.gridSize },
                pixelColor: { value: this.config.pixelColor },
                uMouse: { value: this.mouseUv },
                uGapRadius: { value: 0.0 }, // Disabled gap for offset implementation
                uAspect: { value: width / height }
            },
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            transparent: true,
        });
    }

    updateTrail() {
        const ctx = this.trailCtx;

        // 1. Decay
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = `rgba(0, 0, 0, ${this.config.decay})`;
        ctx.fillRect(0, 0, 512, 512);

        // 2. Draw Brush (Build History)
        if (this.mouse.x !== -1000) {
            const rect = this.container.getBoundingClientRect();

            // Apply Offset here (screen pixels)
            const emitterX = this.mouse.x + this.config.emitterOffset.x;
            const emitterY = this.mouse.y + this.config.emitterOffset.y;

            const pX = (emitterX - rect.left) / rect.width;
            const pY = (emitterY - rect.top) / rect.height;

            const texX = pX * 512;
            const texY = pY * 512;

            ctx.globalCompositeOperation = 'screen';
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(texX, texY, this.config.trailSize, 0, Math.PI * 2);
            ctx.fill();
        }

        this.trailTexture.needsUpdate = true;
    }

    render() {
        if (!this.isActive) return;

        this.updateTrail();
        this.renderer.render(this.scene, this.camera);
        this.rafId = requestAnimationFrame(this.render.bind(this));
    }

    start() {
        if (!this.isActive) {
            this.isActive = true;
            this.render();
        }
    }

    stop() {
        this.isActive = false;
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
        }
    }

    bindEvents() {
        window.addEventListener('mousemove', (e) => {
            if (this.isActive) {
                this.mouse.x = e.clientX;
                this.mouse.y = e.clientY;
            }
        });

        this.container.addEventListener('mouseenter', () => {
            this.start();
        });

        this.container.addEventListener('mouseleave', () => {
            this.mouse.x = -1000;
            this.mouse.y = -1000;
        });
    }

    onResize() {
        if (!this.container) return;
        const width = this.container.offsetWidth;
        const height = this.container.offsetHeight;

        this.renderer.setSize(width, height);

        this.camera.left = width / -2;
        this.camera.right = width / 2;
        this.camera.top = height / 2;
        this.camera.bottom = height / -2;
        this.camera.updateProjectionMatrix();

        if (this.material) {
            this.material.uniforms.uAspect.value = width / height;
        }

        const plane = this.scene.children[0];
        plane.geometry.dispose();
        plane.geometry = new THREE.PlaneGeometry(width, height);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.overlay-section');
    if (container) {
        new PixelTrailEffect(container);
    }
});
