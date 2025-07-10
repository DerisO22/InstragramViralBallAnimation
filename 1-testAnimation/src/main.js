// Enhanced main.js with camera system
import './style.css'
import { ball, circleRing } from './ball'
import { randomIntFromRange, randomColor } from './util';

export const canvas = document.querySelector('canvas');
export const c = canvas.getContext('2d');

const patrickImage = new Image(1, 1);
patrickImage.src = '/savage-patrick.jpg';

canvas.width = innerWidth;
canvas.height = innerHeight;

const mouse = {
	x: innerWidth / 2,
	y: innerHeight / 2
}

// Camera system
const camera = {
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    smoothing: 0.08, 
    shakeX: 0,
    shakeY: 0,
    shakeIntensity: 0,
    shakeDecay: 0.9
};

// Camera functions
function updateCamera(targetX, targetY) {
    // Update target position
    camera.targetX = -targetX + canvas.width / 2;
    camera.targetY = -targetY + canvas.height / 2;
    
    // Smooth camera movement with easing
    camera.x += (camera.targetX - camera.x) * camera.smoothing;
    camera.y += (camera.targetY - camera.y) * camera.smoothing;
    
    // Update screen shake
    if (camera.shakeIntensity > 0) {
        camera.shakeX = (Math.random() - 0.5) * camera.shakeIntensity;
        camera.shakeY = (Math.random() - 0.5) * camera.shakeIntensity;
        camera.shakeIntensity *= camera.shakeDecay;
        
        // Stop shaking when intensity is very low
        if (camera.shakeIntensity < 0.1) {
            camera.shakeIntensity = 0;
            camera.shakeX = 0;
            camera.shakeY = 0;
        }
    }
}

function applyCameraTransform() {
    c.save();
    c.translate(camera.x + camera.shakeX, camera.y + camera.shakeY);
}

function resetCameraTransform() {
    c.restore();
}

function addScreenShake(intensity) {
    camera.shakeIntensity = Math.max(camera.shakeIntensity, intensity);
}

// Export screen shake function for use in ball.js
window.addScreenShake = addScreenShake;

let ballObjects = [];
let ringObject, ringObject2, ringObject3;
const colors = ['#ff0000', '#00ff00', '#0000ff', '#ff00ff'];

const init = () => {
	ballObjects = [];
	
	for (let i = 0; i < 1; i++){
		// const x = randomIntFromRange(50, canvas.width - 50);
        // const y = randomIntFromRange(50, canvas.height - 50);
		const x = canvas.width / 2;
		const y = canvas.height / 2;
        const radius = 10;
        const color = randomColor(colors);
        ballObjects.push(new ball(x, y, radius, color));
	}

	// Create the ring instance and store it
	ringObject = new circleRing(
		window.innerWidth / 2, 
		window.innerHeight / 2, 
		Math.min(window.innerWidth, window.innerHeight) / 3, 
		randomColor(colors), 
		10
	);

	// Create the ring instance and store it
	ringObject2 = new circleRing(
		window.innerWidth / 2, 
		window.innerHeight / 2, 
		Math.min(window.innerWidth, window.innerHeight) / 2.4, 
		randomColor(colors), 
		10
	);

	// Create the ring instance and store it
	ringObject3 = new circleRing(
		window.innerWidth / 2, 
		window.innerHeight / 2, 
		Math.min(window.innerWidth, window.innerHeight) / 2, 
		randomColor(colors), 
		10
	);
}

const animate = () => {
	requestAnimationFrame(animate)
	c.clearRect(0, 0, canvas.width, canvas.height)

    // Update camera to follow the first ball
    if (ballObjects.length > 0) {
        updateCamera(ballObjects[0].x, ballObjects[0].y);
    }

    // Apply camera transformation
    applyCameraTransform();

	// Update and draw all balls
	ballObjects.forEach(ballObj => {
		ballObj.update();
		// Check collision with ring
		ringObject.checkCollision(ballObj);
		ringObject2.checkCollision(ballObj);
		ringObject3.checkCollision(ballObj);
	});
	
	// Update and draw the ring
	ringObject.update();
	ringObject2.update();
	ringObject3.update();

    // Reset camera transformation
    resetCameraTransform();

    // Draw UI elements that shouldn't move with camera (like Patrick)
    // Convert mouse position to world coordinates for Patrick
    const worldMouseX = mouse.x - camera.x - camera.shakeX;
    const worldMouseY = mouse.y - camera.y - camera.shakeY;
    
    // Apply camera transform again for Patrick to follow mouse in world space
    applyCameraTransform();
    c.drawImage(patrickImage, worldMouseX - 12.5, worldMouseY - 12.5, 25, 25);
    resetCameraTransform();

    // Draw camera info (optional - remove this in production)
    c.fillStyle = 'rgba(255, 255, 255, 0.7)';
    c.font = '12px Arial';
    c.fillText(`Camera: (${Math.round(camera.x)}, ${Math.round(camera.y)})`, 10, 20);
    if (ballObjects.length > 0) {
        c.fillText(`Ball: (${Math.round(ballObjects[0].x)}, ${Math.round(ballObjects[0].y)})`, 10, 35);
    }
    c.fillText(`Shake: ${Math.round(camera.shakeIntensity * 100) / 100}`, 10, 50);
}

// Event Listeners
addEventListener('mousemove', (event) => {
	mouse.x = event.clientX
	mouse.y = event.clientY
})
  
addEventListener('resize', () => {
	canvas.width = innerWidth
	canvas.height = innerHeight
  
	init()
})

// Keyboard controls for camera settings (optional)
addEventListener('keydown', (event) => {
    switch(event.key) {
        case '1':
            camera.smoothing = 0.05; 
            console.log('Camera smoothing: Slow');
            break;
        case '2':
            camera.smoothing = 0.08; 
            console.log('Camera smoothing: Normal');
            break;
        case '3':
            camera.smoothing = 0.15; 
            console.log('Camera smoothing: Fast');
            break;
        case ' ':
            addScreenShake(20); 
            break;
    }
});

init();
animate();