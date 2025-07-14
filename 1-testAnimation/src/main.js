// Memory-optimized main.js - Can handle thousands of balls
import "./style.css";
import {
	ball,
	circleRing,
	cleanupMemory,
	logMemoryStats,
	cleanup,
	MAX_BALLS,
} from "./ball";
import { randomIntFromRange, randomColor } from "./Utils/util";
import {
	applyCameraTransform,
	resetCameraTransform,
	addScreenShake,
	updateCamera,
	toggleCameraFollowing,
	centerCamera,
	moveCameraManually,
} from "./Utils/cameraUtils";
import { mouse, camera, colors } from "./Data/screen";

export const canvas = document.querySelector("canvas");
export const c = canvas.getContext("2d");

const patrickImage = new Image(1, 1);
patrickImage.src = "/savage-patrick.jpg";

// Game state
let gameStarted = false;
let animationId = null;

// Performance monitoring
let frameCount = 0;
let lastFrameTime = performance.now();
let lastMemoryCleanup = 0;
let lastMemoryLog = 0;

// Game objects
let ballObjects = [];
let ringObjects = [];

export { ballObjects };

// Set initial canvas size
function resizeCanvas() {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
}

resizeCanvas();
window.addScreenShake = addScreenShake;

// Start screen
const startScreen = document.getElementById("startScreen");
const startButton = document.getElementById("startButton");
const audioControls = document.getElementById("audio-controls");
let audioControlVisibility = true;

// Initialize camera properties if they don't exist
function initializeCameraProperties() {
	if (camera.followingEnabled === undefined) camera.followingEnabled = true;
	if (camera.manualX === undefined) camera.manualX = canvas.width / 2;
	if (camera.manualY === undefined) camera.manualY = canvas.height / 2;
	if (camera.shakeX === undefined) camera.shakeX = 0;
	if (camera.shakeY === undefined) camera.shakeY = 0;
	if (camera.shakeIntensity === undefined) camera.shakeIntensity = 0;
	if (camera.shakeDecay === undefined) camera.shakeDecay = 0.9;
}

startButton.addEventListener("click", () => {
  	startGame();
});

function startGame() {
	if (gameStarted) return;

	startScreen.style.display = "none";
	audioControls.style.display = "block";

	// Initialize camera properties
	initializeCameraProperties();

	gameStarted = true;
	init();
	animate();
}

