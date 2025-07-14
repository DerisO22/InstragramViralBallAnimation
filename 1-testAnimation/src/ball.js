import { c, canvas } from "./main";
import { noteFrequencies, instruments } from "./Data/noteFrequencies";
import { melodies } from "./Data/melodies";
import { ballObjects } from "./main";
import { colors } from "./Data/screen.js";
import { randomColor } from "./Utils/util.js";

// ===== MEMORY OPTIMIZATION CONSTANTS =====
const MAX_BALLS = 2; 
const MAX_PARTICLES = 50;
const AUDIO_POOL_SIZE = 15; 
const TRAIL_UPDATE_INTERVAL = 3; 

// ===== OBJECT POOLS FOR MEMORY EFFICIENCY =====
class ObjectPool {
    constructor(createFn, resetFn, initialSize = 10) {
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.pool = [];
        this.active = [];

        // Pre-allocate objects
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(this.createFn());
        }
    }

    get() {
        let obj;
        if (this.pool.length > 0) {
            obj = this.pool.pop();
        } else {
            obj = this.createFn();
        }
        this.active.push(obj);
        return obj;
    }

    release(obj) {
        const index = this.active.indexOf(obj);
        if (index > -1) {
            this.active.splice(index, 1);
            this.resetFn(obj);
            this.pool.push(obj);
        }
    }

    clear() {
        this.active.length = 0;
        this.pool.length = 0;
    }
}

// ===== MEMORY-EFFICIENT AUDIO SYSTEM WITH PRIORITY =====
let audioContext;
let isAudioInitialized = false;
let currentInstrument = "piano";
let audioNodePool = [];
let activeAudioNodes = new Set();

// Song
let melodySequence = melodies.minecraftSweden;
let currentNoteIndex = 0;

function initAudio() {
    if (!isAudioInitialized) {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            isAudioInitialized = true;

            // Pre-create audio node pool
            createAudioNodePool();
        } catch (error) {
            console.error("Failed to initialize audio:", error);
        }
    }
}

function createAudioNodePool() {
    audioNodePool = [];
    for (let i = 0; i < AUDIO_POOL_SIZE; i++) {
        audioNodePool.push(createAudioNodeSet());
    }
}

function createAudioNodeSet() {
  const gainNode = audioContext.createGain();
  gainNode.connect(audioContext.destination);
  return { gainNode, oscillators: [], createdAt: Date.now() };
}

function getAudioNodeFromPool() {
    if (audioNodePool.length > 0) {
        return audioNodePool.pop();
    }
    return createAudioNodeSet();
}

function returnAudioNodeToPool(nodeSet) {
    // Clean up oscillators
    nodeSet.oscillators.forEach((osc) => {
        try {
            osc.disconnect();
        } catch (e) {
        // Oscillator already disconnected
        }
    });
    nodeSet.oscillators = [];

    // Reset gain
    nodeSet.gainNode.gain.cancelScheduledValues(0);
    nodeSet.gainNode.gain.value = 0;

    // Reset timestamp
    nodeSet.createdAt = Date.now();

    // Return to pool if not full
    if (audioNodePool.length < AUDIO_POOL_SIZE) {
        audioNodePool.push(nodeSet);
    }
}

// Add function to clean up old audio nodes
function cleanupOldAudioNodes() {
    // Convert Set to Array to iterate and potentially remove items
    const nodeArray = Array.from(activeAudioNodes);

    // Sort by creation time (oldest first)
    nodeArray.sort((a, b) => a.createdAt - b.createdAt);

    // Remove the oldest audio nodes if we have too many
    const maxToCleanup = Math.min(3, Math.floor(nodeArray.length * 0.3));

    for (let i = 0; i < maxToCleanup; i++) {
        const nodeSet = nodeArray[i];

        // Stop all oscillators in this node set
        nodeSet.oscillators.forEach((osc) => {
            try {
                osc.stop(audioContext.currentTime);
            } catch (e) {
                // Already stopped
            }
        });

        activeAudioNodes.delete(nodeSet);
        returnAudioNodeToPool(nodeSet);
    }
}

