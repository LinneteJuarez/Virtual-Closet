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
const modelPaths = [
    './Largo.glb', 
    './Chongo.glb', 
    './Corto.glb'
];
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
            model.name = modelPath;
            model.scale.set(0.5, 0.5, 0.5);
            model.position.set(0, -2.8, 0); // Center the model
            scene.add(model);

            // Apply white material to all meshes in the model
            model.traverse(child => {
                if (child.isMesh) {
                    child.material = new THREE.MeshStandardMaterial({ color: 0xffffff }); // Apply white material
                    
                }
            });

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
            model.visible = models.length == 1;

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
const arrowLeft = document.getElementById('arrowLeft');
const arrowRight = document.getElementById('arrowRight');

    arrowRight.addEventListener('click', () => {
        if (isAnimating) return; // Prevent switching during animation

        currentModelIndex = (currentModelIndex + 1) % models.length; // Cycle through models
        updateModelVisibility(); // Update visibility
        rotateModel(); // Trigger rotation animation
    });

    arrowLeft.addEventListener('click', () => {
        if (isAnimating) return; // Prevent switching during animation

        currentModelIndex = (currentModelIndex - 1) % models.length; // Cycle through models
        if (currentModelIndex < 0) currentModelIndex = models.length - 1;
        updateModelVisibility(); // Update visibility
        rotateModel(); // Trigger rotation animation
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

//Gracias profe por explicarme, es un sol 

var skinBoxes = document.getElementsByClassName('colored-box-skin');
var hairBoxes = document.getElementsByClassName('colored-box-hair');
var topBoxes = document.getElementsByClassName('colored-box-top');
var bottomBoxes = document.getElementsByClassName('colored-box-bottom');
var shoesBoxes = document.getElementsByClassName('colored-box-shoes');


var skinColors = [
    '#8d5524',
    '#c68642',
    '#e0ac69',
    '#f1c27d',
    '#ffdbac',
    '#c96c39',
    '#6b3e25',
    '#f7c7a7',
    '#b66132',
    '#d57d42'
];

var hairColors = [
    '#9c0416',
    '#138650',
    '#241c11',
    '#4f1a00',
    '#9a3300',
    '#ffc44f',
    '#510566',
    '#da1b91',
    '#3F2A1B',
    '#E4C795'
];

var topColors = [
    '#1d0016',
    '#ffffff',
    '#01184d',
    '#4d4d4d',
    '#c80700',
    '#b0d0f1',
    '#fb1597',
    '#e69bf3',
    '#18aaa5',
    '#ebc138'
];

var bottomColors = [
    '#1d0016',
    '#b37422',
    '#01184d',
    '#63ab63',
    '#1d4628',
    '#6F8FAF',
    '#fb1597',
    '#e69bf3',
    '#18aaa5',
    '#797979'
];

var shoesColors = [
    '#1d0016',
    '#ffc1e3',
    '#faf1b4',
    '#ffffff',
    '#1d4628',
    '#482400',
    '#fb1597',
    '#ea590b',
    '#01234b',
    '#7a1297'
];

for (let i = 0; i < skinBoxes.length; i++){
    var element = skinBoxes[i]
    element.addEventListener('click', () => {
        var colorSelected = skinColors[i];
        console.log(colorSelected);

        setEyeColor();

        var colorMaterial = new THREE.MeshStandardMaterial({
            color: colorSelected

        });

        var firstLevelList = models[currentModelIndex].children;
        var firstLevellObject = firstLevelList[0];
        var secondLevelList = firstLevellObject.children;

        if(models[currentModelIndex].name == './Largo.glb'){
        secondLevelList[4].material = colorMaterial;
        secondLevelList[6].material = colorMaterial;
        } else if (models[currentModelIndex].name == './Corto.glb'){
            secondLevelList[11].material = colorMaterial; 
            secondLevelList[12].material = colorMaterial;
        }else if (models[currentModelIndex].name == './Chongo.glb'){
            secondLevelList[6].material = colorMaterial; 
            secondLevelList[7].material = colorMaterial;
        }
    });

}

for (let i = 0; i < hairBoxes.length; i++){
    var element = hairBoxes[i]
    element.addEventListener('click', () => {
        var colorSelected = hairColors[i];
        console.log(colorSelected);

        var colorMaterial = new THREE.MeshStandardMaterial({
            color: colorSelected

        });

        var firstLevelList = models[currentModelIndex].children;
        var firstLevellObject = firstLevelList[0];
        var secondLevelList = firstLevellObject.children;

        if(models[currentModelIndex].name == './Largo.glb'){
        secondLevelList[0].material = colorMaterial;
        secondLevelList[1].material = colorMaterial;
        secondLevelList[7].material = colorMaterial;

        } else if (models[currentModelIndex].name == './Corto.glb'){
            secondLevelList[0].material = colorMaterial; 
            secondLevelList[1].material = colorMaterial;
            secondLevelList[3].material = colorMaterial;

        }else if (models[currentModelIndex].name == './Chongo.glb'){
            secondLevelList[0].material = colorMaterial; 
            secondLevelList[1].material = colorMaterial;
            secondLevelList[10].material = colorMaterial;
            secondLevelList[11].material = colorMaterial;


        }
    });

}

for (let i = 0; i < topBoxes.length; i++){
    var element = topBoxes[i]
    element.addEventListener('click', () => {
        var colorSelected = topColors[i];
        console.log(colorSelected);

        var colorMaterial = new THREE.MeshStandardMaterial({
            color: colorSelected

        });

        var firstLevelList = models[currentModelIndex].children;
        var firstLevellObject = firstLevelList[0];
        var secondLevelList = firstLevellObject.children;

        if(models[currentModelIndex].name == './Largo.glb'){
        secondLevelList[10].material = colorMaterial;
        } else if (models[currentModelIndex].name == './Corto.glb'){
            secondLevelList[5].material = colorMaterial; 
            secondLevelList[2].material = colorMaterial; 
            secondLevelList[9].material = colorMaterial; 
            secondLevelList[10].material = colorMaterial; 
            secondLevelList[7].material = colorMaterial;  
        }else if (models[currentModelIndex].name == './Chongo.glb'){
            secondLevelList[4].material = colorMaterial; 
        }
    });

}

for (let i = 0; i < bottomBoxes.length; i++){
    var element = bottomBoxes[i]
    element.addEventListener('click', () => {
        var colorSelected = bottomColors[i];
        console.log(colorSelected);

        var colorMaterial = new THREE.MeshStandardMaterial({
            color: colorSelected

        });

        var firstLevelList = models[currentModelIndex].children;
        var firstLevellObject = firstLevelList[0];
        var secondLevelList = firstLevellObject.children;

        if(models[currentModelIndex].name == './Largo.glb'){
        secondLevelList[5].material = colorMaterial;
        } else if (models[currentModelIndex].name == './Corto.glb'){
            secondLevelList[8].material = colorMaterial;  
        }else if (models[currentModelIndex].name == './Chongo.glb'){
            secondLevelList[5].material = colorMaterial; 
        }
    });

}

for (let i = 0; i < shoesBoxes.length; i++){
    var element = shoesBoxes[i]
    element.addEventListener('click', () => {
        var colorSelected = shoesColors[i];
        console.log(colorSelected);

        var colorMaterial = new THREE.MeshStandardMaterial({
            color: colorSelected

        });

        var firstLevelList = models[currentModelIndex].children;
        var firstLevellObject = firstLevelList[0];
        var secondLevelList = firstLevellObject.children;

        if(models[currentModelIndex].name == './Largo.glb'){
        secondLevelList[2].material = colorMaterial;
        secondLevelList[3].material = colorMaterial;
        } else if (models[currentModelIndex].name == './Corto.glb'){
            secondLevelList[4].material = colorMaterial;  
            secondLevelList[6].material = colorMaterial;
        }else if (models[currentModelIndex].name == './Chongo.glb'){
            secondLevelList[2].material = colorMaterial; 
            secondLevelList[3].material = colorMaterial; 
        }
    });

}

const eyeColor = '#000000'; // Black color for eyes
const eyeMaterial = new THREE.MeshStandardMaterial({
    color: eyeColor
});

function setEyeColor() {
    const firstLevelList = models[currentModelIndex].children;
    const firstLevellObject = firstLevelList[0];
    const secondLevelList = firstLevellObject.children;

    if (models[currentModelIndex].name == './Largo.glb') {
        // Assuming that the eyes are at specific positions in the model structure
        secondLevelList[8].material = eyeMaterial;  // Replace with the correct index for the eyes
        secondLevelList[9].material = eyeMaterial;  // Replace with the correct index for the eyes
    } else if (models[currentModelIndex].name == './Corto.glb') {
        secondLevelList[13].material = eyeMaterial;  // Replace with the correct index for the eyes
        secondLevelList[14].material = eyeMaterial;  // Replace with the correct index for the eyes
    } else if (models[currentModelIndex].name == './Chongo.glb') {
        secondLevelList[8].material = eyeMaterial;  // Replace with the correct index for the eyes
        secondLevelList[9].material = eyeMaterial;  // Replace with the correct index for the eyes
    }
}


document.addEventListener("DOMContentLoaded", () => {
    const resetButton = document.getElementById("resetButton");
    
    if (resetButton) {
        console.log("Reset button found:", resetButton);
        resetButton.addEventListener("click", () => {
            console.log("Reset button clicked!");
            resetAll();


        });
    } else {
        console.error("Reset button not found. Check the HTML structure.");
    }
});

function resetAll() {
    // Reset each model's materials
    models.forEach(model => {
        if (model) {
            model.traverse(child => {
                if (child.isMesh) {
                    // Reset the material to default (this will "clear" applied color)
                    child.material = new THREE.MeshStandardMaterial(); // Set a default material

                    // Optionally, reset the position, rotation, scale if you want to reset transformations too
                    child.position.set(0, 0, 0);
                    child.rotation.set(0, 0, 0);
                    child.scale.set(1, 1, 1);
                }
            });
        }
    });

    console.log("Models reset: Materials cleared!");

    // Re-render the scene
    renderer.render(scene, camera);
}

document.addEventListener("DOMContentLoaded", () => {
    const readyButton = document.getElementById("readyButton"); // Ensure the button ID is correct
    
    if (readyButton) {
        console.log("Ready button found:", readyButton);
        readyButton.addEventListener("click", () => {
            console.log("Ready button clicked!");
            captureScreenshot(); // Call the screenshot capture function
        });
    } else {
        console.error("Ready button not found. Check the HTML structure.");
    }
});

function captureScreenshot() {
    // Ensure that the renderer is up-to-date and the scene is properly rendered
    renderer.render(scene, camera); // Explicitly render the scene

    // Get the canvas element from the WebGLRenderer
    const canvasElement = renderer.domElement;

    // Capture the canvas as a PNG image (base64 encoded)
    const screenshotDataURL = canvasElement.toDataURL("image/png");

    // Create a temporary link element to trigger the download
    const link = document.createElement("a");
    link.href = screenshotDataURL;
    link.download = "screenshot.png"; // Filename for the screenshot
    link.click(); // Simulate a click to trigger the download

    // Optionally, you can open the screenshot in a new tab
    // window.open(screenshotDataURL, "_blank");
}




