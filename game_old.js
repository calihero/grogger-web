// Grogger - HTML5 Canvas Game
// Exact port of Java version with matching visuals

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = 1024;
        this.height = 768;
        
        // Game state
        this.state = 'MENU';
        this.numPlayers = 1;
        this.players = [];
        this.lanes = [];
        this.goals = [];
        this.timer = 60;
        this.timerInterval = null;
        
        // Constants matching Java version
        this.CELL_SIZE = 50;
        this.BOARD_WIDTH = 800;
        this.BOARD_HEIGHT = 650;
        this.BOARD_OFFSET_X = (this.width - this.BOARD_WIDTH) / 2;
        this.BOARD_OFFSET_Y = 80;
        this.FROG_SIZE = 40;
        this.GOAL_WIDTH = 70;
        this.GOAL_HEIGHT = 45;
        
        // High scores
        this.highScores = this.loadHighScores();
        
        // Input handling
        this.keys = {};
        this.setupInput();
        
        // Sound system
        this.sounds = new SoundManager();
        
        // Start game loop
        this.lastTime = 0;
        this.gameLoop = this.gameLoop.bind(this);
        requestAnimationFrame(this.gameLoop);
        
        // Show menu
        this.showMenu();
    }
    
    setupInput() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            
            if (e.key === 'Escape' && this.state === 'PLAYING') {
                this.pause();
            }
            
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
    }
    
    startGame(numPlayers) {
        this.numPlayers = numPlayers;
        this.state = 'PLAYING';
        
        document.getElementById('menu').style.display = 'none';
        document.getElementById('instructions').style.display = 'none';
        document.getElementById('gameOver').style.display = 'none';
        document.getElementById('player2Info').style.display = numPlayers === 2 ? 'block' : 'none';
        
        this.players = [];
        for (let i = 0; i < numPlayers; i++) {
            this.players.push(new Player(i, this));
        }
        
        this.initLevel();
        this.timer = 60;
        this.startTimer();
        this.sounds.playSound('start');
    }
    
    initLevel() {
        this.lanes = [];
        const level = this.players[0].level - 1; // 0-indexed
        
        // Speed multiplier from Constants
        const speedMultipliers = [1.0, 1.15, 1.3, 1.45, 1.6, 1.75, 1.9, 2.05, 2.2, 2.35];
        const speedMultiplier = level < speedMultipliers.length ? speedMultipliers[level] : 2.5;
        
        // Entity counts per level
        const entityCounts = [2, 2, 3, 3, 3, 4, 4, 4, 5, 5];
        const entityCount = level < entityCounts.length ? entityCounts[level] : 5;
        
        // Top goals area
        this.lanes.push(new SafeLane(0, this));
        
        // River section (5 lanes) - alternating logs and turtles
        this.lanes.push(new RiverLane(1, 'right', false, 1.0 + 0.4, speedMultiplier, entityCount, this)); // Logs
        this.lanes.push(new RiverLane(2, 'left', true, 1.4, speedMultiplier, entityCount, this));  // Turtles
        this.lanes.push(new RiverLane(3, 'right', false, 1.8, speedMultiplier, entityCount, this)); // Logs
        this.lanes.push(new RiverLane(4, 'left', true, 1.0, speedMultiplier, entityCount, this));  // Turtles
        this.lanes.push(new RiverLane(5, 'right', false, 1.4, speedMultiplier, entityCount, this)); // Logs
        
        // Middle safe zone
        this.lanes.push(new SafeLane(6, this));
        
        // Road section (5 lanes)
        this.lanes.push(new RoadLane(7, 'left', 1.5, speedMultiplier, entityCount, this));
        this.lanes.push(new RoadLane(8, 'right', 2.0, speedMultiplier, entityCount, this));
        this.lanes.push(new RoadLane(9, 'left', 2.5, speedMultiplier, entityCount, this));
        this.lanes.push(new RoadLane(10, 'right', 1.5, speedMultiplier, entityCount, this));
        this.lanes.push(new RoadLane(11, 'left', 2.0, speedMultiplier, entityCount, this));
        
        // Bottom safe zone (start)
        this.lanes.push(new SafeLane(12, this));
        
        // Initialize goals
        this.goals = [];
        const numGoals = this.numPlayers === 1 ? 5 : 10;
        const goalSpacing = this.BOARD_WIDTH / (numGoals + 1);
        for (let i = 0; i < numGoals; i++) {
            this.goals.push({
                x: this.BOARD_OFFSET_X + goalSpacing * (i + 1) - this.GOAL_WIDTH / 2,
                y: this.BOARD_OFFSET_Y + 2,
                occupied: false,
                playerId: -1
            });
        }
    }
    
    startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        
        this.timerInterval = setInterval(() => {
            if (this.state === 'PLAYING') {
                this.timer--;
                document.getElementById('timer').textContent = this.timer;
                
                if (this.timer <= 10) {
                    document.getElementById('timer').style.color = '#ef4444';
                } else {
                    document.getElementById('timer').style.color = '#fbbf24';
                }
                
                if (this.timer <= 0) {
                    this.players.forEach(p => {
                        if (p.lives > 0) p.die();
                    });
                    this.timer = 60;
                }
            }
        }, 1000);
    }
    
    pause() {
        if (this.state === 'PLAYING') {
            this.state = 'PAUSED';
            if (this.timerInterval) clearInterval(this.timerInterval);
        } else if (this.state === 'PAUSED') {
            this.state = 'PLAYING';
            this.startTimer();
        }
    }
    
    showMenu() {
        this.state = 'MENU';
        document.getElementById('menu').style.display = 'flex';
        document.getElementById('instructions').style.display = 'none';
        document.getElementById('gameOver').style.display = 'none';
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.displayHighScores();
    }
    
    showInstructions() {
        document.getElementById('menu').style.display = 'none';
        document.getElementById('instructions').style.display = 'flex';
    }
    
    restart() {
        this.startGame(this.numPlayers);
    }
    
    gameOver() {
        this.state = 'GAME_OVER';
        document.getElementById('gameOver').style.display = 'flex';
        if (this.timerInterval) clearInterval(this.timerInterval);
        
        let html = '';
        this.players.forEach((p, i) => {
            html += `<p>Spieler ${i + 1}: ${p.score} Punkte</p>`;
            if (this.isHighScore(p.score)) {
                this.addHighScore(p.score, i + 1);
                html += `<p style="color: #fbbf24;">🏆 NEUER HIGH SCORE! 🏆</p>`;
            }
        });
        document.getElementById('finalScores').innerHTML = html;
        this.sounds.playSound('gameOver');
    }
    
    checkLevelComplete() {
        const goalsNeeded = 5;
        for (let player of this.players) {
            if (player.goalsReached < goalsNeeded) return false;
        }
        
        this.players.forEach(p => {
            p.level++;
            p.goalsReached = 0;
            p.score += this.timer * 10;
        });
        
        this.timer = 60;
        this.initLevel();
        this.sounds.playSound('levelComplete');
        return true;
    }
    
    update(deltaTime) {
        if (this.state !== 'PLAYING') return;
        
        this.lanes.forEach(lane => lane.update(deltaTime));
        this.players.forEach(player => player.update(deltaTime));
        
        if (this.players.every(p => p.lives <= 0)) {
            this.gameOver();
        }
        
        this.updateUI();
    }
    
    updateUI() {
        this.players.forEach((p, i) => {
            const prefix = i === 0 ? 'p1' : 'p2';
            document.getElementById(`${prefix}Score`).textContent = p.score;
            document.getElementById(`${prefix}Lives`).textContent = p.lives;
            document.getElementById(`${prefix}Level`).textContent = p.level;
        });
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        if (this.state === 'MENU' || this.state === 'GAME_OVER') return;
        
        // Draw lanes
        this.lanes.forEach(lane => lane.draw(this.ctx));
        
        // Draw goals
        this.drawGoals();
        
        // Draw players
        this.players.forEach(player => player.draw(this.ctx));
        
        // Draw pause overlay
        if (this.state === 'PAUSED') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 60px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('PAUSE', this.width / 2, this.height / 2);
            this.ctx.font = '30px Arial';
            this.ctx.fillText('ESC zum Fortsetzen', this.width / 2, this.height / 2 + 50);
        }
    }
    
    drawGoals() {
        this.goals.forEach(goal => {
            const x = goal.x;
            const y = goal.y;
            const w = this.GOAL_WIDTH;
            const h = this.GOAL_HEIGHT;
            
            if (goal.occupied) {
                // Filled goal with player color
                const player = this.players.find(p => p.id === goal.playerId);
                const playerColor = player ? player.color : 'rgb(0, 255, 0)';
                
                // Background
                this.ctx.fillStyle = 'rgb(0, 150, 0)';
                this.roundRect(this.ctx, x, y, w, h, 10, true, false);
                
                // Lily pad
                this.ctx.fillStyle = 'rgb(34, 139, 34)';
                this.ctx.beginPath();
                this.ctx.arc(x + w/2, y + h/2, (w-10)/2, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Frog on lily pad
                this.ctx.fillStyle = playerColor;
                this.ctx.beginPath();
                this.ctx.ellipse(x + w/2, y + h/2 + 5, 20, 15, 0, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Eyes
                this.ctx.fillStyle = '#fff';
                this.ctx.fillRect(x + w/2 - 15, y + h/2 - 5, 8, 8);
                this.ctx.fillRect(x + w/2 + 7, y + h/2 - 5, 8, 8);
                
                this.ctx.fillStyle = '#000';
                this.ctx.fillRect(x + w/2 - 12, y + h/2 - 2, 3, 3);
                this.ctx.fillRect(x + w/2 + 10, y + h/2 - 2, 3, 3);
                
                // Player indicator
                this.ctx.fillStyle = '#fff';
                this.ctx.font = '12px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(`P${goal.playerId + 1}`, x + w/2, y - 5);
            } else {
                // Empty goal
                this.ctx.fillStyle = 'rgb(0, 100, 0)';
                this.roundRect(this.ctx, x, y, w, h, 10, true, false);
                
                // Lily pad outline
                this.ctx.strokeStyle = 'rgb(34, 139, 34)';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(x + w/2, y + h/2, (w-10)/2, 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.beginPath();
                this.ctx.arc(x + w/2, y + h/2, (w-12)/2, 0, Math.PI * 2);
                this.ctx.stroke();
                
                // Water ripples
                this.ctx.strokeStyle = 'rgba(100, 150, 200, 0.4)';
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                this.ctx.arc(x + w/2, y + h/2, (w-20)/2, 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.beginPath();
                this.ctx.arc(x + w/2, y + h/2, (w-30)/2, 0, Math.PI * 2);
                this.ctx.stroke();
            }
            
            // Border
            this.ctx.strokeStyle = '#000';
            this.ctx.lineWidth = 2;
            this.roundRect(this.ctx, x, y, w, h, 10, false, true);
        });
    }
    
    roundRect(ctx, x, y, width, height, radius, fill, stroke) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        if (fill) ctx.fill();
        if (stroke) ctx.stroke();
    }
    
    gameLoop(currentTime) {
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.draw();
        
        requestAnimationFrame(this.gameLoop);
    }
    
    loadHighScores() {
        const saved = localStorage.getItem('groggerHighScores');
        return saved ? JSON.parse(saved) : [];
    }
    
    saveHighScores() {
        localStorage.setItem('groggerHighScores', JSON.stringify(this.highScores));
    }
    
    isHighScore(score) {
        return this.highScores.length < 10 || score > this.highScores[this.highScores.length - 1].score;
    }
    
    addHighScore(score, player) {
        this.highScores.push({ score, player, date: new Date().toLocaleDateString('de-DE') });
        this.highScores.sort((a, b) => b.score - a.score);
        this.highScores = this.highScores.slice(0, 10);
        this.saveHighScores();
    }
    
    displayHighScores() {
        const list = document.getElementById('highScoreList');
        if (this.highScores.length === 0) {
            list.innerHTML = '<p>Noch keine High Scores</p>';
        } else {
            let html = '';
            this.highScores.slice(0, 5).forEach((hs, i) => {
                html += `<p>${i + 1}. ${hs.score} Punkte - Spieler ${hs.player}</p>`;
            });
            list.innerHTML = html;
        }
    }
}

class Player {
    constructor(id, game) {
        this.id = id;
        this.game = game;
        this.color = id === 0 ? 'rgb(0, 255, 0)' : 'rgb(255, 140, 0)';
        this.darkColor = id === 0 ? 'rgb(0, 180, 0)' : 'rgb(200, 100, 0)';
        this.size = game.FROG_SIZE;
        
        this.reset();
        
        this.score = 0;
        this.lives = 5;
        this.level = 1;
        this.goalsReached = 0;
        
        this.moveDelay = 0.15;
        this.moveTimer = 0;
        
        this.controls = id === 0 ? 
            { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' } :
            { up: 'w', down: 's', left: 'a', right: 'd' };
    }
    
    reset() {
        const startCol = this.id === 0 ? 3 : 12;
        this.x = this.game.BOARD_OFFSET_X + startCol * this.game.CELL_SIZE + 5;
        this.y = this.game.BOARD_OFFSET_Y + 12 * this.game.CELL_SIZE + 5;
        this.laneIndex = 12;
    }
    
    update(deltaTime) {
        if (this.lives <= 0) return;
        
        this.moveTimer -= deltaTime;
        
        if (this.moveTimer <= 0) {
            const moved = this.handleInput();
            if (moved) {
                this.moveTimer = this.moveDelay;
                this.game.sounds.playSound('hop');
            }
        }
        
        this.checkCollisions();
    }
    
    handleInput() {
        const keys = this.game.keys;
        let moved = false;
        
        if (keys[this.controls.up]) {
            this.move(0, -1);
            moved = true;
        } else if (keys[this.controls.down]) {
            this.move(0, 1);
            moved = true;
        } else if (keys[this.controls.left]) {
            this.move(-1, 0);
            moved = true;
        } else if (keys[this.controls.right]) {
            this.move(1, 0);
            moved = true;
        }
        
        return moved;
    }
    
    move(dx, dy) {
        const newX = this.x + dx * this.game.CELL_SIZE;
        const newY = this.y + dy * this.game.CELL_SIZE;
        
        if (newX < this.game.BOARD_OFFSET_X || newX + this.size > this.game.BOARD_OFFSET_X + this.game.BOARD_WIDTH) return;
        if (newY < this.game.BOARD_OFFSET_Y || newY + this.size > this.game.BOARD_OFFSET_Y + this.game.BOARD_HEIGHT) return;
        
        this.x = newX;
        this.y = newY;
        this.laneIndex -= dy;
        
        if (dy < 0) {
            this.score += 10;
        }
    }
    
    checkCollisions() {
        const lane = this.game.lanes[this.laneIndex];
        if (!lane) return;
        
        if (lane.type === 'ROAD') {
            for (let vehicle of lane.obstacles) {
                if (this.collidesWith(vehicle)) {
                    this.die();
                    return;
                }
            }
        } else if (lane.type === 'RIVER') {
            let onPlatform = false;
            for (let platform of lane.obstacles) {
                if (this.collidesWith(platform)) {
                    onPlatform = true;
                    this.x += platform.speed * (lane.direction === 'right' ? 1 : -1);
                    break;
                }
            }
            
            if (!onPlatform) {
                this.die();
                return;
            }
        } else if (lane.type === 'SAFE' && this.laneIndex === 0) {
            this.checkGoalCollision();
        }
    }
    
    checkGoalCollision() {
        for (let goal of this.game.goals) {
            if (this.x + this.size > goal.x && 
                this.x < goal.x + this.game.GOAL_WIDTH &&
                this.y + this.size > goal.y && 
                this.y < goal.y + this.game.GOAL_HEIGHT) {
                
                if (!goal.occupied) {
                    goal.occupied = true;
                    goal.playerId = this.id;
                    this.goalsReached++;
                    this.score += 50;
                    this.score += this.game.timer * 2;
                    this.game.sounds.playSound('goal');
                    this.reset();
                    
                    this.game.checkLevelComplete();
                    
                    if (this.score >= 10000 && this.score - 50 < 10000) {
                        this.lives++;
                        this.game.sounds.playSound('extraLife');
                    }
                }
                break;
            }
        }
    }
    
    collidesWith(obj) {
        return this.x + this.size > obj.x && 
               this.x < obj.x + obj.width &&
               this.y + this.size > obj.y && 
               this.y < obj.y + obj.height;
    }
    
    die() {
        this.lives--;
        this.game.sounds.playSound('death');
        this.reset();
        this.game.timer = 60;
    }
    
    draw(ctx) {
        if (this.lives <= 0) return;
        
        // Frog body (main circle)
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x + this.size/2, this.y + this.size/2, (this.size-10)/2, 0, Math.PI * 2);
        ctx.fill();
        
        // Eyes
        ctx.fillStyle = this.darkColor;
        ctx.fillRect(this.x + 10, this.y + 8, 8, 8);
        ctx.fillRect(this.x + this.size - 18, this.y + 8, 8, 8);
        
        // Eye highlights
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.x + 12, this.y + 10, 3, 3);
        ctx.fillRect(this.x + this.size - 16, this.y + 10, 3, 3);
        
        // Legs
        ctx.fillStyle = this.darkColor;
        // Back legs
        ctx.beginPath();
        ctx.arc(this.x + 8, this.y + this.size - 9, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + this.size - 8, this.y + this.size - 9, 6, 0, Math.PI * 2);
        ctx.fill();
        // Front legs
        ctx.beginPath();
        ctx.arc(this.x + 10, this.y + this.size/2, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + this.size - 10, this.y + this.size/2, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Player number
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`P${this.id + 1}`, this.x + this.size/2, this.y - 5);
    }
}

class Lane {
    constructor(index, game) {
        this.index = index;
        this.game = game;
        this.y = game.BOARD_OFFSET_Y + index * game.CELL_SIZE;
        this.obstacles = [];
    }
    
    update(deltaTime) {
        this.obstacles.forEach(obs => obs.update(deltaTime));
        
        this.obstacles = this.obstacles.filter(obs => {
            if (this.direction === 'right') {
                return obs.x < this.game.BOARD_OFFSET_X + this.game.BOARD_WIDTH + 200;
            } else {
                return obs.x > this.game.BOARD_OFFSET_X - 200;
            }
        });
        
        this.spawnObstacles();
    }
    
    spawnObstacles() {}
    
    draw(ctx) {
        ctx.fillStyle = this.getColor();
        ctx.fillRect(this.game.BOARD_OFFSET_X, this.y, this.game.BOARD_WIDTH, this.game.CELL_SIZE);
        
        this.obstacles.forEach(obs => obs.draw(ctx));
    }
    
    getColor() {
        return '#333';
    }
}

class SafeLane extends Lane {
    constructor(index, game) {
        super(index, game);
        this.type = 'SAFE';
    }
    
    getColor() {
        return this.index === 0 ? 'rgb(0, 100, 0)' : 'rgb(144, 238, 144)';
    }
    
    draw(ctx) {
        super.draw(ctx);
        
        // Draw grass texture for safe zones
        if (this.index !== 0) {
            ctx.fillStyle = 'rgb(100, 200, 100)';
            for (let x = this.game.BOARD_OFFSET_X; x < this.game.BOARD_OFFSET_X + this.game.BOARD_WIDTH; x += 20) {
                for (let y = this.y; y < this.y + this.game.CELL_SIZE; y += 20) {
                    if (Math.random() > 0.7) {
                        ctx.fillRect(x + Math.random() * 10, y + Math.random() * 10, 3, 8);
                    }
                }
            }
        }
    }
}

class RoadLane extends Lane {
    constructor(index, speed, direction, game) {
        super(index, game);
        this.type = 'ROAD';
        this.speed = speed;
        this.direction = direction;
        this.spawnTimer = 0;
        this.spawnDelay = 2 + Math.random() * 2;
    }
    
    spawnObstacles() {
        this.spawnTimer += 0.016;
        
        if (this.spawnTimer >= this.spawnDelay) {
            this.spawnTimer = 0;
            this.spawnDelay = 1.5 + Math.random() * 2;
            
            const x = this.direction === 'right' ? 
                this.game.BOARD_OFFSET_X - 100 : 
                this.game.BOARD_OFFSET_X + this.game.BOARD_WIDTH + 100;
            this.obstacles.push(new Vehicle(x, this.y, this.speed, this.direction));
        }
    }
    
    getColor() {
        return 'rgb(64, 64, 64)';
    }
    
    draw(ctx) {
        super.draw(ctx);
        
        // Draw road lines
        ctx.strokeStyle = 'rgb(255, 255, 0)';
        ctx.lineWidth = 2;
        ctx.setLineDash([20, 20]);
        ctx.beginPath();
        ctx.moveTo(this.game.BOARD_OFFSET_X, this.y + this.game.CELL_SIZE / 2);
        ctx.lineTo(this.game.BOARD_OFFSET_X + this.game.BOARD_WIDTH, this.y + this.game.CELL_SIZE / 2);
        ctx.stroke();
        ctx.setLineDash([]);
    }
}

class RiverLane extends Lane {
    constructor(index, speed, direction, game) {
        super(index, game);
        this.type = 'RIVER';
        this.speed = speed;
        this.direction = direction;
        this.spawnTimer = 0;
        this.spawnDelay = 3 + Math.random();
    }
    
    spawnObstacles() {
        this.spawnTimer += 0.016;
        
        if (this.spawnTimer >= this.spawnDelay) {
            this.spawnTimer = 0;
            this.spawnDelay = 2 + Math.random() * 2;
            
            const x = this.direction === 'right' ? 
                this.game.BOARD_OFFSET_X - 150 : 
                this.game.BOARD_OFFSET_X + this.game.BOARD_WIDTH + 150;
            const isTurtle = Math.random() < 0.3;
            
            if (isTurtle) {
                this.obstacles.push(new Turtle(x, this.y, this.speed, this.direction));
            } else {
                this.obstacles.push(new Log(x, this.y, this.speed, this.direction));
            }
        }
    }
    
    getColor() {
        return 'rgb(0, 102, 204)';
    }
}

class Vehicle {
    constructor(x, y, speed, direction) {
        this.x = x;
        this.y = y + 5;
        this.speed = speed * 60;
        this.direction = direction;
        this.width = [80, 120, 160][Math.floor(Math.random() * 3)];
        this.height = 40;
        this.color = ['rgb(255, 0, 0)', 'rgb(255, 255, 0)', 'rgb(148, 0, 211)', 
                      'rgb(255, 165, 0)', 'rgb(0, 191, 255)', 'rgb(255, 20, 147)'][Math.floor(Math.random() * 6)];
    }
    
    update(deltaTime) {
        this.x += this.speed * deltaTime * (this.direction === 'right' ? 1 : -1);
    }
    
    draw(ctx) {
        // Main body with rounded corners
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.roundRect(this.x, this.y, this.width, this.height, 10);
        ctx.fill();
        
        // Top highlight
        const lightColor = this.lightenColor(this.color);
        ctx.fillStyle = lightColor;
        ctx.beginPath();
        ctx.roundRect(this.x + 2, this.y + 2, this.width - 4, this.height / 3, 8);
        ctx.fill();
        
        // Windows
        ctx.fillStyle = 'rgba(100, 150, 200, 0.7)';
        const windowWidth = this.width / 4;
        const windowHeight = this.height / 3;
        const windowY = this.y + 5;
        
        if (this.direction === 'right') {
            ctx.fillRect(this.x + this.width - windowWidth - 5, windowY, windowWidth, windowHeight);
            if (this.width > 80) {
                ctx.fillRect(this.x + 10, windowY, windowWidth, windowHeight);
            }
        } else {
            ctx.fillRect(this.x + 5, windowY, windowWidth, windowHeight);
            if (this.width > 80) {
                ctx.fillRect(this.x + this.width - windowWidth - 10, windowY, windowWidth, windowHeight);
            }
        }
        
        // Wheels
        ctx.fillStyle = '#000';
        const wheelSize = 8;
        const wheelY = this.y + this.height - 5;
        ctx.beginPath();
        ctx.arc(this.x + 5 + wheelSize/2, wheelY + wheelSize/2, wheelSize/2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + this.width - 5 - wheelSize/2, wheelY + wheelSize/2, wheelSize/2, 0, Math.PI * 2);
        ctx.fill();
        
        // Wheel highlights
        ctx.fillStyle = '#888';
        ctx.beginPath();
        ctx.arc(this.x + 7, wheelY + 2, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + this.width - 7, wheelY + 2, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Headlights
        ctx.fillStyle = '#ff0';
        if (this.direction === 'right') {
            ctx.beginPath();
            ctx.arc(this.x + this.width - 5, this.y + this.height / 2, 3, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.arc(this.x + 5, this.y + this.height / 2, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    lightenColor(color) {
        const rgb = color.match(/\d+/g);
        return `rgb(${Math.min(255, parseInt(rgb[0]) + 50)}, ${Math.min(255, parseInt(rgb[1]) + 50)}, ${Math.min(255, parseInt(rgb[2]) + 50)})`;
    }
}

class Log {
    constructor(x, y, speed, direction) {
        this.x = x;
        this.y = y + 5;
        this.speed = speed * 60;
        this.direction = direction;
        this.width = [100, 150, 200][Math.floor(Math.random() * 3)]; // Match Java: SMALL, MEDIUM, LARGE
        this.height = 40;
    }
    
    update(deltaTime) {
        this.x += this.speed * deltaTime * (this.direction === 'right' ? 1 : -1);
    }
    
    draw(ctx) {
        // Main log body
        ctx.fillStyle = 'rgb(139, 69, 19)';
        ctx.beginPath();
        ctx.roundRect(this.x, this.y, this.width, this.height, 15);
        ctx.fill();
        
        // Darker outline
        ctx.strokeStyle = 'rgb(101, 50, 13)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(this.x, this.y, this.width, this.height, 15);
        ctx.stroke();
        ctx.beginPath();
        ctx.roundRect(this.x + 1, this.y + 1, this.width - 2, this.height - 2, 15);
        ctx.stroke();
        
        // Wood grain lines
        ctx.strokeStyle = 'rgb(101, 50, 13)';
        ctx.lineWidth = 1;
        const numLines = Math.floor(this.width / 30);
        for (let i = 0; i < numLines; i++) {
            const lineX = this.x + 15 + i * 30;
            ctx.beginPath();
            ctx.moveTo(lineX, this.y + 5);
            ctx.lineTo(lineX, this.y + this.height - 5);
            ctx.stroke();
        }
        
        // Horizontal grain
        ctx.beginPath();
        ctx.moveTo(this.x + 5, this.y + this.height / 2);
        ctx.lineTo(this.x + this.width - 5, this.y + this.height / 2);
        ctx.stroke();
        
        // End caps (tree rings)
        ctx.strokeStyle = 'rgb(101, 50, 13)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(this.x + this.height/2, this.y + this.height/2, this.height/2 - 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(this.x + this.height/2, this.y + this.height/2, this.height/2 - 8, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(this.x + this.width - this.height/2, this.y + this.height/2, this.height/2 - 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(this.x + this.width - this.height/2, this.y + this.height/2, this.height/2 - 8, 0, Math.PI * 2);
        ctx.stroke();
        
        // Highlight on top
        ctx.fillStyle = 'rgba(160, 82, 45, 0.4)';
        ctx.beginPath();
        ctx.roundRect(this.x + 3, this.y + 3, this.width - 6, this.height / 3, 12);
        ctx.fill();
    }
}

class Turtle {
    constructor(x, y, speed, direction) {
        this.x = x;
        this.y = y + 5;
        this.speed = speed * 60;
        this.direction = direction;
        this.width = 120;
        this.height = 40;
        this.animTimer = 0;
    }
    
    update(deltaTime) {
        this.x += this.speed * deltaTime * (this.direction === 'right' ? 1 : -1);
        this.animTimer += deltaTime;
    }
    
    draw(ctx) {
        const offset = Math.sin(this.animTimer * 3) * 3;
        
        // Turtle body
        ctx.fillStyle = 'rgb(47, 79, 47)';
        ctx.fillRect(this.x, this.y + offset, this.width, this.height);
        
        // Shell pattern
        ctx.fillStyle = 'rgb(85, 107, 47)';
        ctx.fillRect(this.x + 10, this.y + 10 + offset, 30, 20);
        ctx.fillRect(this.x + 45, this.y + 10 + offset, 30, 20);
        ctx.fillRect(this.x + 80, this.y + 10 + offset, 30, 20);
        
        // Shell outlines
        ctx.strokeStyle = 'rgb(47, 79, 47)';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x + 10, this.y + 10 + offset, 30, 20);
        ctx.strokeRect(this.x + 45, this.y + 10 + offset, 30, 20);
        ctx.strokeRect(this.x + 80, this.y + 10 + offset, 30, 20);
    }
}

class SoundManager {
    constructor() {
        this.audioContext = null;
        this.enabled = true;
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
            this.enabled = false;
        }
    }
    
    playSound(type) {
        if (!this.enabled || !this.audioContext) return;
        
        const ctx = this.audioContext;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        switch (type) {
            case 'hop':
                oscillator.frequency.value = 400;
                gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
                oscillator.start(ctx.currentTime);
                oscillator.stop(ctx.currentTime + 0.1);
                break;
            case 'death':
                oscillator.frequency.value = 200;
                gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
                oscillator.start(ctx.currentTime);
                oscillator.stop(ctx.currentTime + 0.5);
                break;
            case 'goal':
                oscillator.frequency.value = 800;
                gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
                oscillator.start(ctx.currentTime);
                oscillator.stop(ctx.currentTime + 0.3);
                break;
            case 'levelComplete':
                oscillator.frequency.value = 600;
                gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
                oscillator.start(ctx.currentTime);
                oscillator.stop(ctx.currentTime + 0.8);
                break;
            case 'gameOver':
                oscillator.frequency.value = 150;
                gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1);
                oscillator.start(ctx.currentTime);
                oscillator.stop(ctx.currentTime + 1);
                break;
            case 'start':
                oscillator.frequency.value = 500;
                gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
                oscillator.start(ctx.currentTime);
                oscillator.stop(ctx.currentTime + 0.4);
                break;
            case 'extraLife':
                oscillator.frequency.value = 1000;
                gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
                oscillator.start(ctx.currentTime);
                oscillator.stop(ctx.currentTime + 0.6);
                break;
        }
    }
}

// Initialize game when page loads
let game;
window.addEventListener('load', () => {
    game = new Game();
});

// Made with Bob