// MEMORY-EFFICIENT note synthesis with priority system
function playNote(frequency, duration = 0.5, velocity = 0.7, priority = false) {
    if (!isAudioInitialized || !audioContext) return;

    // Priority system: always allow audio for first few balls or high priority sounds
    const allowAudio =
        priority ||
        activeAudioNodes.size < AUDIO_POOL_SIZE ||
        ballObjects.length <= 10; 

    if (!allowAudio) {
        // If we have too many audio nodes and it's not priority,
        // try to clean up old ones first
        cleanupOldAudioNodes();

        // After cleanup, check again
        if (activeAudioNodes.size >= AUDIO_POOL_SIZE && ballObjects.length > 10) {
            return;
        }
    }

    const nodeSet = getAudioNodeFromPool();
    const instrument = instruments[currentInstrument];
    const now = audioContext.currentTime;

    // Mark when this node set was created for cleanup purposes
    nodeSet.createdAt = Date.now();
    activeAudioNodes.add(nodeSet);

    // Create fewer harmonics for memory efficiency, but more for priority sounds
    const maxHarmonics = priority
        ? Math.min(instrument.harmonics.length, 5)
        : Math.min(instrument.harmonics.length, 3);

    for (let i = 0; i < maxHarmonics; i++) {
        const amplitude = instrument.harmonics[i];
        const threshold = priority ? 0.05 : 0.1; 

        if (amplitude > threshold) {
            const oscillator = audioContext.createOscillator();
            oscillator.type = instrument.waveform;
            oscillator.frequency.setValueAtTime(frequency * (i + 1), now);

            oscillator.connect(nodeSet.gainNode);
            nodeSet.oscillators.push(oscillator);

            // Start oscillator
            oscillator.start(now);
            oscillator.stop(now + duration);

            // Clean up when done
            oscillator.onended = () => {
                if (nodeSet.oscillators.length === 1) {
                    // Last oscillator in this set
                    activeAudioNodes.delete(nodeSet);
                    returnAudioNodeToPool(nodeSet);
                }
            };
        }
    }

    // ADSR Envelope - better volume for priority sounds
    const baseVolume = priority ? 0.4 : 0.2;
    const volume = velocity * baseVolume;
    nodeSet.gainNode.gain.setValueAtTime(0, now);
    nodeSet.gainNode.gain.linearRampToValueAtTime(volume, now + 0.01);
    nodeSet.gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
}

// Keep original function signatures for compatibility
window.changeInstrument = function (instrumentName) {
    if (instruments[instrumentName]) {
        currentInstrument = instrumentName;
        console.log(`Switched to ${instrumentName} 🎹`);
    }
};

window.changeMelody = function (melodyName) {
    if (melodies[melodyName]) {
        melodySequence = melodies[melodyName];
        currentNoteIndex = 0;
        console.log(`Switched to ${melodyName} melody 🎵`);
    }
};

// Audio initialization (same as before)
function enableAudioOnInteraction() {
    if (!isAudioInitialized) {
        initAudio();
        if (audioContext.state === "suspended") {
            audioContext.resume();
        }

        document.removeEventListener("click", enableAudioOnInteraction);
        document.removeEventListener("keydown", enableAudioOnInteraction);
        document.removeEventListener("touchstart", enableAudioOnInteraction);
        document.removeEventListener("mousemove", enableAudioOnInteraction);
    }
}

document.addEventListener("click", enableAudioOnInteraction);
document.addEventListener("keydown", enableAudioOnInteraction);
document.addEventListener("touchstart", enableAudioOnInteraction);
document.addEventListener("mousemove", enableAudioOnInteraction);

function showAudioPrompt() {
    if (!isAudioInitialized) {
        const promptDiv = document.createElement("div");
        promptDiv.innerHTML = `
                <div style="
                    position: fixed;
                    top: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(0, 0, 0, 0.9);
                    color: white;
                    padding: 20px 30px;
                    border-radius: 15px;
                    font-family: Arial, sans-serif;
                    z-index: 1000;
                    text-align: center;
                    border: 2px solid #00eaff;
                    box-shadow: 0 0 20px rgba(0, 234, 255, 0.5);
                ">
                    🎵 <strong>Click anywhere to enable priority audio!</strong> 🎵<br>
                    <small style="opacity: 0.8;">First balls always get sound priority</small>
                </div>
            `;
        document.body.appendChild(promptDiv);

        const checkAudio = setInterval(() => {
        if (isAudioInitialized) {
            promptDiv.remove();
            clearInterval(checkAudio);
        }
        }, 100);
    }
}

