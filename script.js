const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game Constants
const GAME_WIDTH = 600;
const GAME_HEIGHT = 800;
const GRAVITY = 0.2; // Reduced from 0.4
const MAX_FALL_SPEED = 6; // Cap falling speed
const PLAYER_SPEED = 4; // Reduced from 5
const JUMP_FORCE = -8; // For spring
let PLATFORM_SPEED_INITIAL = 2;
let PLATFORM_SPAWN_INTERVAL = 100; // Frames
const MAX_HP = 12;

// DOM Elements
const scoreEl = document.getElementById('floor-count');
const hpFillEl = document.getElementById('hp-fill');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreEl = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');

// Game State
let gameRunning = false;
let score = 0;
let totalDistance = 0; // Track total distance for score
let frames = 0;
let platformSpeed = PLATFORM_SPEED_INITIAL;
let platforms = [];
let keys = { ArrowLeft: false, ArrowRight: false };
let currentDifficulty = 'normal';

// Platform Types
const PLATFORM_TYPES = {
    NORMAL: 'normal',
    SPIKE: 'spike',
    CONVEYOR_LEFT: 'conveyor_left',
    CONVEYOR_RIGHT: 'conveyor_right',
    FAKE: 'fake',
    SPRING: 'spring'
};

// Assets (Simple shapes for now, can be replaced with images)
const COLORS = {
    [PLATFORM_TYPES.NORMAL]: '#aaaaaa',
    [PLATFORM_TYPES.SPIKE]: '#666666', // Spikes drawn separately
    [PLATFORM_TYPES.CONVEYOR_LEFT]: '#55aaff',
    [PLATFORM_TYPES.CONVEYOR_RIGHT]: '#ffaa55',
    [PLATFORM_TYPES.FAKE]: '#dddddd',
    [PLATFORM_TYPES.SPRING]: '#55ff55'
};

class Player {
    constructor() {
        this.width = 30;
        this.height = 30;
        this.x = GAME_WIDTH / 2 - this.width / 2;
        this.y = 100;
        this.vx = 0;
        this.vy = 0;
        this.hp = MAX_HP;
        this.onGround = false;
        this.currentPlatform = null;
        this.invincible = 0; // Frames of invincibility after damage
    }

    update() {
        // Horizontal Movement
        this.vx = 0;
        if (keys.ArrowLeft) {
            this.vx -= PLAYER_SPEED;
        }
        if (keys.ArrowRight) {
            this.vx += PLAYER_SPEED;
        }

        // Apply conveyor effect if on ground
        if (this.onGround && this.currentPlatform) {
            if (this.currentPlatform.type === PLATFORM_TYPES.CONVEYOR_LEFT) {
                this.vx -= 2; // Base conveyor speed
            } else if (this.currentPlatform.type === PLATFORM_TYPES.CONVEYOR_RIGHT) {
                this.vx += 2; // Base conveyor speed
            }
        }

        this.x += this.vx;

        // Wall collision
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > GAME_WIDTH) this.x = GAME_WIDTH - this.width;

        // Gravity
        this.vy += GRAVITY;
        if (this.vy > MAX_FALL_SPEED) {
            this.vy = MAX_FALL_SPEED;
        }
        this.y += this.vy;

        // Ceiling collision (Spikes at top)
        if (this.y < 0) {
            this.y = 0;
            this.vy = 0;
            this.takeDamage(5); // Hit ceiling spikes (Increased from 5, kept same but high enough)
        }

        // Floor collision (Game Over)
        if (this.y > GAME_HEIGHT) {
            gameOver();
        }

        // Platform Collision
        this.onGround = false;
        // We only check collision if falling down
        if (this.vy > 0) {
            for (let platform of platforms) {
                if (!platform.active) continue; // Skip inactive platforms (Fake ones that disappeared)
                if (
                    this.x < platform.x + platform.width &&
                    this.x + this.width > platform.x &&
                    this.y + this.height > platform.y &&
                    this.y + this.height < platform.y + platform.height + 10 // Tolerance
                ) {
                    // Hit platform
                    this.y = platform.y - this.height;
                    this.vy = platform.speed; // Move with platform
                    this.onGround = true;
                    this.currentPlatform = platform;
                    platform.onCollide(this);
                    break;
                }
            }
        }

        // Removed old conveyor logic block from here as it's now in the beginning of update()

