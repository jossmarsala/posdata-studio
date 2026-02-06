
import * as THREE from "https://esm.sh/three@0.160.0";

// Scene, Camera, Renderer
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
camera.position.z = 1;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);

// Target specific container
const container = document.getElementById('shader-container');
if (container) {
    container.appendChild(renderer.domElement);
} else {
    // Fallback if script runs before DOM or container missing
    document.body.appendChild(renderer.domElement);
}

// Store mouse position and smooth it over time
const mouse = new THREE.Vector2(0, 0);
const smoothedMouse = new THREE.Vector2(0, 0);
let mouseDown = false;

// Default values
const primaryColor = [255, 255, 255];
const secondaryColor = [255, 255, 255];
const accentColor = [0, 0, 0];
const fractalScale = 0.3;
const fractalX = 0;
const fractalY = 0;
const lightCount = 1;
const lightIntensity = 1.0;
const lightSpeed = 1.0;
const grainStrength = 0.15;
const grainSize = 3.5;
const animationSpeed = 0.02;
const autoRotate = true;

// Shader Material
const shaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
        iResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        iTime: { value: 0.0 },
        smoothedMouse: { value: new THREE.Vector2(0, 0) },
        mouseDown: { value: 0 },
        primaryColor: { value: new THREE.Color().fromArray(primaryColor.map((c) => c / 255)) },
        secondaryColor: { value: new THREE.Color().fromArray(secondaryColor.map((c) => c / 255)) },
        accentColor: { value: new THREE.Color().fromArray(accentColor.map((c) => c / 255)) },
        fractalScale: { value: fractalScale },
        fractalOffset: { value: new THREE.Vector2(fractalX, fractalY) },
        lightCount: { value: lightCount },
        lightIntensity: { value: lightIntensity },
        lightSpeed: { value: lightSpeed },
        grainStrength: { value: grainStrength },
        grainSize: { value: grainSize },
        animationSpeed: { value: animationSpeed },
        autoRotate: { value: autoRotate ? 1.0 : 0.0 }
    },
    vertexShader: `
    varying vec2 vUv;
    void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
    }`,
    fragmentShader: `
    varying vec2 vUv;
    uniform vec2 iResolution;
    uniform float iTime;
    uniform vec3 primaryColor;
    uniform vec3 secondaryColor;
    uniform vec3 accentColor;
    uniform vec2 smoothedMouse;
    uniform float mouseDown;
    uniform float fractalScale;
    uniform vec2 fractalOffset;
    uniform int lightCount;
    uniform float lightIntensity;
    uniform float lightSpeed;
    uniform float grainStrength;
    uniform float grainSize;
    uniform float animationSpeed;
    uniform float autoRotate;
    #define PI 3.14159265359
    // Improved noise function
    float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
    }
    float hash(float n) {
    return fract(sin(n) * 43758.5453);
    }
    // Rotation matrix
    mat2 rot(float a) {
    float s = sin(a);
    float c = cos(a);
    return mat2(c, -s, s, c);
    }
    // Orb shape function
    float orbShape(vec2 uv, float time) {
    // Adjust UV to be from -1 to 1 with aspect ratio correction
    uv = (uv * 2.0 - 1.0);
    uv.x *= iResolution.x / iResolution.y;
    // Apply scale and offset
    uv *= fractalScale;
    uv += fractalOffset;
    // Create a pulsating orb
    float d = length(uv);
    float pulse = 0.5 + 0.1 * sin(time * animationSpeed * 2.0);
    // Base orb shape
    float shape = smoothstep(pulse, pulse - 0.1, d);
    // Add internal glow and structure
    float innerGlow = smoothstep(pulse * 0.8, 0.0, d) * 0.5;
    // Add some swirls
    float angle = atan(uv.y, uv.x);
    float swirl = 0.15 * sin(angle * 8.0 + time * 3.0 * animationSpeed) * smoothstep(pulse, 0.0, d);
    return shape + innerGlow + swirl;
    }
    // Get light positions
    vec3 getLightPosition(int index, float time) {
    float angle = float(index) * (2.0 * PI / float(lightCount)) + time * lightSpeed;
    float radius = 1.5;
    float height = sin(time * lightSpeed * 0.5 + float(index)) * 0.5;
    return vec3(radius * cos(angle), height, radius * sin(angle));
    }
    // Calculate light influence
    float calculateLight(vec2 uv, float time) {
    // Convert 2D position to 3D for light calculation
    vec3 pos = vec3(uv.x, uv.y, 0.0);
    float totalLight = 0.0;
    // Add contribution from each light
    for (int i = 0; i < 10; i++) {
    if (i >= lightCount) break;
    vec3 lightPos = getLightPosition(i, time);
    float dist = length(pos - lightPos);
    totalLight += lightIntensity / (1.0 + dist * dist * 2.0);
    }
    // Add mouse light
    vec2 mousePos = smoothedMouse / iResolution.xy;
    mousePos = (mousePos * 2.0 - 1.0);
    mousePos.x *= iResolution.x / iResolution.y;
    float mouseDist = length(uv - mousePos);
    totalLight += lightIntensity * 2.0 / (1.0 + mouseDist * mouseDist * 4.0);
    return totalLight;
    }
    void main() {
    // Normalize UV coordinates
    vec2 uv = gl_FragCoord.xy / iResolution.xy;
    vec2 centeredUV = (uv * 2.0 - 1.0);
    centeredUV.x *= iResolution.x / iResolution.y;
    // Get shape value from orb function
    float shape = orbShape(uv, iTime);
    // Calculate light influence
    float light = calculateLight(centeredUV, iTime);
    // Create a more complex color mix using all three colors
    vec3 baseColor = mix(primaryColor, secondaryColor, shape);
    // Add accent color to highlights
    float highlight = pow(shape, 3.0);
    baseColor = mix(baseColor, accentColor, highlight * 0.5);
    // Apply light effect
    baseColor *= light * (shape + 0.2);
    // Apply grain effect
    vec2 uvRandom = vUv;
    uvRandom.y *= hash(vec2(uvRandom.y, iTime * 0.01));
    float noise = hash(uvRandom * grainSize + iTime * 0.1) * grainStrength;
    baseColor += noise - grainStrength * 0.5;
    // Center the noise around zero
    // Set the final color
    gl_FragColor = vec4(baseColor, 1.0);
    }
    `
});