setTimeout(showAudioPrompt, 1000);

// Modified playNextNote with priority for first few balls
function playNextNote(isPriorityBall = false) {
    const noteName = melodySequence[currentNoteIndex];
    const frequency = noteFrequencies[noteName];

    if (frequency) {
        // First 5 balls always get priority audio
        const priority = isPriorityBall || ballObjects.length <= 5;
        playNote(frequency, 0.2, 0.5, priority);
    }

    currentNoteIndex = (currentNoteIndex + 1) % melodySequence.length;
}

// ===== MEMORY-EFFICIENT PARTICLE SYSTEM =====
class Particle {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = 0;
        this.y = 0;
        this.velocityX = 0;
        this.velocityY = 0;
        this.size = 0;
        this.life = 0;
        this.maxLife = 0;
        this.active = false;
    }

    init(x, y, velocityX, velocityY, size, life) {
        this.x = x;
        this.y = y;
        this.velocityX = velocityX;
        this.velocityY = velocityY;
        this.size = size;
        this.life = life;
        this.maxLife = life;
        this.active = true;
    }

    update() {
        if (!this.active) return;

        this.x += this.velocityX;
        this.y += this.velocityY;
        this.velocityX *= 0.99;
        this.velocityY *= 0.99;
        this.velocityY += 0.05;
        this.life -= 1;
        this.size *= 0.98;

        if (this.life <= 0 || this.size <= 0.5) {
            this.active = false;
        }
    }

    draw() {
        if (!this.active) return;

        const alpha = this.life / this.maxLife;
        c.save();
        c.globalAlpha = alpha * 0.6;
        c.beginPath();
        c.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        c.fillStyle = "#ffffff";
        c.fill();
        c.restore();
    }
}

// Particle pool
const particlePool = new ObjectPool(
    () => new Particle(),
    (particle) => particle.reset(),
    MAX_PARTICLES
);

function createImpactParticles(x, y, intensity = 1) {
    const particleCount = Math.min(Math.floor(3 * intensity), 5); // Much fewer particles

    for (let i = 0; i < particleCount; i++) {
        const particle = particlePool.get();
        if (particle) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const speed = 1 + Math.random() * 2;
            const velocityX = Math.cos(angle) * speed;
            const velocityY = Math.sin(angle) * speed;
            const size = 1 + Math.random() * 2;
            const life = 10 + Math.random() * 10;

            particle.init(x, y, velocityX, velocityY, size, life);
        }
    }
}

function updateParticles() {
    particlePool.active.forEach((particle) => {
        particle.update();
        particle.draw();

        if (!particle.active) {
            particlePool.release(particle);
        }
    });
}

// ===== MEMORY-EFFICIENT BALL CLASS =====
export class ball {
    constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = { x: 7, y: 7 };
        this.friction = 0.999;
        this.gravity = 0.2;
        this.lastCollisionTime = 0;
        this.frameCount = 0;