        // Invincibility frame reduction
        if (this.invincible > 0) this.invincible--;
    }

    draw() {
        ctx.fillStyle = this.invincible > 0 && Math.floor(frames / 5) % 2 === 0 ? 'rgba(255, 255, 0, 0.5)' : '#ffcc00';
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Eyes
        ctx.fillStyle = 'black';
        if (keys.ArrowLeft) {
            ctx.fillRect(this.x + 5, this.y + 8, 4, 4);
        } else if (keys.ArrowRight) {
            ctx.fillRect(this.x + 21, this.y + 8, 4, 4);
        } else {
            ctx.fillRect(this.x + 8, this.y + 8, 4, 4);
            ctx.fillRect(this.x + 18, this.y + 8, 4, 4);
        }
    }

    takeDamage(amount) {
        if (this.invincible > 0) return;
        this.hp -= amount;
        this.invincible = 60; // 1 second invincibility
        updateHP();
        if (this.hp <= 0) {
            gameOver();
        }
    }

    heal(amount) {
        this.hp = Math.min(this.hp + amount, MAX_HP);
        updateHP();
    }
}

class Platform {
    constructor(y) {
        this.width = 100;
        this.height = 15;
        this.x = Math.random() * (GAME_WIDTH - this.width);
        this.y = y;
        this.speed = -platformSpeed; // Moves up
        this.type = this.randomType();
        this.active = true; // For fake platforms
    }

    randomType() {
        const rand = Math.random();
        if (score < 10) return PLATFORM_TYPES.NORMAL; // Easy start

        if (rand < 0.6) return PLATFORM_TYPES.NORMAL;
        if (rand < 0.7) return PLATFORM_TYPES.SPIKE;
        if (rand < 0.8) return PLATFORM_TYPES.CONVEYOR_LEFT;
        if (rand < 0.9) return PLATFORM_TYPES.CONVEYOR_RIGHT;
        if (rand < 0.95) return PLATFORM_TYPES.FAKE;
        return PLATFORM_TYPES.SPRING;
    }

    update() {
        this.y += this.speed;
    }

    draw() {
        if (!this.active) return;

        ctx.fillStyle = COLORS[this.type];
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Special drawing for Spikes
        if (this.type === PLATFORM_TYPES.SPIKE) {
            ctx.fillStyle = '#888';
            // Draw spikes on top
            for (let i = 0; i < this.width; i += 10) {
                ctx.beginPath();
                ctx.moveTo(this.x + i, this.y);
                ctx.lineTo(this.x + i + 5, this.y - 10);
                ctx.lineTo(this.x + i + 10, this.y);
                ctx.fill();
            }
        }

        // Conveyor arrows
        if (this.type === PLATFORM_TYPES.CONVEYOR_LEFT) {
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.fillText('<<', this.x + 10, this.y + 12);
            ctx.fillText('<<', this.x + 60, this.y + 12);
        } else if (this.type === PLATFORM_TYPES.CONVEYOR_RIGHT) {
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.fillText('>>', this.x + 10, this.y + 12);
            ctx.fillText('>>', this.x + 60, this.y + 12);
        }
    }

    onCollide(player) {
        if (!this.active) return;

        if (this.type === PLATFORM_TYPES.NORMAL ||
            this.type === PLATFORM_TYPES.CONVEYOR_LEFT ||
            this.type === PLATFORM_TYPES.CONVEYOR_RIGHT) {
            player.heal(0.05); // Reduced from 1 to make healing much slower
        } else if (this.type === PLATFORM_TYPES.SPIKE) {
            player.takeDamage(5); // Increased from 4
        } else if (this.type === PLATFORM_TYPES.FAKE) {
            this.active = false; // Disappear
            player.onGround = false; // Fall through immediately
            player.currentPlatform = null;
        } else if (this.type === PLATFORM_TYPES.SPRING) {
            player.vy = JUMP_FORCE;
            player.heal(0.05); // Reduced from 1
        }
    }
}

let player;

// Expose startGame to global scope for HTML buttons
window.startGame = function (difficulty) {
    currentDifficulty = difficulty;

    // Set parameters based on difficulty
    if (difficulty === 'easy') {
        PLATFORM_SPEED_INITIAL = 1.2; // Reduced from 1.5
        PLATFORM_SPAWN_INTERVAL = 130;
    } else if (difficulty === 'normal') {
        PLATFORM_SPEED_INITIAL = 1.8; // Reduced from 2
        PLATFORM_SPAWN_INTERVAL = 110;
    } else if (difficulty === 'hard') {
        PLATFORM_SPEED_INITIAL = 2.5; // Reduced from 3
        PLATFORM_SPAWN_INTERVAL = 90;
    }

    initGame();
}

