// Enhanced main.js with camera system and start button
import "./style.css";
import { ball, circleRing } from "./ball";
import { randomIntFromRange, randomColor } from "./Utils/util";
import { applyCameraTransform, resetCameraTransform, addScreenShake, updateCamera } from "./Utils/cameraUtils";
import { mouse, camera, colors } from "./Data/screen";

export const canvas = document.querySelector("canvas");
export const c = canvas.getContext("2d");

const patrickImage = new Image(1, 1);
patrickImage.src = "/savage-patrick.jpg";

// Game state
let gameStarted = false;
let animationId = null;

// Game objects
let ballObjects = [];
let ringObjects = [];

// Set initial canvas size
function resizeCanvas() {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
}

resizeCanvas();
window.addScreenShake = addScreenShake;

// Start screen stuff
const startScreen = document.getElementById("startScreen");
const startButton = document.getElementById("startButton");
const audioControls = document.getElementById("audio-controls");
let audioControlVisibility = true;

startButton.addEventListener("click", () => {
  	startGame();
});

function startGame() {
	if (gameStarted) return;

	startScreen.style.display = "none";
	audioControls.style.display = "block";

	gameStarted = true;
	init();
	animate();
}

const init = () => {
	ballObjects = [];
	ringObjects = [];

	for (let i = 0; i < 1; i++) {
		// The main ball
		const x = canvas.width / 2;
		const y = canvas.height / 2;
		const radius = 10;
		const color = randomColor(colors);
		ballObjects.push(new ball(x, y, radius, color));
	}

	// Create rings 
	ringObjects.push(
		new circleRing(
			canvas.width / 2,
			canvas.height / 2,
			Math.min(canvas.width, canvas.height) / 4,
			randomColor(colors),
			10
		)
	);

	ringObjects.push(
		new circleRing(
			canvas.width / 2,
			canvas.height / 2,
			Math.min(canvas.width, canvas.height) / 3,
			randomColor(colors),
			10
		)
	);

	ringObjects.push(
		new circleRing(
			canvas.width / 2,
			canvas.height / 2,
			Math.min(canvas.width, canvas.height) / 2,
			randomColor(colors),
			10
		)
	);

	ringObjects.push(
		new circleRing(
		canvas.width / 2,
		canvas.height / 2,
		Math.min(canvas.width, canvas.height) / 1.8,
		randomColor(colors),
		10
		)
	);

};

const animate = () => {
	if (!gameStarted) return;

	animationId = requestAnimationFrame(animate);
	c.clearRect(0, 0, canvas.width, canvas.height);

	// camera follows the first ball
	if (ballObjects.length > 0) {
		updateCamera(ballObjects[0].x, ballObjects[0].y);
	}

	applyCameraTransform();

	// Update and draw all balls
	ballObjects.forEach((ballObj) => {
		ballObj.update();
		
		// Check collision with all rings
		ringObjects.forEach((ring) => {
		ring.checkCollision(ballObj);
		});
	});

	// Update rings and remove any that should be deleted
	for (let i = ringObjects.length - 1; i >= 0; i--) {
		ringObjects[i].update();
		if (ringObjects[i].shouldDelete) {
		ringObjects.splice(i, 1);
		}
	}

	resetCameraTransform();

	const worldMouseX = mouse.x;
	const worldMouseY = mouse.y;

	applyCameraTransform();
	c.drawImage(patrickImage, worldMouseX, worldMouseY, 25, 25);
	resetCameraTransform();
};

// Event Listeners
addEventListener("mousemove", (event) => {
	mouse.x = event.clientX;
	mouse.y = event.clientY;
});

addEventListener("resize", () => {
	resizeCanvas();

	if (gameStarted) {
		init();
	}
});

// Keyboard controls for camera settings
addEventListener("keydown", (event) => {
	if (!gameStarted) {
		if (event.key === " " || event.key === "Enter") {
		event.preventDefault();
		startGame();
		}
		return;
	}

	switch (event.key) {
		case "1":
			camera.smoothing = 0.01;
			console.log("Camera smoothing: Slow");
			break;
		case "2":
			camera.smoothing = 0.08;
			console.log("Camera smoothing: Normal");
			break;
		case "3":
			camera.smoothing = 0.15;
			console.log("Camera smoothing: Fast");
			break;
		case "4":
			audioControlVisibility = !audioControlVisibility;

			if(audioControlVisibility) {
				audioControls.style.display = "block"
			} else {
				audioControls.style.display = "none";
			}
			break;
		case " ":
			event.preventDefault(); 
			addScreenShake(20);
			break;
	}
});

addEventListener("keydown", (event) => {
	if (event.key === " ") {
		event.preventDefault();
	}
});