        // Minimal trail for memory efficiency
        this.trail = new Array(5).fill().map(() => ({ x: 0, y: 0 }));
        this.trailIndex = 0;
    }

    draw() {
        this.frameCount++;

        // Update trail only occasionally
        if (this.frameCount % TRAIL_UPDATE_INTERVAL === 0) {
            this.trail[this.trailIndex].x = this.x;
            this.trail[this.trailIndex].y = this.y;
            this.trailIndex = (this.trailIndex + 1) % this.trail.length;
        }

        // Draw simple trail
        if (ballObjects.length < 100) {
            // Only draw trails when fewer balls
            c.save();
            c.globalAlpha = 0.3;
            c.strokeStyle = this.color;
            c.lineWidth = this.radius * 0.5;
            c.beginPath();
            c.moveTo(this.trail[0].x, this.trail[0].y);
            for (let i = 1; i < this.trail.length; i++) {
                c.lineTo(this.trail[i].x, this.trail[i].y);
            }
            c.stroke();
            c.restore();
        }

        // Draw ball - no expensive effects
        c.save();
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        c.fillStyle = this.color;
        c.fill();
        c.strokeStyle = "#ffffff";
        c.lineWidth = 1;
        c.stroke();
        c.restore();
    }

    createCollisionEffect() {
        // Much less frequent particle creation
        if (particlePool.active.length < MAX_PARTICLES && Math.random() < 0.3) {
            createImpactParticles(this.x, this.y, 0.3);
        }
    }

    update() {
        this.draw();

        const currentTime = Date.now();
        const canCollide = currentTime - this.lastCollisionTime > 100;

        // Boundary collisions with priority audio
        if (this.y + this.radius + this.velocity.y > canvas.height && canCollide) {
            this.velocity.y = -this.velocity.y * this.friction;
            this.createCollisionEffect();

            // UPDATED: Priority audio for first few balls
            const ballIndex = ballObjects.indexOf(this);
            const isPriorityBall = ballIndex < 5 || ballObjects.length <= 10;
            if (Math.random() < (isPriorityBall ? 0.8 : 0.1)) {
                playNextNote(isPriorityBall);
            }

            this.lastCollisionTime = currentTime;
        } else {
            this.velocity.y += this.gravity;
        }

        if (this.y - this.radius + this.velocity.y < 0 && canCollide) {
            this.velocity.y = -this.velocity.y * this.friction;
            this.createCollisionEffect();
            this.lastCollisionTime = currentTime;
        }

        if (
            (this.x + this.radius + this.velocity.x > canvas.width ||
            this.x - this.radius + this.velocity.x < 0) && canCollide
        ) {
            this.velocity.x = -this.velocity.x * this.friction;
            this.createCollisionEffect();

            // UPDATED: Priority audio for first few balls
            const ballIndex = ballObjects.indexOf(this);
            const isPriorityBall = ballIndex < 5 || ballObjects.length <= 10;
            if (Math.random() < (isPriorityBall ? 0.8 : 0.1)) {
                playNextNote(isPriorityBall);
            }

            this.lastCollisionTime = currentTime;
        }

        this.x += this.velocity.x;
        this.y += this.velocity.y;
    }
}

