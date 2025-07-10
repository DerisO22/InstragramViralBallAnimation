import { c, canvas } from "./main"
import { noteFrequencies } from "./Data/noteFrequencies";
import { melodies } from "./Data/melodies";

// const bounceSound = new Audio('/bounce.wav')
// bounceSound.volume = 0.03;

// Choose which melody to use (change this to switch melodies)
const melodySequence = melodies.furElise;

// Function to switch melodies dynamically
function switchMelody(melodyName) {
    if (melodies[melodyName]) {
        melodySequence.length = 0;
        melodySequence.push(...melodies[melodyName]); 
        currentNoteIndex = 0;
        console.log(`Switched to: ${melodyName}`);
    }
}

// Global melody tracker
let currentNoteIndex = 0;

// Audio context for generating tones
let audioContext;
let gainNode;
let isAudioInitialized = false;

// Initialize audio context
function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        gainNode = audioContext.createGain();
        gainNode.connect(audioContext.destination);
        gainNode.gain.value = 0.1; 
        isAudioInitialized = true;
    }
}

// Auto-initialize audio on first user interaction
function enableAudioOnInteraction() {
    if (!isAudioInitialized) {
        initAudio();
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
        console.log('Audio enabled! 🎵');
        
        // Remove the event listeners after first interaction
        document.removeEventListener('click', enableAudioOnInteraction);
        document.removeEventListener('keydown', enableAudioOnInteraction);
        document.removeEventListener('touchstart', enableAudioOnInteraction);
        document.removeEventListener('mousemove', enableAudioOnInteraction);
    }
}

// Add event listeners for any user interaction
document.addEventListener('click', enableAudioOnInteraction);
document.addEventListener('keydown', enableAudioOnInteraction);
document.addEventListener('touchstart', enableAudioOnInteraction);
document.addEventListener('mousemove', enableAudioOnInteraction);

