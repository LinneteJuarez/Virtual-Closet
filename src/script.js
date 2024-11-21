import * as THREE from 'three';

// Select the canvas element
const canvas = document.querySelector('.webgl');

// Create the Three.js Scene
const scene = new THREE.Scene();

// Add a Camera
const camera = new THREE.PerspectiveCamera(
    75, 
    canvas.clientWidth / canvas.clientHeight, 
    0.1, 
    1000
);
camera.position.z = 5;

// Create the Renderer
const renderer = new THREE.WebGLRenderer({
    canvas: canvas, // Link renderer to the canvas element
});
renderer.setSize(canvas.clientWidth, canvas.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio); // Improve rendering on high DPI screens

// Add a basic cube
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Add rotation for visual effect
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;

    // Render the scene
    renderer.render(scene, camera);
}
animate();

// Add scrollBox drag-and-drop functionality
const scrollBox = document.getElementById('scroll');
let isDragging = false;
let startX;
let initialLeft;

scrollBox.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.clientX; // Record the starting X position
    initialLeft = scrollBox.offsetLeft; // Record the initial left position
    document.body.style.cursor = 'grabbing'; // Change cursor while dragging
});

document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    const deltaX = e.clientX - startX; // Calculate the distance moved
    let newLeft = initialLeft + deltaX;

    // Constrain within parent container width
    const maxLeft = scrollBox.parentElement.clientWidth - scrollBox.clientWidth;
    newLeft = Math.max(0, Math.min(newLeft, maxLeft));

    scrollBox.style.left = `${newLeft}px`; // Update position
});

document.addEventListener('mouseup', () => {
    isDragging = false;
    document.body.style.cursor = 'default'; // Reset cursor
});

// Add click functionality to hide inner-box covers
const innerBoxCovers = document.querySelectorAll('.inner-box-cover');

innerBoxCovers.forEach((cover) => {
    cover.addEventListener('click', function () {
        cover.classList.add('hidden'); // Hide the cover
    });
});