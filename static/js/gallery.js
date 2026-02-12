import * as THREE from "three";

const settings = {
    fisheyeStrength: 1.0,
    vignetteStart: 0.3,
    vignetteEnd: 0.8,
    fisheyeRadius: 0.8,
    chromaticAberration: 0.015,
    noiseIntensity: 0.08,
    vignetteIntensity: 0.32,
    mouseEffect: 0.02,
    mouseRadius: 0.3,
    animationDuration: 0.64,
    canvasOpacity: 1.0
};

const allEffects = [];
const allImageEffects = [];

// Optimized resize handling
const resizeHandlers = new Map();
let resizeTimeout = null;

function handleGlobalResize() {
    if (resizeTimeout) clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        resizeHandlers.forEach((handler) => handler());
    }, 16);
}

window.addEventListener("resize", handleGlobalResize);

function createVignetteFisheyeDistortion(canvas, imageUrl) {
    return new Promise((resolve) => {
        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

        let renderer;
        let material;

        try {
            renderer = new THREE.WebGLRenderer({
                canvas: canvas,
                alpha: true,
                premultipliedAlpha: false,
                antialias: true
            });
        } catch (e) {
            resolve(null);
            return;
        }

        function updateCanvasSize() {
            const container = canvas.parentElement;
            if (!container) return;

            const rect = container.getBoundingClientRect();
            const width = Math.max(1, Math.floor(rect.width));
            const height = Math.max(1, Math.floor(rect.height));

            canvas.style.width = "100%";
            canvas.style.height = "100%";
            canvas.style.position = "absolute";
            canvas.style.top = "0";
            canvas.style.left = "0";

            const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

            renderer.setSize(width, height);
            renderer.setPixelRatio(pixelRatio);

            if (material && material.uniforms) {
                material.uniforms.uAspectRatio.value = width / height;
            }
        }

        const textureLoader = new THREE.TextureLoader();
        textureLoader.crossOrigin = "anonymous";

        textureLoader.load(
            imageUrl,
            (texture) => {
                const geometry = new THREE.PlaneGeometry(2, 2);

                texture.wrapS = THREE.ClampToEdgeWrapping;
                texture.wrapT = THREE.ClampToEdgeWrapping;
                texture.minFilter = THREE.LinearFilter;
                texture.magFilter = THREE.LinearFilter;

                material = new THREE.ShaderMaterial({
                    uniforms: {
                        uTexture: { value: texture },
                        uTime: { value: 0 },
                        uFisheyeIntensity: { value: 0 },
                        uFisheyeStrength: { value: settings.fisheyeStrength },
                        uVignetteStart: { value: settings.vignetteStart },
                        uVignetteEnd: { value: settings.vignetteEnd },
                        uFisheyeRadius: { value: settings.fisheyeRadius },
                        uChromaticAberration: { value: settings.chromaticAberration },
                        uNoiseIntensity: { value: settings.noiseIntensity },
                        uVignetteIntensity: { value: settings.vignetteIntensity },
                        uMouseEffect: { value: settings.mouseEffect },
                        uMouseRadius: { value: settings.mouseRadius },
                        uMouse: { value: new THREE.Vector2(0, 0) },
                        uAspectRatio: { value: 1 }
                    },
                    vertexShader: `
                        varying vec2 vUv;
                        void main() {
                            vUv = uv;
                            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                        }
                    `,
                    fragmentShader: `
                        uniform sampler2D uTexture;
                        uniform float uTime;
                        uniform float uFisheyeIntensity;
                        uniform float uFisheyeStrength;
                        uniform float uVignetteStart;
                        uniform float uVignetteEnd;
                        uniform float uFisheyeRadius;
                        uniform float uChromaticAberration;
                        uniform float uNoiseIntensity;
                        uniform float uVignetteIntensity;
                        uniform float uMouseEffect;
                        uniform float uMouseRadius;
                        uniform vec2 uMouse;
                        uniform float uAspectRatio;
                        varying vec2 vUv;
                        
                        vec4 sampleTextureSafe(sampler2D tex, vec2 uv) {
                            vec2 clampedUV = clamp(uv, 0.001, 0.999);
                            if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
                                vec2 edgeUV = clamp(uv, 0.0, 1.0);
                                vec4 edgeColor = texture2D(tex, edgeUV);
                                float fadeX = 1.0 - smoothstep(0.0, 0.1, abs(uv.x - clamp(uv.x, 0.0, 1.0)));
                                float fadeY = 1.0 - smoothstep(0.0, 0.1, abs(uv.y - clamp(uv.y, 0.0, 1.0)));
                                return edgeColor * fadeX * fadeY;
                            }
                            return texture2D(tex, clampedUV);
                        }
                        
                        vec2 fisheyeDistortion(vec2 uv, float intensity) {
                            vec2 center = vec2(0.5, 0.5);
                            vec2 delta = uv - center;
                            delta.x *= uAspectRatio;
                            float distance = length(delta);
                            
                            if (distance < uFisheyeRadius && distance > 0.0) {
                                float percent = distance / uFisheyeRadius;
                                float theta = percent * percent * intensity * uFisheyeStrength;
                                float beta = max(0.00001, distance);
                                delta = delta / beta * tan(theta) * beta;
                            }
                            
                            delta.x /= uAspectRatio;
                            return center + delta;
                        }
                        
                        void main() {
                            vec2 uv = vUv;
                            vec2 center = vec2(0.5, 0.5);
                            vec2 delta = uv - center;
                            delta.x *= uAspectRatio;
                            float distanceFromCenter = length(delta);
                            
                            float vignetteMask = smoothstep(uVignetteStart, uVignetteEnd, distanceFromCenter);
                            
                            vec2 finalUV = uv;
                            
                            if (uFisheyeIntensity > 0.001) {
                                vec2 distortedUV = fisheyeDistortion(uv, uFisheyeIntensity);
                                finalUV = mix(uv, distortedUV, vignetteMask);
                                
                                vec2 mousePos = uMouse * 0.5 + 0.5;
                                float mouseDist = distance(uv, mousePos);
                                float mouseEffectStrength = smoothstep(uMouseRadius, 0.0, mouseDist) * uFisheyeIntensity * uMouseEffect;
                                vec2 mouseDistortion = normalize(uv - mousePos) * mouseEffectStrength;
                                finalUV += mouseDistortion;
                            }
                            
                            vec3 color;
                            
                            if (uFisheyeIntensity > 0.001) {
                                vec2 direction = normalize(finalUV - vec2(0.5));
                                float aberrationStrength = uChromaticAberration * uFisheyeIntensity;
                                
                                float r = sampleTextureSafe(uTexture, finalUV + direction * aberrationStrength).r;
                                float g = sampleTextureSafe(uTexture, finalUV).g;
                                float b = sampleTextureSafe(uTexture, finalUV - direction * aberrationStrength).b;
                                color = vec3(r, g, b);
                            } else {
                                color = sampleTextureSafe(uTexture, finalUV).rgb;
                            }
                            
                            if (uFisheyeIntensity > 0.001) {
                                float noise = fract(sin(dot(uv * uTime * 0.05, vec2(12.9898, 78.233))) * 43758.5453) * uNoiseIntensity * uFisheyeIntensity;
                                color += noise;
                            }
                            
                            float vignetteEffect = 1.0 - smoothstep(uVignetteStart, uVignetteEnd, distanceFromCenter) * uVignetteIntensity;
                            color *= vignetteEffect;
                            
                            gl_FragColor = vec4(color, 1.0);
                        }
                    `,
                    transparent: true
                });

                const mesh = new THREE.Mesh(geometry, material);
                scene.add(mesh);

                updateCanvasSize();

                const resizeHandler = () => updateCanvasSize();
                resizeHandlers.set(canvas, resizeHandler);

                const resizeObserver = new ResizeObserver((entries) => {
                    for (let entry of entries) {
                        const { width, height } = entry.contentRect;
                        if (width > 0 && height > 0) {
                            updateCanvasSize();
                        }
                    }
                });
                resizeObserver.observe(canvas.parentElement || canvas);

                let animationId;
                let time = 0;
                let mouseX = 0;
                let mouseY = 0;

                const effect = {
                    currentTween: null,
                    _fisheyeIntensity: 0,
                    material: material,
                    start() {
                        if (this.currentTween) this.currentTween.kill();
                        this.currentTween = gsap.to(this, {
                            _fisheyeIntensity: 1,
                            duration: 0.64,
                            ease: "cubic-bezier(0.23, 1, 0.32, 1)",
                            onComplete: () => (this.currentTween = null)
                        });
                    },
                    stop() {
                        if (this.currentTween) this.currentTween.kill();
                        this.currentTween = gsap.to(this, {
                            _fisheyeIntensity: 0,
                            duration: 0.64,
                            ease: "cubic-bezier(0.23, 1, 0.32, 1)",
                            onComplete: () => (this.currentTween = null)
                        });
                    },
                    dispose() {
                        if (this.currentTween) this.currentTween.kill();
                        canvas.removeEventListener("mousemove", handleMouseMove);
                        resizeHandlers.delete(canvas);
                        resizeObserver.disconnect();
                        if (animationId) cancelAnimationFrame(animationId);
                        geometry.dispose();
                        this.material.dispose();
                        texture.dispose();
                        renderer.dispose();
                    }
                };

                const animate = () => {
                    time += 0.016;
                    material.uniforms.uTime.value = time;
                    material.uniforms.uFisheyeIntensity.value = effect._fisheyeIntensity;
                    material.uniforms.uMouse.value.set(mouseX, mouseY);
                    renderer.render(scene, camera);
                    animationId = requestAnimationFrame(animate);
                };

                const handleMouseMove = (e) => {
                    const rect = canvas.getBoundingClientRect();
                    mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
                    mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
                };

                canvas.addEventListener("mousemove", handleMouseMove);
                animate();
                allEffects.push(effect);
                resolve(effect);
            },
            undefined,
            (error) => {
                resolve(null);
            }
        );
    });
}

