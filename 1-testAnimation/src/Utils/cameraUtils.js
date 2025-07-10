// Camera utility functions
import { c, canvas } from "../main";
import { camera } from "../Data/screen";

export function updateCamera(targetX, targetY) {
    camera.targetX = targetX - canvas.width / 2;
    camera.targetY = targetY - canvas.height / 2;

    camera.x += (camera.targetX - camera.x) * camera.smoothing;
    camera.y += (camera.targetY - camera.y) * camera.smoothing;

    // Handle screen shake
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