// Show user instruction for audio
function showAudioPrompt() {
    if (!isAudioInitialized) {
        const promptDiv = document.createElement('div');
        promptDiv.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 15px 25px;
                border-radius: 10px;
                font-family: Arial, sans-serif;
                z-index: 1000;
                text-align: center;
                border: 2px solid #00eaff;
            ">
                🎵 <strong>Click anywhere or move your mouse to enable sound!</strong> 🎵
            </div>
        `;
        document.body.appendChild(promptDiv);
        
        // Remove prompt after audio is enabled
        const checkAudio = setInterval(() => {
            if (isAudioInitialized) {
                promptDiv.remove();
                clearInterval(checkAudio);
            }
        }, 100);
    }
}

// Show prompt when page loads
setTimeout(showAudioPrompt, 1000);

// Play a musical note
function playNote(frequency, duration = 0.3) {
    if (!isAudioInitialized) {
        console.log('Audio not yet enabled - waiting for user interaction');
        return;
    }
    
    // Resume audio context if it's suspended
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    
    const oscillator = audioContext.createOscillator();
    const noteGain = audioContext.createGain();
    
    oscillator.connect(noteGain);
    noteGain.connect(gainNode);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine'; 
    
    // Create a smooth envelope
    const now = audioContext.currentTime;
    noteGain.gain.setValueAtTime(0, now);
    noteGain.gain.linearRampToValueAtTime(0.3, now + 0.01);
    noteGain.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    oscillator.start(now);
    oscillator.stop(now + duration);
}

// Play next note in sequence
function playNextNote() {
    const noteName = melodySequence[currentNoteIndex];
    const frequency = noteFrequencies[noteName];
    
    if (frequency) {
        playNote(frequency);
    }
    
    // Move to next note, loop back to beginning when sequence ends
    currentNoteIndex = (currentNoteIndex + 1) % melodySequence.length;
}


// Particle system for impact effects
class Particle {
    constructor(x, y, velocityX, velocityY, size, life) {
        this.x = x
        this.y = y
        this.velocityX = velocityX
        this.velocityY = velocityY
        this.size = size
        this.life = life
        this.maxLife = life
        this.gravity = 0.1
        this.friction = 0.98
    }

    update() {
        this.x += this.velocityX
        this.y += this.velocityY
        this.velocityX *= this.friction
        this.velocityY *= this.friction
        this.velocityY += this.gravity
        this.life -= 1
        this.size *= 0.99
    }

    draw() {
        const alpha = this.life / this.maxLife
        const glowSize = this.size * 2
        
        // Outer glow
        c.save()
        c.globalAlpha = alpha * 0.3
        c.beginPath()
        c.arc(this.x, this.y, glowSize, 0, Math.PI * 2)
        c.fillStyle = '#ffffff'
        c.shadowBlur = 20
        c.shadowColor = '#00ffff'
        c.fill()
        c.restore()
        
        // Inner bright core
        c.save()
        c.globalAlpha = alpha * 0.8
        c.beginPath()
        c.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        c.fillStyle = '#ffffff'
        c.shadowBlur = 10
        c.shadowColor = '#ffffff'
        c.fill()
        c.restore()
    }

    isDead() {
        return this.life <= 0 || this.size <= 0.5
    }
}

// Global particle array
let particles = []

// Create impact particles
function createImpactParticles(x, y, intensity = 1) {
    const particleCount = Math.floor(8 * intensity)
    
    for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5
        const speed = 2 + Math.random() * 4
        const velocityX = Math.cos(angle) * speed
        const velocityY = Math.sin(angle) * speed
        const size = 2 + Math.random() * 3
        const life = 30 + Math.random() * 20
        
        particles.push(new Particle(x, y, velocityX, velocityY, size, life))
    }
    
    // Add some extra sparkles
    for (let i = 0; i < 5; i++) {
        const velocityX = (Math.random() - 0.5) * 8
        const velocityY = (Math.random() - 0.5) * 8
        const size = 1 + Math.random() * 2
        const life = 15 + Math.random() * 15
        
        particles.push(new Particle(x, y, velocityX, velocityY, size, life))
    }
}

// Update and draw all particles
function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update()
        particles[i].draw()
        
        if (particles[i].isDead()) {
            particles.splice(i, 1)
        }
    }
}

// Enhanced ball class with cool styling and particle effects
export class ball {
    constructor(x, y, radius, color){
        this.x = x
        this.y = y
        this.radius = radius
        this.color = color
        this.velocity = {
            x: 1,
            y: 7
        }
        this.friction = 0.999
        this.gravity = 0.2
        this.trail = []
        this.maxTrailLength = 20
        this.glowIntensity = 10.5
        this.pulseTime = 0
    }

    draw() {
        // Update pulse animation
        this.pulseTime += 0.1
        const pulse = Math.sin(this.pulseTime) * 0.1 + 1
        
        // Add current position to trail
        this.trail.push({ x: this.x, y: this.y, alpha: 1 })
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift()
        }
        
        // Draw trail
        for (let i = 0; i < this.trail.length; i++) {
            const trailPoint = this.trail[i]
            const alpha = (i / this.trail.length) * 0.6
            const trailRadius = this.radius * (i / this.trail.length) * 0.8
            
            c.save()
            c.globalAlpha = alpha
            c.beginPath()
            c.arc(trailPoint.x, trailPoint.y, trailRadius, 0, Math.PI * 2)
            c.fillStyle = this.color
            c.shadowBlur = 15
            c.shadowColor = this.color
            c.fill()
            c.restore()
        }
        
        // Outer glow layer
        c.save()
        c.globalAlpha = this.glowIntensity
        c.beginPath()
        c.arc(this.x, this.y, this.radius * 2.5 * pulse, 0, Math.PI * 2)
        
        // Create gradient for glow
        const gradient = c.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 2.5)
        gradient.addColorStop(0, this.color + '40')
        gradient.addColorStop(0.7, this.color + '20')
        gradient.addColorStop(1, this.color + '00')
        
        c.fillStyle = gradient
        c.fill()
        c.restore()
        
        // Middle energy ring
        c.save()
        c.beginPath()
        c.arc(this.x, this.y, this.radius * 1.8 * pulse, 0, Math.PI * 2)
        c.strokeStyle = '#ffffff'
        c.lineWidth = 2
        c.globalAlpha = 0.6
        c.shadowBlur = 10
        c.shadowColor = '#00ffff'
        c.stroke()
        c.restore()
        
        // Main ball body with neon effect
        c.save()
        c.beginPath()
        c.arc(this.x, this.y, this.radius * pulse, 0, Math.PI * 2)
        
        // Create radial gradient for the ball
        const ballGradient = c.createRadialGradient(
            this.x - this.radius * 0.3, this.y - this.radius * 0.3, 0,
            this.x, this.y, this.radius
        )
        ballGradient.addColorStop(0, '#ffffff')
        ballGradient.addColorStop(0.3, this.color)
        ballGradient.addColorStop(0.8, this.color)
        ballGradient.addColorStop(1, '#000000')
        
        c.fillStyle = ballGradient
        c.fill()
        
        // Neon border
        c.strokeStyle = '#ffffff'
        c.lineWidth = 3
        c.shadowBlur = 15
        c.shadowColor = this.color
        c.stroke()
        c.restore()
        
        // Core highlight
        c.save()
        c.beginPath()
        c.arc(this.x - this.radius * 0.3, this.y - this.radius * 0.3, this.radius * 0.4, 0, Math.PI * 2)
        c.fillStyle = '#ffffff'
        c.globalAlpha = 0.8
        c.shadowBlur = 5
        c.shadowColor = '#ffffff'
        c.fill()
        c.restore()
    }

    createCollisionEffect() {
        // Create particles at collision point
        createImpactParticles(this.x, this.y, 1.5)
        
        // Increase glow temporarily
        this.glowIntensity = Math.min(this.glowIntensity + 0.3, 1)
        
        // // Add screen shake effect
        // if (window.addScreenShake) {
        //     // Calculate shake intensity based on velocity
        //     const speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y)
        //     const shakeIntensity = Math.min(speed * 2, 15) // Scale shake with ball speed
        //     window.addScreenShake(shakeIntensity)
        // }
    }

    update() {
        this.draw()
        
        // Gradually reduce glow intensity
        this.glowIntensity = Math.max(this.glowIntensity - 0.02, 0.3)

        // Gravity and bottom collision
        if(this.y + this.radius + this.velocity.y > canvas.height){
            this.velocity.y = -this.velocity.y * this.friction;
            this.createCollisionEffect()
            playNextNote();
        } else {
            this.velocity.y += this.gravity;
        }

        // Top collision
        if(this.y - this.radius + this.velocity.y < 0){
            this.velocity.y = -this.velocity.y * this.friction;
            this.createCollisionEffect()
            playNextNote();
        }

        // Wall collision for left and right
        if(this.x + this.radius + this.velocity.x > canvas.width || this.x - this.radius + this.velocity.x < 0){
            this.velocity.x = -this.velocity.x * this.friction;
            this.createCollisionEffect()
            playNextNote();
        }

        this.x += this.velocity.x;
        this.y += this.velocity.y;
    }
}

// Enhanced circleRing class with camera integration
export class circleRing {
    constructor(x, y, radius, color, openingWidth){
        this.x = x
        this.y = y
        this.radius = radius
        this.color = color
        this.openingWidth = openingWidth
        this.rotationSpeed = Math.random() / 30
        this.currentRotation = Math.random()
        this.velocity = {
            x: 0,
            y: 3
        }
        this.lastCollisionTime = 0
        this.glowIntensity = 10.5
    }

    draw() {
        // Update glow
        this.glowIntensity = Math.max(this.glowIntensity - 0.02, 0.3)
        
        const startAngle = this.openingWidth + this.currentRotation
        const endAngle = Math.PI + this.currentRotation
        
        // Outer glow
        c.save()
        c.globalAlpha = this.glowIntensity * 0.6
        c.beginPath()
        c.arc(this.x, this.y, this.radius + 10, startAngle, endAngle, false)
        c.strokeStyle = this.color
        c.lineWidth = 15
        c.shadowBlur = 25
        c.shadowColor = this.color
        c.stroke()
        c.restore()
        
        // Main ring with neon effect
        c.save()
        c.beginPath()
        c.arc(this.x, this.y, this.radius, startAngle, endAngle, false)
        c.strokeStyle = 'white'
        c.lineWidth = 6
        c.shadowBlur = 15
        c.shadowColor = this.color
        c.stroke()
        c.restore()
        
        // Inner glow
        c.save()
        c.globalAlpha = 0.8
        c.beginPath()
        c.arc(this.x, this.y, this.radius, startAngle, endAngle, false)
        c.strokeStyle = this.color
        c.lineWidth = 3
        c.shadowBlur = 10
        c.shadowColor = this.color
        c.stroke()
        c.restore()
    }

    update() {
        this.draw()
        this.currentRotation += this.rotationSpeed
        // Update particles
        updateParticles()
    }

    checkCollision(ball) {
        const currentTime = Date.now()
        if (currentTime - this.lastCollisionTime < 50) {
            return
        }

        const dx = ball.x - this.x
        const dy = ball.y - this.y
        const distanceToCenter = Math.sqrt(dx * dx + dy * dy)
        
        let ballAngle = Math.atan2(dy, dx)
        if (ballAngle < 0) ballAngle += 2 * Math.PI
        
        let strokeStart = this.openingWidth + this.currentRotation
        let strokeEnd = Math.PI + this.currentRotation
        
        strokeStart = ((strokeStart % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI)
        strokeEnd = ((strokeEnd % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI)
        
        let hitStroke = false
        if (strokeStart < strokeEnd) {
            hitStroke = ballAngle >= strokeStart && ballAngle <= strokeEnd
        } else {
            hitStroke = ballAngle >= strokeStart || ballAngle <= strokeEnd
        }
        
        if (!hitStroke) return
        
        const strokeThickness = 6
        const innerRadius = this.radius - strokeThickness / 2
        const outerRadius = this.radius + strokeThickness / 2
        
        let collision = false
        let normalX = 0, normalY = 0
        
        if (distanceToCenter >= innerRadius - ball.radius && 
            distanceToCenter <= outerRadius + ball.radius) {
            
            if (distanceToCenter < this.radius) {
                collision = true
                const unitX = dx / distanceToCenter
                const unitY = dy / distanceToCenter
                
                const targetDistance = innerRadius - ball.radius - 1
                ball.x = this.x + unitX * targetDistance
                ball.y = this.y + unitY * targetDistance
                
                normalX = -unitX
                normalY = -unitY
            } else {
                collision = true
                const unitX = dx / distanceToCenter
                const unitY = dy / distanceToCenter
                
                const targetDistance = outerRadius + ball.radius + 1
                ball.x = this.x + unitX * targetDistance
                ball.y = this.y + unitY * targetDistance
                
                normalX = unitX
                normalY = unitY
            }
        }
        
        if (collision) {
            const dotProduct = ball.velocity.x * normalX + ball.velocity.y * normalY
            ball.velocity.x = ball.velocity.x - 2 * dotProduct * normalX
            ball.velocity.y = ball.velocity.y - 2 * dotProduct * normalY
            
            const speed = Math.sqrt(ball.velocity.x * ball.velocity.x + ball.velocity.y * ball.velocity.y)
            const minSpeed = 2
            if (speed < minSpeed) {
                const scale = minSpeed / speed
                ball.velocity.x *= scale
                ball.velocity.y *= scale
            }
            
            ball.velocity.x *= 1
            ball.velocity.y *= 1
            
            // Create collision effects
            ball.createCollisionEffect()
            createImpactParticles(ball.x, ball.y, 2)
            this.glowIntensity = 1
            
            // // Extra screen shake for ring collisions
            // if (window.addScreenShake) {
            //     window.addScreenShake(20) 
            // }
            
            playNextNote()
            this.lastCollisionTime = currentTime
        }
    }
}