function createHoverAnimation(gridItem) {
    const img = gridItem.querySelector("img");
    const canvas = gridItem.querySelector(".threejs-canvas");

    let hoverTimeline = null;

    return {
        enter() {
            if (hoverTimeline) hoverTimeline.kill();
            hoverTimeline = gsap.timeline();

            hoverTimeline
                .to(img, {
                    opacity: 0,
                    duration: 0.64,
                    ease: "cubic-bezier(0.23, 1, 0.32, 1)"
                }, 0)
                .to(canvas, {
                    opacity: 1,
                    duration: 0.64,
                    ease: "cubic-bezier(0.23, 1, 0.32, 1)"
                }, 0);
        },
        leave() {
            if (hoverTimeline) hoverTimeline.kill();
            hoverTimeline = gsap.timeline();

            hoverTimeline
                .to(img, {
                    opacity: 1,
                    duration: 0.64,
                    ease: "cubic-bezier(0.23, 1, 0.32, 1)"
                }, 0)
                .to(canvas, {
                    opacity: 0,
                    duration: 0.64,
                    ease: "cubic-bezier(0.23, 1, 0.32, 1)"
                }, 0);
        }
    };
}

document.addEventListener("DOMContentLoaded", function () {
    const imageBoxes = document.querySelectorAll(".image-box");
    imageBoxes.forEach(function (box) {
        const img = box.querySelector("img");
        const canvas = box.querySelector(".threejs-canvas");
        const gridItem = box.closest(".grid-item");

        if (img && canvas && gridItem) {
            let effect = null;
            let imageLoaded = false;
            let isHovered = false;

            const hoverAnimation = createHoverAnimation(gridItem);

            const checkImageLoaded = () => {
                if (img.complete && img.naturalWidth > 0) {
                    imageLoaded = true;
                } else {
                    img.addEventListener("load", () => (imageLoaded = true), {
                        once: true
                    });
                }
            };

            checkImageLoaded();

            const initializeEffect = () => {
                createVignetteFisheyeDistortion(canvas, img.src).then(
                    (createdEffect) => {
                        effect = createdEffect;
                        if (effect) {
                            allImageEffects.push({
                                effect: effect,
                                canvas: canvas,
                                box: box,
                                isHovered: false
                            });
                        }
                    }
                );
            };

            const delay = 50;

            if (imageLoaded) {
                setTimeout(initializeEffect, delay);
            } else {
                img.addEventListener(
                    "load",
                    () => {
                        setTimeout(initializeEffect, delay);
                    },
                    { once: true }
                );
            }

            box.addEventListener("mouseenter", function () {
                isHovered = true;
                const effectData = allImageEffects.find((item) => item.box === box);
                if (effectData) effectData.isHovered = true;

                if (effect) effect.start();
                hoverAnimation.enter();
                this.style.zIndex = "20";
            });

            box.addEventListener("mouseleave", function () {
                isHovered = false;
                const effectData = allImageEffects.find((item) => item.box === box);
                if (effectData) effectData.isHovered = false;

                if (effect) effect.stop();
                hoverAnimation.leave();
                this.style.zIndex = "1";
            });
        }
    });
});

window.addEventListener("beforeunload", () => {
    allEffects.forEach((effect) => {
        if (effect && effect.dispose) {
            effect.dispose();
        }
    });
    resizeHandlers.clear();
});