// Create a fullscreen plane
const plane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), shaderMaterial);
scene.add(plane);

// Mouse event listeners
window.addEventListener("mousemove", (event) => {
    const mouseX = event.clientX / window.innerWidth;
    const mouseY = 1.0 - event.clientY / window.innerHeight; // Flip Y axis
    mouse.set(mouseX, mouseY);
});

window.addEventListener("mousedown", () => {
    mouseDown = true;
    shaderMaterial.uniforms.mouseDown.value = 1.0;
});

window.addEventListener("mouseup", () => {
    mouseDown = false;
    shaderMaterial.uniforms.mouseDown.value = 0.0;
});

// Animation Loop
function animate() {
    // Update time uniform
    const time = performance.now() * 0.001; // Convert to seconds
    shaderMaterial.uniforms.iTime.value = time;

    // Smooth out the mouse movement
    smoothedMouse.lerp(mouse, 0.1); // 0.1 controls the smoothness (lower value = smoother)
    shaderMaterial.uniforms.smoothedMouse.value.set(
        smoothedMouse.x * window.innerWidth,
        smoothedMouse.y * window.innerHeight
    );

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

// Start animation
animate();

// Handle Window Resize
window.addEventListener("resize", () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height);
    shaderMaterial.uniforms.iResolution.value.set(width, height);
});

// Add touch support for mobile devices
window.addEventListener(
    "touchmove",
    (event) => {
        event.preventDefault();
        const touch = event.touches[0];
        const mouseX = touch.clientX / window.innerWidth;
        const mouseY = 1.0 - touch.clientY / window.innerHeight; // Flip Y axis
        mouse.set(mouseX, mouseY);
    },
    { passive: false }
);

window.addEventListener("touchstart", () => {
    mouseDown = true;
    shaderMaterial.uniforms.mouseDown.value = 1.0;
});

window.addEventListener("touchend", () => {
    mouseDown = false;
    shaderMaterial.uniforms.mouseDown.value = 0.0;
});