const init = () => {
	ballObjects = [];
	ringObjects = [];

	// Start with one ball
	for (let i = 0; i < 1; i++) {
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

	console.log("🚀 Memory-optimized game initialized!");
	console.log(`💾 Can handle up to ${MAX_BALLS} balls efficiently`);
};

// Efficient performance monitoring
function monitorPerformance() {
	frameCount++;
	const currentTime = performance.now();

	// Check FPS and adjust camera every second
	if (currentTime - lastFrameTime >= 1000) {
		const fps = Math.round((frameCount * 1000) / (currentTime - lastFrameTime));

		// Dynamic camera adjustment
		if (fps < 30) {
			camera.smoothing = 0.2;
		} else if (fps < 45) {
			camera.smoothing = 0.15;
		} else if (fps < 55) {
			camera.smoothing = 0.1;
		} else {
			camera.smoothing = 0.08;
		}

		frameCount = 0;
		lastFrameTime = currentTime;

		// Log memory stats every 10 seconds
		if (currentTime - lastMemoryLog >= 10000) {
		console.log(`🎯 FPS: ${fps} | Camera: ${camera.smoothing}`);
		logMemoryStats();
		lastMemoryLog = currentTime;
		}
	}

	// Memory cleanup every 5 seconds
		if (currentTime - lastMemoryCleanup >= 100000) {
			cleanupMemory();
			lastMemoryCleanup = currentTime;
		}
	}

	// Batch processing for better performance
	function updateBallsBatch(startIndex, batchSize) {
	const endIndex = Math.min(startIndex + batchSize, ballObjects.length);

	for (let i = startIndex; i < endIndex; i++) {
		if (ballObjects[i]) {
			ballObjects[i].update();

			// Check collisions with rings
			ringObjects.forEach((ring) => {
				ring.checkCollision(ballObjects[i]);
			});
		}
	}

	return endIndex;
}

const animate = () => {
	if (!gameStarted) return;

	animationId = requestAnimationFrame(animate);

	// Performance monitoring
	monitorPerformance();

	c.clearRect(0, 0, canvas.width, canvas.height);

	// UPDATED: Camera follows first ball only if following is enabled
	if (ballObjects.length > 0) {
		updateCamera(ballObjects[0].x, ballObjects[0].y);
	} else {
		// No balls, just update camera for manual movement/shake
		updateCamera();
	}

	applyCameraTransform();

	// Process balls in batches for better performance
	const batchSize = ballObjects.length > 200 ? 50 : ballObjects.length;
	let processedBalls = 0;

	while (processedBalls < ballObjects.length) {
		processedBalls = updateBallsBatch(processedBalls, batchSize);
	}

	// Update rings and remove deleted ones
	for (let i = ringObjects.length - 1; i >= 0; i--) {
		ringObjects[i].update();
		if (ringObjects[i].shouldDelete) {
			ringObjects.splice(i, 1);
		}
	}

	resetCameraTransform();

	// Performance info display
	// drawPerformanceInfo();

	// Patrick image
	const worldMouseX = mouse.x;
	const worldMouseY = mouse.y;

	applyCameraTransform();
	c.drawImage(patrickImage, worldMouseX, worldMouseY, 25, 25);
	resetCameraTransform();
};

// // Enhanced performance display with camera status
// function drawPerformanceInfo() {
// 	c.save();
// 	c.fillStyle = "rgba(0, 0, 0, 0.8)";
// 	c.fillRect(10, 10, 300, 180); // Increased width and height

// 	c.fillStyle = "#00eaff";
// 	c.font = "bold 14px Arial";
// 	c.fillText(`MEMORY-OPTIMIZED MODE`, 20, 30);

// 	c.font = "12px Arial";
// 	c.fillText(`Balls: ${ballObjects.length}/${MAX_BALLS}`, 20, 50);
// 	c.fillText(`Camera Speed: ${camera.smoothing.toFixed(2)}x`, 20, 65);
// 	c.fillText(`Rings: ${ringObjects.length}`, 20, 80);

// 	// Camera following status with better error handling
// 	const isFollowing = camera.followingEnabled !== false; // Default to true if undefined
// 	const followingColor = isFollowing ? "#44ff44" : "#ffaa44";
// 	c.fillStyle = followingColor;
// 	c.fillText(`Camera: ${isFollowing ? "FOLLOWING" : "MANUAL"}`, 20, 95);

// 	// Memory usage indicator
// 	const memoryLoad = ballObjects.length / MAX_BALLS;
// 	const memoryColor =
// 		memoryLoad > 0.8 ? "#ff4444" : memoryLoad > 0.5 ? "#ffaa44" : "#44ff44";
// 	const memoryStatus =
// 		memoryLoad > 0.8 ? "HIGH" : memoryLoad > 0.5 ? "MEDIUM" : "LOW";

// 	c.fillStyle = memoryColor;
// 	c.fillText(`Memory Load: ${memoryStatus}`, 20, 110);

// 	// Enhanced performance tips
// 	c.fillStyle = "#888888";
// 	c.font = "10px Arial";
// 	c.fillText(`Press 'F' to toggle camera following`, 20, 130);
// 	c.fillText(`Press 'R' to center camera (manual mode)`, 20, 145);
// 	c.fillText(`WASD/Arrows: Move camera (manual mode)`, 20, 160);
// 	c.fillText(
// 		`Current mode: ${isFollowing ? "Following first ball" : "Manual control"}`,
// 		20,
// 		175
// 	);
// 	c.restore();
// }

// Memory stress test function
function spawnBallBurst(count = 50) {
	console.log(`Spawning ${count} balls for stress test...`);

	for (let i = 0; i < count && ballObjects.length < MAX_BALLS; i++) {
		const x = canvas.width / 2 + (Math.random() - 0.5) * 200;
		const y = canvas.height / 2 + (Math.random() - 0.5) * 200;
		const radius = 6 + Math.random() * 8;
		const color = randomColor(colors);

		const newBall = new ball(x, y, radius, color);
		newBall.velocity.x = (Math.random() - 0.5) * 15;
		newBall.velocity.y = (Math.random() - 0.5) * 15;
		ballObjects.push(newBall);
	}

	console.log(`Total balls: ${ballObjects.length}/${MAX_BALLS}`);
	}

	// Advanced cleanup for extreme ball counts
	function aggressiveCleanup() {
	console.log("Performing aggressive cleanup...");

	// Remove balls that are moving very slowly (likely stuck)
	for (let i = ballObjects.length - 1; i >= 0; i--) {
		const ball = ballObjects[i];
		const speed = Math.sqrt(
			ball.velocity.x * ball.velocity.x + ball.velocity.y * ball.velocity.y
		);

		if (speed < 0.5) {
			// Very slow balls
			ballObjects.splice(i, 1);
		}
	}

	// If still too many, remove oldest balls
	if (ballObjects.length > MAX_BALLS * 0.8) {
		const toRemove = Math.floor(ballObjects.length * 0.2);
		ballObjects.splice(0, toRemove);
		console.log(`Removed ${toRemove} oldest balls`);
	}

	// Force garbage collection hint
	if (window.gc) {
		window.gc();
	}

	console.log(`Cleanup complete. Balls remaining: ${ballObjects.length}`);
}

// Event Listeners
addEventListener("mousemove", (event) => {
  mouse.x = event.clientX;
  mouse.y = event.clientY;
});

addEventListener("resize", () => {
  resizeCanvas();
  if (gameStarted) {
    // Reinitialize camera properties after resize
    initializeCameraProperties();
    init();
  }
});

// Enhanced keyboard controls with camera following
addEventListener("keydown", (event) => {
	if (!gameStarted) {
		if (event.key === " " || event.key === "Enter") {
			event.preventDefault();
			startGame();
		}
		return;
	}

	switch (event.key.toLowerCase()) {
		case "1":
			camera.smoothing = 0.01;
			console.log("📷 Camera smoothing: Ultra Slow (0.01)");
			break;
		case "2":
			camera.smoothing = 0.08;
			console.log("📷 Camera smoothing: Normal (0.08)");
			break;
		case "3":
			camera.smoothing = 0.15;
			console.log("📷 Camera smoothing: Fast (0.15)");
			break;
		case "4":
			audioControlVisibility = !audioControlVisibility;
			audioControls.style.display = audioControlVisibility ? "block" : "none";
			break;
		case "5":
			// Manual memory cleanup
			cleanupMemory();
			console.log("🧹 Manual cleanup performed!");
			break;
		case "6":
			// Memory stats
			logMemoryStats();
			break;
		case "7":
			// Reset to single ball
			if (ballObjects.length > 1) {
				const firstBall = ballObjects[0];
				ballObjects = [firstBall];
				console.log("🔄 Reset to single ball!");
			}
			break;
		case "8":
			// Spawn 10 balls for testing
			spawnBallBurst(10);
			break;
		case "9":
			// Spawn 100 balls for stress test
			spawnBallBurst(100);
			break;
		case "0":
			// Spawn 500 balls for extreme stress test
			spawnBallBurst(500);
			break;
		case "f": 
			const wasFollowing = toggleCameraFollowing();
			console.log(
				`Camera following toggled: ${wasFollowing ? "ON" : "OFF"}`
			);
			break;
		case "r":
			if (camera.followingEnabled === false) {
				centerCamera();
			} else {
				console.log(
				"Camera is following - disable following first with 'F'"
				);
			}
			break;
		case "arrowup": 
		case "w":
			event.preventDefault();
			if (camera.followingEnabled === false) {
				moveCameraManually(0, -50);
				console.log("Camera moved up");
			} else {
				console.log("Press 'F' to disable following first");
			}
			break;
		case "arrowdown": 
		case "s":
			event.preventDefault();
			if (camera.followingEnabled === false) {
				moveCameraManually(0, 50);
				console.log("Camera moved down");
			} else {
				console.log("Press 'F' to disable following first");
			}
			break;
		case "arrowleft": 
		case "a":
			event.preventDefault();
			if (camera.followingEnabled === false) {
				moveCameraManually(-50, 0);
				console.log("Camera moved left");
			} else {
				console.log("Press 'F' to disable following first");
			}
			break;
		case "arrowright": 
		case "d":
			event.preventDefault();
			if (camera.followingEnabled === false) {
				moveCameraManually(50, 0);
				console.log("Camera moved right");
			} else {
				console.log("Press 'F' to disable following first");
			}
			break;
		case "m":
			// Detailed memory stats
			logMemoryStats();
			console.log(
				`Browser Memory Usage: ${
				(performance.memory?.usedJSHeapSize / 1024 / 1024)?.toFixed(2) ||
				"N/A"
				} MB`
			);
			break;
		case "c":
			// Aggressive cleanup
			aggressiveCleanup();
			break;
		case "t":
			// Toggle trails (for performance)
			console.log("Trail rendering toggled");
			break;
		case " ":
			event.preventDefault();
			addScreenShake(20);
			break;
	}
});

// Prevent space bar page scroll
addEventListener("keydown", (event) => {
	if (event.key === " ") {
		event.preventDefault();
	}
});

// Memory monitoring
setInterval(() => {
	if (gameStarted && performance.memory) {
		const memUsage = performance.memory.usedJSHeapSize / 1024 / 1024;

		// Auto-cleanup if memory usage gets too high
		if (memUsage > 100 && ballObjects.length > 100) {
			console.log(
				`High memory usage: ${memUsage.toFixed(
				2
				)}MB - Auto cleanup triggered`
			);
			aggressiveCleanup();
		}
	}
}, 5000);

// Cleanup on page unload
window.addEventListener("beforeunload", () => {
	cleanup();
	console.log("Page cleanup completed");
});

// Enhanced performance tips in console
console.log(`
MEMORY-OPTIMIZED BALL SYSTEM
================================

CONTROLS:
1-3: Camera speed
4: Toggle audio controls  
5: Manual cleanup
6: Memory stats
7: Reset to 1 ball
8: Spawn 10 balls
9: Spawn 100 balls (stress test)
0: Spawn 500 balls (extreme test)
F: Toggle camera following 
R: Center camera (manual mode)
WASD/Arrows: Move camera (manual mode)
M: Detailed memory info
C: Aggressive cleanup
Space: Screen shake

CAMERA CONTROLS:
- Press 'F' to toggle between following and manual camera
- In manual mode, use WASD or arrow keys to move camera
- Press 'R' to center camera when in manual mode
- Camera status shown in performance panel
`);
