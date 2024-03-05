document.addEventListener('DOMContentLoaded', (event) => {
    document.getElementById('startGameButton').addEventListener('click', function() {
        startBackgroundMusic();
        startGame();
        this.style.display = 'none'; // Hide the start button after clicking
    });
});

function startBackgroundMusic() {
    const backgroundMusic = document.getElementById('backgroundMusic');
    backgroundMusic.play().catch(error => console.error("Audio play failed:", error));
}

function startGame() {
    // Initialize or restart game elements here, e.g., setup game environment, reset variables
    // This is where you could call gameLoop or any initial setup functions you have
    createAsteroids();
    gameLoop();
}

document.addEventListener('keydown', keyDownHandler, false);
document.addEventListener('keyup', keyUpHandler, false);

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

let rightPressedP1 = false;
let leftPressedP1 = false;
let forwardPressedP1 = false;
let rightPressedP2 = false;
let leftPressedP2 = false;
let forwardPressedP2 = false;
let bullets = [];
let asteroids = [];
let notificationTimeout;
let startTime = Date.now();
let gameOver = false;

function detectCollision(obj1, obj2) {
    const dx = obj1.x - obj2.x;
    const dy = obj1.y - obj2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < obj1.size + obj2.size;
}

function showNotification(message, includeButton = false) {  // Adjust includeButton default to false
    const notification = document.createElement('div');
    notification.classList.add('notification');
    notification.textContent = message;
    notification.style.position = 'absolute';
    notification.style.top = '20px';
    notification.style.left = '50%';
    notification.style.transform = 'translate(-50%, 0)';
    notification.style.color = 'white';
    notification.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    notification.style.padding = '20px';
    notification.style.borderRadius = '5px';
    document.body.appendChild(notification);

    if (includeButton) {
        const button = document.createElement('button');
        button.textContent = 'Try Again';
        button.onclick = restartGame;
        button.style.display = 'block';
        button.style.marginTop = '10px';
        notification.appendChild(button);
    } else {
        clearTimeout(notificationTimeout);
        notificationTimeout = setTimeout(() => {
            document.body.removeChild(notification);
        }, 3000);
    }
}

function restartGame() {
    bullets = [];
    asteroids = [];
    createAsteroids();
    player1 = new Player(150, canvas.height / 2, {left: false, right: false, forward: false, alive: true});
    player2 = new Player(canvas.width - 150, canvas.height / 2, {left: false, right: false, forward: false, alive: true});
    startTime = Date.now();
    gameOver = false;
    document.querySelectorAll('.notification').forEach(notification => notification.remove());
    gameLoop();
}

function checkGameOver() {
    if (!player1.alive && !player2.alive && !gameOver) {
        gameOver = true;
        const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
        showNotification(`Game Over! Totale tijd: ${totalTime} seconden.`, true);  // Now includeButton is true
    }
}

class Asteroid {
    constructor(x, y, size) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.speedX = Math.random() * 2 - 1;
        this.speedY = Math.random() * 2 - 1;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = 'grey';
        ctx.fill();
        ctx.closePath();
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;
    }
}

function createAsteroids() {
    for (let i = 0; i < 10; i++) {
        let x = Math.random() * canvas.width;
        let y = Math.random() * canvas.height;
        let size = Math.random() * 20 + 10;
        asteroids.push(new Asteroid(x, y, size));
    }
}
createAsteroids();

class Player {
    constructor(x, y, controls) {
        this.x = x;
        this.y = y;
        this.angle = 0;
        this.speed = 3;
        this.lastShotTime = 0; // Nieuw: de tijd van het laatste schot
        this.controls = controls;
        this.size = 20; // Voor botsingsdetectie
        this.alive = true; // Nieuw: houdt bij of de speler nog leeft
    }

    draw() {
        if (!this.alive) return; // Teken de speler niet als deze niet meer leeft

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.beginPath();
        ctx.moveTo(-10, -10);
        ctx.lineTo(20, 0);
        ctx.lineTo(-10, 10);
        ctx.fillStyle = "white";
        ctx.fill();
        ctx.restore();
    }

    update() {
        if (!this.alive) return; // Stop met updaten als de speler niet meer leeft

        if (this.controls.left) this.angle -= 0.05;
        if (this.controls.right) this.angle += 0.05;
        if (this.controls.forward) {
            this.x += Math.cos(this.angle) * this.speed;
            this.y += Math.sin(this.angle) * this.speed;
        }

        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;
    }