function initGame() {
    player = new Player();
    platforms = [];
    score = 0;
    totalDistance = 0;
    frames = 0;
    platformSpeed = PLATFORM_SPEED_INITIAL;
    gameRunning = true;

    // Initial platforms
    for (let i = 0; i < 6; i++) {
        let p = new Platform(200 + i * 120);
        p.type = PLATFORM_TYPES.NORMAL; // Start safe
        platforms.push(p);
    }

    updateHP();
    scoreEl.innerText = '0';
    startScreen.classList.remove('active');
    gameOverScreen.classList.remove('active');

    requestAnimationFrame(gameLoop);
}

function gameLoop() {
    if (!gameRunning) return;

    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Draw Ceiling Spikes
    ctx.fillStyle = '#ff4444';
    for (let i = 0; i < GAME_WIDTH; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + 10, 20);
        ctx.lineTo(i + 20, 0);
        ctx.fill();
    }

    // Update and Draw Platforms
    // Update score based on distance
    totalDistance += platformSpeed;
    score = Math.floor(totalDistance / 200); // 1 floor per 200 pixels
    scoreEl.innerText = score;

    if (frames % PLATFORM_SPAWN_INTERVAL === 0) {
        platforms.push(new Platform(GAME_HEIGHT));

        // Increase difficulty slower
        if (score > 0 && score % 20 === 0) { // Check score for difficulty
            // Cap max speed
            if (platformSpeed < 5) {
                platformSpeed += 0.1;
            }
        }
    }

    for (let i = platforms.length - 1; i >= 0; i--) {
        let p = platforms[i];
        p.speed = -platformSpeed;
        p.update();
        p.draw();

        if (p.y < -20) {
            platforms.splice(i, 1);
        }
    }

    // Update and Draw Player
    player.update();
    player.draw();

    frames++;
    requestAnimationFrame(gameLoop);
}

function updateHP() {
    const pct = (player.hp / MAX_HP) * 100;
    hpFillEl.style.width = `${pct}%`;
    if (pct < 30) {
        hpFillEl.style.backgroundColor = '#ff0000';
    } else if (pct < 60) {
        hpFillEl.style.backgroundColor = '#ffff00';
    } else {
        hpFillEl.style.backgroundColor = '#00ff00';
    }
}

function gameOver() {
    gameRunning = false;
    finalScoreEl.innerText = score;
    gameOverScreen.classList.add('active');
}

// Input Handling
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !gameRunning) {
        // Space restarts with last difficulty if game over, or normal if start screen
        if (gameOverScreen.classList.contains('active')) {
            window.startGame(currentDifficulty);
        } else if (startScreen.classList.contains('active')) {
            window.startGame('normal');
        }
    }
    if (e.code === 'ArrowLeft') keys.ArrowLeft = true;
    if (e.code === 'ArrowRight') keys.ArrowRight = true;
});

window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft') keys.ArrowLeft = false;
    if (e.code === 'ArrowRight') keys.ArrowRight = false;
});

restartBtn.addEventListener('click', () => {
    gameOverScreen.classList.remove('active');
    startScreen.classList.add('active');
    // Reset game state but don't start yet
    gameRunning = false;
});

// Mobile Controls
const btnLeft = document.getElementById('btn-left');
const btnRight = document.getElementById('btn-right');

const handleLeftStart = (e) => {
    e.preventDefault();
    keys.ArrowLeft = true;
};
const handleLeftEnd = (e) => {
    e.preventDefault();
    keys.ArrowLeft = false;
};
const handleRightStart = (e) => {
    e.preventDefault();
    keys.ArrowRight = true;
};
const handleRightEnd = (e) => {
    e.preventDefault();
    keys.ArrowRight = false;
};

btnLeft.addEventListener('touchstart', handleLeftStart, { passive: false });
btnLeft.addEventListener('touchend', handleLeftEnd, { passive: false });
btnLeft.addEventListener('mousedown', handleLeftStart);
btnLeft.addEventListener('mouseup', handleLeftEnd);
btnLeft.addEventListener('mouseleave', handleLeftEnd);

btnRight.addEventListener('touchstart', handleRightStart, { passive: false });
btnRight.addEventListener('touchend', handleRightEnd, { passive: false });
btnRight.addEventListener('mousedown', handleRightStart);
btnRight.addEventListener('mouseup', handleRightEnd);
btnRight.addEventListener('mouseleave', handleRightEnd);
