import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Select the canvas element
const canvas = document.querySelector('.webgl');

// Create the Three.js Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xFFB0C6);

// Add a Camera
const camera = new THREE.PerspectiveCamera(
    75,
    canvas.clientWidth / canvas.clientHeight,
    0.1,
    1000
);
camera.position.z = 5; // Keep camera's position so that models are visible

// Create the Renderer
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
});
renderer.setSize(canvas.clientWidth, canvas.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// Add Lighting
const ambientLight = new THREE.AmbientLight(0x404040, 8);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 4);
directionalLight.position.set(1, 1, 1).normalize();
scene.add(directionalLight);

// Load GLTF Models
const loader = new GLTFLoader();
const modelPaths = ['./Dwarf Idle.glb', './Base2.glb', './Base3.glb'];
const models = []; // Array to store loaded models
let currentModelIndex = 0; // Tracks the currently displayed model
let mixers = []; // Array to store animation mixers
let isAnimating = false; // Prevent multiple animations at once

// Function to show only the current model
function updateModelVisibility() {
    models.forEach((model, index) => {
        model.visible = index === currentModelIndex; // Show only the current model
    });
}

// Function to rotate model during switch with full 360° rotation
function rotateModel() {
    if (!models[currentModelIndex]) return;

    isAnimating = true;
    const model = models[currentModelIndex];
    const targetRotation = model.rotation.y + Math.PI * 2; // Full 360° rotation
    const rotationSpeed = 0.1; // Adjust for desired animation speed

    function animateRotation() {
        if (model.rotation.y < targetRotation) {
            model.rotation.y += rotationSpeed; // Increment rotation
            requestAnimationFrame(animateRotation); // Continue animation
        } else {
            model.rotation.y = targetRotation % (Math.PI * 2); // Normalize rotation value
            isAnimating = false; // Animation complete
        }
    }

    animateRotation();
}

// Load all models
modelPaths.forEach((modelPath, index) => {
    loader.load(
        modelPath,
        (gltf) => {
            const model = gltf.scene;
            model.scale.set(0.5, 0.5, 0.5);
            model.position.set(0, -2.8, 0); // Center the model
            scene.add(model);

            // Store the loaded model
            models.push(model);

            // Set up animation if available
            if (gltf.animations && gltf.animations.length > 0) {
                const mixer = new THREE.AnimationMixer(model);
                const action = mixer.clipAction(gltf.animations[0]);
                action.play();
                mixers.push(mixer); // Add mixer to the array
            }

            // Hide the model initially (except the first one)
            model.visible = index === 0;
        },
        (xhr) => {
            console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
        },
        (error) => {
            console.error('An error occurred:', error);
        }
    );
});

// Arrow Navigation
const arrows = document.querySelectorAll('.arrow');
arrows.forEach((arrow) => {
    arrow.addEventListener('click', () => {
        if (isAnimating) return; // Prevent switching during animation

        currentModelIndex = (currentModelIndex + 1) % models.length; // Cycle through models
        updateModelVisibility(); // Update visibility
        rotateModel(); // Trigger rotation animation
    });
});

// Scroll element
const scrollBox = document.getElementById('scroll');

// Add drag-and-scroll functionality
let isDragging = false;
let startX;
let initialScrollLeft;

scrollBox.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.clientX; // Record the starting X position
    initialScrollLeft = scrollBox.offsetLeft; // Record the initial scroll position
    document.body.style.cursor = 'grabbing'; // Change cursor while dragging
});

document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    const deltaX = e.clientX - startX; // Calculate the distance moved
    let newLeft = initialScrollLeft + deltaX;

    // Constrain within parent container width
    const maxLeft = scrollBox.parentElement.clientWidth - scrollBox.clientWidth;
    newLeft = Math.max(0, Math.min(newLeft, maxLeft));

    scrollBox.style.left = `${newLeft}px`; // Update position
});

document.addEventListener('mouseup', () => {
    isDragging = false;
    document.body.style.cursor = 'default'; // Reset cursor
});

// Model rotation linked to scroll (around Y-axis)
scrollBox.addEventListener('mousemove', () => {
    if (!isDragging || !models[currentModelIndex]) return;

    const scrollPosition = scrollBox.offsetLeft;
    const maxScroll = scrollBox.parentElement.clientWidth - scrollBox.clientWidth;
    const rotationFactor = (scrollPosition / maxScroll) * Math.PI * 2;

    models[currentModelIndex].rotation.y = rotationFactor; // Rotate current model on Y-axis
});

// Select all inner-box covers
const innerBoxCovers = document.querySelectorAll('.inner-box-cover');

// Add click event to each cover
innerBoxCovers.forEach((cover) => {
    cover.addEventListener('click', function () {
        // Hide the cover
        cover.classList.add('hidden');
    });
});

// Animation loop
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    // Update all mixers
    const deltaTime = clock.getDelta();
    mixers.forEach((mixer) => mixer.update(deltaTime));

    // Render the scene
    renderer.render(scene, camera);
}

animate();

// Add the song (using Web Audio API)
const audioListener = new THREE.AudioListener();
camera.add(audioListener); // Add the listener to the camera

// Create the audio object
const audio = new THREE.Audio(audioListener);
const audioLoader = new THREE.AudioLoader();

// Load and play the audio in loop
audioLoader.load(
    './Audio.mp3', // Path to your audio file
    (buffer) => {
        audio.setBuffer(buffer);
        audio.setLoop(true); // Set the song to loop
        audio.setVolume(0.5); // Set the volume level
    },
    (xhr) => {
        console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
    },
    (error) => {
        console.error('Error loading audio:', error);
    }
);

// Toggle sound on/off
const soundButton = document.getElementById('soundButton');

// Initially play the audio (but don't start playing until user interaction)
audio.play();

soundButton.addEventListener('click', () => {
    if (audio.isPlaying) {
        audio.pause(); // Pause the audio
        soundButton.textContent = 'Sound On'; // Update button text
    } else {
        audio.play(); // Play the audio
        soundButton.textContent = 'Sound Off'; // Update button text
    }
});
