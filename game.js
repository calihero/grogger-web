// Grogger - HTML5 Canvas Game
// Fixed version with proper spawning logic matching Java

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = 1024;
        this.height = 768;
        
        this.state = 'MENU';
        this.numPlayers = 1;
        this.players = [];
        this.lanes = [];
        this.goals = [];
        this.timer = 60;
        this.timerInterval = null;
        
        this.CELL_SIZE = 50;
        this.BOARD_WIDTH = 800;
        this.BOARD_HEIGHT = 650;
        this.BOARD_OFFSET_X = (this.width - this.BOARD_WIDTH) / 2;
        this.BOARD_OFFSET_Y = 80;
        this.FROG_SIZE = 40;
        this.GOAL_WIDTH = 70;
        this.GOAL_HEIGHT = 45;
        
        this.highScores = this.loadHighScores();
        this.keys = {};
        this.setupInput();
        this.sounds = new SoundManager();
        
        this.lastTime = 0;
        this.gameLoop = this.gameLoop.bind(this);
        requestAnimationFrame(this.gameLoop);
        
        this.showMenu();
    }
    
    setupInput() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            if (e.key === 'Escape' && this.state === 'PLAYING') this.pause();
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();
        });
        document.addEventListener('keyup', (e) => { this.keys[e.key] = false; });
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
        const level = Math.max(0, this.players[0].level - 1);
        
        const speedMultipliers = [1.0, 1.15, 1.3, 1.45, 1.6, 1.75, 1.9, 2.05, 2.2, 2.35];
        const entityCounts = [2, 2, 3, 3, 3, 4, 4, 4, 5, 5];
        const speedMult = level < speedMultipliers.length ? speedMultipliers[level] : 2.5;
        const entityCount = level < entityCounts.length ? entityCounts[level] : 5;
        
        this.lanes.push(new SafeLane(0, this));
        this.lanes.push(new RiverLane(1, 'right', false, 1.0, speedMult, entityCount, this));
        this.lanes.push(new RiverLane(2, 'left', true, 1.4, speedMult, entityCount, this));
        this.lanes.push(new RiverLane(3, 'right', false, 1.8, speedMult, entityCount, this));
        this.lanes.push(new RiverLane(4, 'left', true, 1.0, speedMult, entityCount, this));
        this.lanes.push(new RiverLane(5, 'right', false, 1.4, speedMult, entityCount, this));
        this.lanes.push(new SafeLane(6, this));
        this.lanes.push(new RoadLane(7, 'left', 1.5, speedMult, entityCount, this));
        this.lanes.push(new RoadLane(8, 'right', 2.0, speedMult, entityCount, this));
        this.lanes.push(new RoadLane(9, 'left', 2.5, speedMult, entityCount, this));
        this.lanes.push(new RoadLane(10, 'right', 1.5, speedMult, entityCount, this));
        this.lanes.push(new RoadLane(11, 'left', 2.0, speedMult, entityCount, this));
        this.lanes.push(new SafeLane(12, this));
        
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
                document.getElementById('timer').style.color = this.timer <= 10 ? '#ef4444' : '#fbbf24';
                if (this.timer <= 0) {
                    this.players.forEach(p => { if (p.lives > 0) p.die(); });
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
    
    restart() { this.startGame(this.numPlayers); }
    
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
        for (let player of this.players) {
            if (player.goalsReached < 5) return false;
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
        if (this.players.every(p => p.lives <= 0)) this.gameOver();
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
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        if (this.state === 'MENU' || this.state === 'GAME_OVER') return;
        
        this.lanes.forEach(lane => lane.draw(this.ctx));
        this.drawGoals();
        this.players.forEach(player => player.draw(this.ctx));
        
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
            const x = goal.x, y = goal.y, w = this.GOAL_WIDTH, h = this.GOAL_HEIGHT;
            
            if (goal.occupied) {
                const player = this.players.find(p => p.id === goal.playerId);
                const playerColor = player ? player.color : 'rgb(0, 255, 0)';
                
                this.ctx.fillStyle = 'rgb(0, 150, 0)';
                this.roundRect(this.ctx, x, y, w, h, 10, true, false);
                
                this.ctx.fillStyle = 'rgb(34, 139, 34)';
                this.ctx.beginPath();
                this.ctx.arc(x + w/2, y + h/2, (w-10)/2, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.fillStyle = playerColor;
                this.ctx.beginPath();
                this.ctx.ellipse(x + w/2, y + h/2 + 5, 20, 15, 0, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.fillStyle = '#fff';
                this.ctx.fillRect(x + w/2 - 15, y + h/2 - 5, 8, 8);
                this.ctx.fillRect(x + w/2 + 7, y + h/2 - 5, 8, 8);
                this.ctx.fillStyle = '#000';
                this.ctx.fillRect(x + w/2 - 12, y + h/2 - 2, 3, 3);
                this.ctx.fillRect(x + w/2 + 10, y + h/2 - 2, 3, 3);
                
                this.ctx.fillStyle = '#fff';
                this.ctx.font = '12px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(`P${goal.playerId + 1}`, x + w/2, y - 5);
            } else {
                this.ctx.fillStyle = 'rgb(0, 100, 0)';
                this.roundRect(this.ctx, x, y, w, h, 10, true, false);
                
                this.ctx.strokeStyle = 'rgb(34, 139, 34)';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(x + w/2, y + h/2, (w-10)/2, 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.beginPath();
                this.ctx.arc(x + w/2, y + h/2, (w-12)/2, 0, Math.PI * 2);
                this.ctx.stroke();
                
                this.ctx.strokeStyle = 'rgba(100, 150, 200, 0.4)';
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                this.ctx.arc(x + w/2, y + h/2, (w-20)/2, 0, Math.PI * 2);
                this.ctx.stroke();
            }
            
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
        
        // Check collisions and move with platforms
        this.checkCollisions(deltaTime);
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
        // dy is negative when moving UP (decreasing y), positive when moving DOWN (increasing y)
        // laneIndex should DECREASE when moving UP (towards lane 0), INCREASE when moving DOWN
        this.laneIndex += dy;  // FIXED: was -= dy
        
        if (dy < 0) this.score += 10;
    }
    
    checkCollisions(deltaTime) {
        // Get current lane
        const lane = this.game.lanes[this.laneIndex];
        if (!lane) return;
        
        // ROAD LANES - die on vehicle collision
        if (lane.type === 'ROAD') {
            for (let i = 0; i < lane.obstacles.length; i++) {
                const vehicle = lane.obstacles[i];
                // Simple rectangle collision
                const collision = !(
                    this.x + this.size < vehicle.x ||
                    this.x > vehicle.x + vehicle.width ||
                    this.y + this.size < vehicle.y ||
                    this.y > vehicle.y + vehicle.height
                );
                
                if (collision) {
                    this.die();
                    return;
                }
            }
        }
        // RIVER LANES - must be on platform
        else if (lane.type === 'RIVER') {
            let onPlatform = false;
            
            for (let i = 0; i < lane.obstacles.length; i++) {
                const platform = lane.obstacles[i];
                // Simple rectangle collision
                const collision = !(
                    this.x + this.size < platform.x ||
                    this.x > platform.x + platform.width ||
                    this.y + this.size < platform.y ||
                    this.y > platform.y + platform.height
                );
                
                if (collision) {
                    onPlatform = true;
                    // Move with platform - platform.speed is already multiplied by 60
                    // So we need to multiply by deltaTime to get the correct movement per frame
                    this.x += platform.speed * deltaTime * (platform.direction === 'right' ? 1 : -1);
                    break;
                }
            }
            
            if (!onPlatform) {
                this.die();
                return;
            }
        }
        // SAFE LANE at top - check goals
        else if (lane.type === 'SAFE' && this.laneIndex === 0) {
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
    
    
    die() {
        this.lives--;
        this.game.sounds.playSound('death');
        this.reset();
        this.game.timer = 60;
    }
    
    draw(ctx) {
        if (this.lives <= 0) return;
        
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x + this.size/2, this.y + this.size/2, (this.size-10)/2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = this.darkColor;
        ctx.fillRect(this.x + 10, this.y + 8, 8, 8);
        ctx.fillRect(this.x + this.size - 18, this.y + 8, 8, 8);
        
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.x + 12, this.y + 10, 3, 3);
        ctx.fillRect(this.x + this.size - 16, this.y + 10, 3, 3);
        
        ctx.fillStyle = this.darkColor;
        ctx.beginPath();
        ctx.arc(this.x + 8, this.y + this.size - 9, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + this.size - 8, this.y + this.size - 9, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + 10, this.y + this.size/2, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + this.size - 10, this.y + this.size/2, 5, 0, Math.PI * 2);
        ctx.fill();
        
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
        
        // Wrap obstacles around
        this.obstacles.forEach(obs => {
            if (this.direction === 'right') {
                if (obs.x > this.game.BOARD_OFFSET_X + this.game.BOARD_WIDTH) {
                    obs.x = this.game.BOARD_OFFSET_X - obs.width;
                }
            } else {
                if (obs.x + obs.width < this.game.BOARD_OFFSET_X) {
                    obs.x = this.game.BOARD_OFFSET_X + this.game.BOARD_WIDTH;
                }
            }
        });
    }
    
    draw(ctx) {
        ctx.fillStyle = this.getColor();
        ctx.fillRect(this.game.BOARD_OFFSET_X, this.y, this.game.BOARD_WIDTH, this.game.CELL_SIZE);
        this.obstacles.forEach(obs => obs.draw(ctx));
    }
    
    getColor() { return '#333'; }
}

class SafeLane extends Lane {
    constructor(index, game) {
        super(index, game);
        this.type = 'SAFE';
    }
    
    getColor() {
        return this.index === 0 ? 'rgb(0, 100, 0)' : 'rgb(144, 238, 144)';
    }
}

class RoadLane extends Lane {
    constructor(index, direction, baseSpeed, speedMultiplier, vehicleCount, game) {
        super(index, game);
        this.type = 'ROAD';
        this.direction = direction;
        
        const spacing = game.BOARD_WIDTH / vehicleCount;
        for (let i = 0; i < vehicleCount; i++) {
            const x = game.BOARD_OFFSET_X + i * spacing + Math.random() * 50;
            this.obstacles.push(new Vehicle(x, this.y, baseSpeed * speedMultiplier, this.direction));
        }
    }
    
    getColor() { return 'rgb(64, 64, 64)'; }
    
    draw(ctx) {
        super.draw(ctx);
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
    constructor(index, direction, useTurtles, baseSpeed, speedMultiplier, platformCount, game) {
        super(index, game);
        this.type = 'RIVER';
        this.direction = direction;
        
        const spacing = game.BOARD_WIDTH / platformCount;
        for (let i = 0; i < platformCount; i++) {
            const x = game.BOARD_OFFSET_X + i * spacing + Math.random() * 50;
            
            if (useTurtles) {
                this.obstacles.push(new Turtle(x, this.y, baseSpeed * speedMultiplier, this.direction));
            } else {
                const logSizes = [100, 150, 200];
                const logWidth = logSizes[Math.floor(Math.random() * 3)];
                this.obstacles.push(new Log(x, this.y, baseSpeed * speedMultiplier, this.direction, logWidth));
            }
        }
    }
    
    getColor() { return 'rgb(0, 102, 204)'; }
}

class Vehicle {
    constructor(x, y, speed, direction) {
        this.x = x;
        this.height = 40;
        // Center vehicle in lane: (CELL_SIZE - height) / 2 = (50 - 40) / 2 = 5
        this.y = y + 5;
        this.speed = speed * 60;
        this.direction = direction;
        this.width = [80, 120, 160][Math.floor(Math.random() * 3)];
        this.color = ['rgb(255, 0, 0)', 'rgb(255, 255, 0)', 'rgb(148, 0, 211)',
                      'rgb(255, 165, 0)', 'rgb(0, 191, 255)', 'rgb(255, 20, 147)'][Math.floor(Math.random() * 6)];
    }
    
    update(deltaTime) {
        this.x += this.speed * deltaTime * (this.direction === 'right' ? 1 : -1);
    }
    
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.roundRect(this.x, this.y, this.width, this.height, 10);
        ctx.fill();
        
        const lightColor = this.lightenColor(this.color);
        ctx.fillStyle = lightColor;
        ctx.beginPath();
        ctx.roundRect(this.x + 2, this.y + 2, this.width - 4, this.height / 3, 8);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(100, 150, 200, 0.7)';
        const windowWidth = this.width / 4;
        const windowHeight = this.height / 3;
        const windowY = this.y + 5;
        
        if (this.direction === 'right') {
            ctx.fillRect(this.x + this.width - windowWidth - 5, windowY, windowWidth, windowHeight);
            if (this.width > 80) ctx.fillRect(this.x + 10, windowY, windowWidth, windowHeight);
        } else {
            ctx.fillRect(this.x + 5, windowY, windowWidth, windowHeight);
            if (this.width > 80) ctx.fillRect(this.x + this.width - windowWidth - 10, windowY, windowWidth, windowHeight);
        }
        
        ctx.fillStyle = '#000';
        const wheelSize = 8;
        const wheelY = this.y + this.height - 5;
        ctx.beginPath();
        ctx.arc(this.x + 5 + wheelSize/2, wheelY + wheelSize/2, wheelSize/2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + this.width - 5 - wheelSize/2, wheelY + wheelSize/2, wheelSize/2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#888';
        ctx.beginPath();
        ctx.arc(this.x + 7, wheelY + 2, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + this.width - 7, wheelY + 2, 2, 0, Math.PI * 2);
        ctx.fill();
        
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
    constructor(x, y, speed, direction, width) {
        this.x = x;
        this.y = y + 5;
        this.speed = speed * 60;
        this.direction = direction;
        this.width = width;
        this.height = 40;
    }
    
    update(deltaTime) {
        this.x += this.speed * deltaTime * (this.direction === 'right' ? 1 : -1);
    }
    
    draw(ctx) {
        ctx.fillStyle = 'rgb(139, 69, 19)';
        ctx.beginPath();
        ctx.roundRect(this.x, this.y, this.width, this.height, 15);
        ctx.fill();
        
        ctx.strokeStyle = 'rgb(101, 50, 13)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(this.x, this.y, this.width, this.height, 15);
        ctx.stroke();
        ctx.beginPath();
        ctx.roundRect(this.x + 1, this.y + 1, this.width - 2, this.height - 2, 15);
        ctx.stroke();
        
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
        
        ctx.beginPath();
        ctx.moveTo(this.x + 5, this.y + this.height / 2);
        ctx.lineTo(this.x + this.width - 5, this.y + this.height / 2);
        ctx.stroke();
        
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
        
        ctx.fillStyle = 'rgb(47, 79, 47)';
        ctx.fillRect(this.x, this.y + offset, this.width, this.height);
        
        ctx.fillStyle = 'rgb(85, 107, 47)';
        ctx.fillRect(this.x + 10, this.y + 10 + offset, 30, 20);
        ctx.fillRect(this.x + 45, this.y + 10 + offset, 30, 20);
        ctx.fillRect(this.x + 80, this.y + 10 + offset, 30, 20);
        
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
        
        const sounds = {
            hop: [400, 0.1, 0.1],
            death: [200, 0.2, 0.5],
            goal: [800, 0.15, 0.3],
            levelComplete: [600, 0.2, 0.8],
            gameOver: [150, 0.2, 1],
            start: [500, 0.15, 0.4],
            extraLife: [1000, 0.2, 0.6]
        };
        
        const [freq, gain, duration] = sounds[type] || [400, 0.1, 0.1];
        oscillator.frequency.value = freq;
        gainNode.gain.setValueAtTime(gain, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + duration);
    }
}

let game;
window.addEventListener('load', () => {
    game = new Game();
    setupMobileControls();
});

// Mobile Touch Controls
function setupMobileControls() {
    const mobileControls = document.getElementById('mobileControls');
    if (!mobileControls) return;
    
    const buttons = mobileControls.querySelectorAll('.dpad-btn[data-key]');
    
    buttons.forEach(button => {
        const key = button.getAttribute('data-key');
        
        // Touch events
        button.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (game && game.keys) {
                game.keys[key] = true;
            }
        });
        
        button.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (game && game.keys) {
                game.keys[key] = false;
            }
        });
        
        button.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            if (game && game.keys) {
                game.keys[key] = false;
            }
        });
        
        // Mouse events for testing on desktop
        button.addEventListener('mousedown', (e) => {
            e.preventDefault();
            if (game && game.keys) {
                game.keys[key] = true;
            }
        });
        
        button.addEventListener('mouseup', (e) => {
            e.preventDefault();
            if (game && game.keys) {
                game.keys[key] = false;
            }
        });
        
        button.addEventListener('mouseleave', (e) => {
            if (game && game.keys) {
                game.keys[key] = false;
            }
        });
    });
}

// Made with Bob
