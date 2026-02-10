
import * as THREE from "./vendors/three.module.js";

// scene, camera, renderer
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
camera.position.z = 1;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);

// target specific container
const container = document.getElementById('shader-container');
if (container) {
    container.appendChild(renderer.domElement);
} else {
    // fallback if container missing
    document.body.appendChild(renderer.domElement);
}

// mouse position
const mouse = new THREE.Vector2(0, 0);
const smoothedMouse = new THREE.Vector2(0, 0);
let mouseDown = false;

// default values
const primaryColor = [255, 255, 255];
const secondaryColor = [255, 248, 235]; // warm white
const accentColor = [0, 0, 0];
const fractalScale = 0.3;
const fractalX = 0;
const fractalY = 0;
const lightCount = 1;
const lightIntensity = 0.5;
const lightSpeed = 1.0;
const grainStrength = 0.15;
const grainSize = 3.5;
const animationSpeed = 0.02;
const autoRotate = true;

// shader material
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
    // improved noise function
    float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
    }
    float hash(float n) {
    return fract(sin(n) * 43758.5453);
    }
    // rotation matrix
    mat2 rot(float a) {
    float s = sin(a);
    float c = cos(a);
    return mat2(c, -s, s, c);
    }
    // orb shape function
    float orbShape(vec2 uv, float time) {
    // adjust uv to be from -1 to 1 with aspect ratio correction
    uv = (uv * 2.0 - 1.0);
    uv.x *= iResolution.x / iResolution.y;
    
    uv *= fractalScale;
    uv += fractalOffset;
    
    float d = length(uv);
    float pulse = 0.5 + 0.1 * sin(time * animationSpeed * 2.0);
    
    float shape = smoothstep(pulse, pulse - 0.1, d);
    
    float innerGlow = smoothstep(pulse * 0.8, 0.0, d) * 0.5;
    
    float angle = atan(uv.y, uv.x);
    float swirl = 0.15 * sin(angle * 8.0 + time * 3.0 * animationSpeed) * smoothstep(pulse, 0.0, d);
    return shape + innerGlow + swirl;
    }
    // get light positions
    vec3 getLightPosition(int index, float time) {
    float angle = float(index) * (2.0 * PI / float(lightCount)) + time * lightSpeed;
    float radius = 1.5;
    float height = sin(time * lightSpeed * 0.5 + float(index)) * 0.5;
    return vec3(radius * cos(angle), height, radius * sin(angle));
    }
    // calculate light influence
    float calculateLight(vec2 uv, float time) {
    // convert 2d position to 3d for light calculation
    vec3 pos = vec3(uv.x, uv.y, 0.0);
    float totalLight = 0.0;
    
    for (int i = 0; i < 10; i++) {
    if (i >= lightCount) break;
    vec3 lightPos = getLightPosition(i, time);
    float dist = length(pos - lightPos);
    totalLight += lightIntensity / (1.0 + dist * dist * 2.0);
    }
    // add mouse light
    vec2 mousePos = smoothedMouse / iResolution.xy;
    mousePos = (mousePos * 2.0 - 1.0);
    mousePos.x *= iResolution.x / iResolution.y;
    float mouseDist = length(uv - mousePos);
    totalLight += lightIntensity * 2.0 / (1.0 + mouseDist * mouseDist * 4.0);
    return totalLight;
    }
    void main() {
    // normalize uv coordinates
    vec2 uv = gl_FragCoord.xy / iResolution.xy;
    vec2 centeredUV = (uv * 2.0 - 1.0);
    centeredUV.x *= iResolution.x / iResolution.y;
    
    float shape = orbShape(uv, iTime);
    
    float light = calculateLight(centeredUV, iTime);
    // mix colors
    vec3 baseColor = mix(primaryColor, secondaryColor, shape);
    
    float highlight = pow(shape, 3.0);
    baseColor = mix(baseColor, accentColor, highlight * 0.5);
    // apply light effect
    baseColor *= light * (shape + 0.2);
    // apply grain effect
    vec2 uvRandom = vUv;
    uvRandom.y *= hash(vec2(uvRandom.y, iTime * 0.01));
    float noise = hash(uvRandom * grainSize + iTime * 0.1) * grainStrength;
    baseColor += noise - grainStrength * 0.5;
    
    gl_FragColor = vec4(baseColor, 1.0);
    }
    `
});

// create fullscreen plane
const plane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), shaderMaterial);
scene.add(plane);

// mouse event listeners
window.addEventListener("mousemove", (event) => {
    const mouseX = event.clientX / window.innerWidth;
    const mouseY = 1.0 - event.clientY / window.innerHeight;
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

// animation loop
function animate() {

    const time = performance.now() * 0.001;
    shaderMaterial.uniforms.iTime.value = time;

    // smooth mouse movement
    smoothedMouse.lerp(mouse, 0.1);
    shaderMaterial.uniforms.smoothedMouse.value.set(
        smoothedMouse.x * window.innerWidth,
        smoothedMouse.y * window.innerHeight
    );

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

// start animation
animate();

// handle window resize
window.addEventListener("resize", () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height);
    shaderMaterial.uniforms.iResolution.value.set(width, height);
});

// mobile touch support
window.addEventListener(
    "touchmove",
    (event) => {
        // Only prevent default if we actually need to block scroll (which we don't for background)
        // event.preventDefault(); 
        const touch = event.touches[0];
        const mouseX = touch.clientX / window.innerWidth;
        const mouseY = 1.0 - touch.clientY / window.innerHeight;
        mouse.set(mouseX, mouseY);
    },
    { passive: true }
);

window.addEventListener("touchstart", () => {
    mouseDown = true;
    shaderMaterial.uniforms.mouseDown.value = 1.0;
});

window.addEventListener("touchend", () => {
    mouseDown = false;
    shaderMaterial.uniforms.mouseDown.value = 0.0;
});