    shoot() {
        if (!this.alive) return; 

        let currentTime = Date.now();
        if (currentTime - this.lastShotTime > 500) { // 500 ms vertraging tussen schoten
            bullets.push(new Bullet(this.x, this.y, this.angle));
            this.lastShotTime = currentTime;
        }
    }
    
}

class Bullet {
    constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = 5;
        this.size = 2; // Voor botsingsdetectie
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = 'yellow';
        ctx.fill();
        ctx.closePath();
    }

    update() {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
    }
}

let player1 = new Player(150, canvas.height / 2, {left: false, right: false, forward: false});
let player2 = new Player(canvas.width - 150, canvas.height / 2, {left: false, right: false, forward: false});

function keyDownHandler(e) {
    if (!player1.alive && !player2.alive) return; // Geen input als beide spelers niet meer leven

    switch (e.key) {
        case 'a': player1.controls.left = true; break;
        case 'd': player1.controls.right = true; break;
        case 'w': player1.controls.forward = true; break;
        case ' ': // Gebruik spatiebalk voor het schieten van speler 1
            player1.shoot();
            break;
        case 'ArrowLeft': player2.controls.left = true; break;
        case 'ArrowRight': player2.controls.right = true; break;
        case 'ArrowUp': player2.controls.forward = true; break;
        case 'Enter': // Gebruik ENTER voor het schieten van speler 2
            player2.shoot();
            break;
    }
}

function keyUpHandler(e) {
    switch (e.key) {
        case 'a': player1.controls.left = false; break;
        case 'd': player1.controls.right = false; break;
        case 'w': player1.controls.forward = false; break;
        case 'ArrowLeft': player2.controls.left = false; break;
        case 'ArrowRight': player2.controls.right = false; break;
        case 'ArrowUp': player2.controls.forward = false; break;
    }
}

function drawTimer() {
    let elapsedTime = Date.now() - startTime; // Verstreken tijd in milliseconden
    let seconds = Math.floor((elapsedTime / 1000) % 60);
    let minutes = Math.floor((elapsedTime / (1000 * 60)) % 60);
    let hundredths = Math.floor((elapsedTime % 1000) / 10); // Nieuw: bereken honderdsten van een seconde

    // Formatteer de tijd om minuten, seconden, en honderdsten van seconden te tonen
    let formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}:${hundredths < 10 ? '0' : ''}${hundredths}`;

    ctx.font = '16px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'right';
    ctx.fillText(formattedTime, canvas.width - 10, 20);
}

function checkAllAsteroidsDestroyed() {
    if (asteroids.length === 0 && !gameOver) {
        gameOver = true;
        const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
        showNotification(`Alle asteroids vernietigd! Totale tijd: ${totalTime} seconden.`, true);
    }
}

function gameLoop() {
    if (gameOver) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update en teken spelers
    player1.update();
    player1.draw();
    player2.update();
    player2.draw();

    // Update en teken kogels
    bullets.forEach((bullet, index) => {
        bullet.update();
        bullet.draw();

        // Verwijder kogels die buiten het scherm gaan
        if (bullet.x < 0 || bullet.x > canvas.width || bullet.y < 0 || bullet.y > canvas.height) {
            bullets.splice(index, 1);
        }
    });

    // Update en teken asteroïden
    asteroids.forEach((asteroid, aIndex) => {
        asteroid.update();
        asteroid.draw();

        // Controleer op botsingen tussen kogels en asteroïden
        bullets.forEach((bullet, bIndex) => {
            if (detectCollision(bullet, asteroid)) {
                if (asteroid.size > 10) { // Als de asteroïde groot genoeg is, splits deze
                    asteroids.push(new Asteroid(asteroid.x, asteroid.y, asteroid.size / 2));
                    asteroids.push(new Asteroid(asteroid.x, asteroid.y, asteroid.size / 2));
                }
                // Verwijder de kogel en de asteroïde (of de gesplitste asteroïden)
                bullets.splice(bIndex, 1);
                asteroids.splice(aIndex, 1);
            }
        });

        // Controleer op botsingen tussen spelers en asteroïden
        [player1, player2].forEach(player => {
            if (detectCollision(player, asteroid)) {
                player.alive = false; // Markeer de speler als 'niet levend'
                checkGameOver(); // Optioneel: controleer direct of het spel voorbij is
            }
        });
    });

    checkGameOver(); // Controleer of beide spelers zijn uitgeschakeld
    checkAllAsteroidsDestroyed(); // Controleer of alle asteroids vernietigd zijn

    if (!gameOver) {
        requestAnimationFrame(gameLoop);
    }

    drawTimer(); // Teken de timer als laatste, zodat deze altijd vooraan wordt weergegeven
}


createAsteroids();
gameLoop();