// ===== MEMORY-EFFICIENT RING CLASS =====
export class circleRing {
    constructor(x, y, radius, color, openingWidth) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.openingWidth = openingWidth;
        this.rotationSpeed = Math.random() / 30;
        this.currentRotation = Math.random();
        this.lastCollisionTime = 0;
        this.shouldDelete = false;
        this.ballPreviouslyOutside = true;
    }

    draw() {
        const startAngle = this.openingWidth + this.currentRotation;
        const endAngle = Math.PI + this.currentRotation;

        // Simplified ring drawing
        c.save();
        c.beginPath();
        c.arc(this.x, this.y, this.radius, startAngle, endAngle, false);
        c.strokeStyle = this.color;
        c.lineWidth = 6;
        c.stroke();
        c.restore();
    }

    update() {
        this.draw();
        this.currentRotation += this.rotationSpeed;
        updateParticles();
    }

    checkCollision(ballObj) {
        const currentTime = Date.now();

        // Much longer cooldown to prevent excessive spawning
        if (
            currentTime - this.lastCollisionTime < 500 ||
            ballObjects.length >= MAX_BALLS
        ) {
            return;
        }

        const dx = ballObj.x - this.x;
        const dy = ballObj.y - this.y;
        const distanceToCenter = Math.sqrt(dx * dx + dy * dy);

        let ballAngle = Math.atan2(dy, dx);
        if (ballAngle < 0) ballAngle += 2 * Math.PI;

        let strokeStart = this.openingWidth + this.currentRotation;
        let strokeEnd = Math.PI + this.currentRotation;

        strokeStart = ((strokeStart % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        strokeEnd = ((strokeEnd % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

        let inOpening = false;
        if (strokeStart < strokeEnd) {
            inOpening = !(ballAngle >= strokeStart && ballAngle <= strokeEnd);
        } else {
            inOpening = !(ballAngle >= strokeStart || ballAngle <= strokeEnd);
        }

        const strokeThickness = 6;
        const innerRadius = this.radius - strokeThickness / 2;
        const outerRadius = this.radius + strokeThickness / 2;

        const ballInRingArea =
        distanceToCenter >= innerRadius - ballObj.radius &&
        distanceToCenter <= outerRadius + ballObj.radius;

        if (inOpening && ballInRingArea) {
            if (this.ballPreviouslyOutside) {
                this.shouldDelete = true;
                createImpactParticles(ballObj.x, ballObj.y, 1);
            }
            this.ballPreviouslyOutside = false;
        } else {
            this.ballPreviouslyOutside = true;
        }

        if (currentTime - this.lastCollisionTime < 100 || inOpening) {
            return;
        }

        let collision = false;
        let normalX = 0,
        normalY = 0;

        if (
            distanceToCenter >= innerRadius - ballObj.radius &&
            distanceToCenter <= outerRadius + ballObj.radius
        ) {
            if (distanceToCenter < this.radius) {
                collision = true;
                const unitX = dx / distanceToCenter;
                const unitY = dy / distanceToCenter;

                ballObj.x = this.x + unitX * (innerRadius - ballObj.radius - 1);
                ballObj.y = this.y + unitY * (innerRadius - ballObj.radius - 1);

                normalX = -unitX;
                normalY = -unitY;
            } else {
                collision = true;
                const unitX = dx / distanceToCenter;
                const unitY = dy / distanceToCenter;

                ballObj.x = this.x + unitX * (outerRadius + ballObj.radius + 1);
                ballObj.y = this.y + unitY * (outerRadius + ballObj.radius + 1);

                normalX = unitX;
                normalY = unitY;
            }
        }

        if (collision) {
            const dotProduct =
            ballObj.velocity.x * normalX + ballObj.velocity.y * normalY;
            ballObj.velocity.x = ballObj.velocity.x - 2 * dotProduct * normalX;
            ballObj.velocity.y = ballObj.velocity.y - 2 * dotProduct * normalY;

            const speed = Math.sqrt(
                ballObj.velocity.x * ballObj.velocity.x +
                ballObj.velocity.y * ballObj.velocity.y
            );
            const minSpeed = 2;
            if (speed < minSpeed) {
                const scale = minSpeed / speed;
                ballObj.velocity.x *= scale;
                ballObj.velocity.y *= scale;
            }

            // CONTROLLED BALL SPAWNING
            if (ballObjects.length < MAX_BALLS) {
                const newBall = new ball(
                    canvas.width / 2 + (Math.random() - 0.5) * 100,
                    canvas.height / 2 + (Math.random() - 0.5) * 100,
                    8 + Math.random() * 4,
                    randomColor(colors)
                );
                newBall.velocity.x = (Math.random() - 0.5) * 10;
                newBall.velocity.y = (Math.random() - 0.5) * 10;
                ballObjects.push(newBall);
            }

            ballObj.createCollisionEffect();

            // UPDATED: Priority audio for ring collisions
            const ballIndex = ballObjects.indexOf(ballObj);
            const isPriorityBall = ballIndex < 5 || ballObjects.length <= 10;
            if (Math.random() < (isPriorityBall ? 0.9 : 0.2)) {
                playNextNote(isPriorityBall);
            }

            this.lastCollisionTime = currentTime;
        }
    }
}

// ===== MEMORY CLEANUP FUNCTIONS =====
export function cleanupMemory() {
    // Clean up off-screen balls
    const margin = 500;
    for (let i = ballObjects.length - 1; i >= 0; i--) {
        const ball = ballObjects[i];
        if (
            ball.x < -margin ||
            ball.x > canvas.width + margin ||
            ball.y < -margin ||
            ball.y > canvas.height + margin
        ) {
            ballObjects.splice(i, 1);
        }
    }

    // Force garbage collection hints
    if (ballObjects.length > 500) {
        // Keep only the most recent balls
        ballObjects.splice(0, ballObjects.length - 400);
    }

    // Clean up old audio nodes
    cleanupOldAudioNodes();
}

export function logMemoryStats() {
    console.log(`🧠 Memory Stats:
        🔵 Balls: ${ballObjects.length}/${MAX_BALLS}
        ✨ Active Particles: ${particlePool.active.length}/${MAX_PARTICLES}
        🔊 Active Audio Nodes: ${activeAudioNodes.size}/${AUDIO_POOL_SIZE}
        💾 Particle Pool: ${particlePool.pool.length} available
        🎵 Audio Pool: ${audioNodePool.length} available
        🎯 Priority Audio: First ${Math.min(5, ballObjects.length)} balls
    `);
}

// Cleanup function to call on page unload
export function cleanup() {
    particlePool.clear();
    audioNodePool = [];
    activeAudioNodes.clear();
    ballObjects.length = 0;

    if (audioContext) {
        audioContext.close();
    }
}

// Register cleanup
window.addEventListener("beforeunload", cleanup);

export { MAX_BALLS, MAX_PARTICLES };