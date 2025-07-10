import { c, canvas } from "../main";
import { camera } from "../Data/screen";

export function applyCameraTransform() {
    c.save();
    c.translate(camera.x + camera.shakeX, camera.y + camera.shakeY);
}

export function resetCameraTransform() {
    c.restore();
}

export function addScreenShake(intensity) {
    camera.shakeIntensity = Math.max(camera.shakeIntensity, intensity);
}

// Camera functions
export function updateCamera(targetX, targetY) {
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