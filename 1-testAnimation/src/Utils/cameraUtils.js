// Camera utility functions
import { c, canvas } from "../main";
import { camera } from "../Data/screen";

// Enhanced updateCamera function with following toggle support
export function updateCamera(targetX = null, targetY = null) {
  // Handle screen shake first
  if (camera.shakeIntensity > 0) {
    camera.shakeX = (Math.random() - 0.5) * camera.shakeIntensity;
    camera.shakeY = (Math.random() - 0.5) * camera.shakeIntensity;
    camera.shakeIntensity *= camera.shakeDecay;

    if (camera.shakeIntensity < 0.1) {
      camera.shakeIntensity = 0;
      camera.shakeX = 0;
      camera.shakeY = 0;
    }
  }

  // NEW: Check if camera following is enabled
  if (camera.followingEnabled && targetX !== null && targetY !== null) {
    // Follow the target (usually first ball)
    camera.targetX = targetX - canvas.width / 2;
    camera.targetY = targetY - canvas.height / 2;
  } else if (!camera.followingEnabled) {
    // Use manual camera position
    camera.targetX = camera.manualX - canvas.width / 2;
    camera.targetY = camera.manualY - canvas.height / 2;
  }

  // Smooth camera movement
  camera.x += (camera.targetX - camera.x) * camera.smoothing;
  camera.y += (camera.targetY - camera.y) * camera.smoothing;
}

// Toggle camera following
export function toggleCameraFollowing() {
  // Initialize followingEnabled if it doesn't exist
  if (camera.followingEnabled === undefined) {
    camera.followingEnabled = true;
  }

  camera.followingEnabled = !camera.followingEnabled;

  if (!camera.followingEnabled) {
    // When disabling following, center the camera
    centerCamera();
  }

  console.log(
    `📷 Camera following: ${camera.followingEnabled ? "ENABLED" : "DISABLED"}`
  );
  return camera.followingEnabled;
}

// Center camera on canvas
export function centerCamera() {
  // Initialize manual position properties if they don't exist
  if (camera.manualX === undefined) camera.manualX = 0;
  if (camera.manualY === undefined) camera.manualY = 0;

  camera.manualX = canvas.width / 2;
  camera.manualY = canvas.height / 2;
  camera.targetX = camera.manualX - canvas.width / 2;
  camera.targetY = camera.manualY - canvas.height / 2;
  camera.x = camera.targetX;
  camera.y = camera.targetY;
  console.log("📷 Camera centered");
}

// Manual camera movement
export function moveCameraManually(deltaX, deltaY) {
  // Initialize properties if they don't exist
  if (camera.followingEnabled === undefined) camera.followingEnabled = true;
  if (camera.manualX === undefined) camera.manualX = canvas.width / 2;
  if (camera.manualY === undefined) camera.manualY = canvas.height / 2;

  if (!camera.followingEnabled) {
    camera.manualX += deltaX;
    camera.manualY += deltaY;
    camera.targetX = camera.manualX - canvas.width / 2;
    camera.targetY = camera.manualY - canvas.height / 2;
  }
}

export function applyCameraTransform() {
  c.save();
  c.translate(-camera.x + camera.shakeX, -camera.y + camera.shakeY);
}

export function resetCameraTransform() {
  c.restore();
}

export function addScreenShake(intensity) {
  camera.shakeIntensity = Math.max(camera.shakeIntensity, intensity);
}
