class GameLoop {
    constructor(canvas, selectedFactions) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.renderer = new Renderer(canvas, this.ctx);
        
        this.padding = 0; // 여백 제거
        this.gameWidth = canvas.width;
        this.gameHeight = canvas.height;
        
        this.grid = new Grid(this.gameWidth, this.gameHeight, CONFIG.GRID_SIZE);
        this.units = [];
        this.items = [];
        this.textEffects = [];
        this.selectedFactions = selectedFactions;
        
        this.frameCount = 0;
        this.isRunning = false;
        this.gameSpeed = 1; // 배속
        
        this.init();
    }
    
    init() {
        const p = 120; // 스폰 위치 (여백이 없으므로 조금 더 띄움)
        const w2 = this.gameWidth / 2;
        const h2 = this.gameHeight / 2;
        const positions = [
            {x: p, y: p},
            {x: this.gameWidth - p, y: this.gameHeight - p},
            {x: p, y: this.gameHeight - p},
            {x: this.gameWidth - p, y: p},
            {x: w2, y: p},
            {x: w2, y: this.gameHeight - p},
            {x: p, y: h2},
            {x: this.gameWidth - p, y: h2}
        ];
        
        for (let i = 0; i < this.selectedFactions.length; i++) {
            let faction = this.selectedFactions[i];
            let customStats = null;
            let customPixels = null;
            if (faction === FACTIONS.PLAYER && window.playerCustomStats) {
                customStats = window.playerCustomStats;
                customPixels = window.playerCustomPixels;
            }
            this.units.push(new Unit(faction, positions[i].x, positions[i].y, customStats, customPixels));
        }
    }
    
    setSpeed(speed) {
        this.gameSpeed = speed;
    }
    
    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.loop();
        }
    }
    
    stop() {
        this.isRunning = false;
    }
    
    spawnItem() {
        const activeItemsCount = this.items.filter(i => i.active).length;
        if (activeItemsCount >= CONFIG.MAX_ITEMS) return;
        
        let targetX = 0, targetY = 0;
        let spawned = false;
        
        // 최대 10번 시도하여 운 스탯에 따른 확률적 스폰 적용
        for (let i = 0; i < 10; i++) {
            const x = Math.random() * this.gameWidth;
            const y = Math.random() * this.gameHeight;
            
            const cellFaction = this.grid.getFactionAt(x, y);
            let acceptanceRate = 0.4; // 중립 지역 기본 확률 (40%)
            
            if (cellFaction && cellFaction !== FACTIONS.NEUTRAL) {
                const ownerUnit = this.units.find(u => u.faction === cellFaction);
                if (ownerUnit) {
                    // 운 스탯 밸런스 조정 (선형 완화)
                    // 1점 = 10%, 2점 = 25%, 3점 = 40%, 4점 = 55%, 5점 = 70%
                    acceptanceRate = 0.1 + ((ownerUnit.luckStat - 1) * 0.15);
                }
            }
            
            if (Math.random() < acceptanceRate) {
                targetX = x;
                targetY = y;
                spawned = true;
                break;
            }
        }
        
        // 10번 다 실패했으면 그냥 마지막 좌표에 스폰
        if (!spawned) {
            targetX = Math.random() * this.gameWidth;
            targetY = Math.random() * this.gameHeight;
        }
        
        const types = Object.values(ITEM_TYPES);
        const type = types[Math.floor(Math.random() * types.length)];
        
        this.items.push(new Item(targetX + this.padding, targetY + this.padding, type));
    }
    
    checkWinner() {
        const aliveUnits = this.units.filter(u => !u.isDead);
        const totalCells = this.grid.cols * this.grid.rows;
        const victoryThreshold = totalCells * 0.95;
        
        let territoryWinner = null;
        for (let unit of aliveUnits) {
            if (this.grid.factionCounts[unit.faction] >= victoryThreshold) {
                territoryWinner = unit.faction;
                break;
            }
        }
        
        if (aliveUnits.length <= 1 || territoryWinner) {
            this.stop();
            const overlay = document.getElementById('game-over-overlay');
            const winnerText = document.getElementById('winner-text');
            
            if (territoryWinner) {
                winnerText.textContent = `${territoryWinner}\nWINS BY DOMINATION!`;
                const winningUnit = aliveUnits.find(u => u.faction === territoryWinner);
                winnerText.style.color = winningUnit ? winningUnit.color : '#fff';
            } else if (aliveUnits.length === 1) {
                winnerText.textContent = `${aliveUnits[0].faction} WINS!`;
                winnerText.style.color = aliveUnits[0].color;
            } else {
                winnerText.textContent = `DRAW!`;
                winnerText.style.color = '#fff';
            }
            
            overlay.classList.remove('hidden');
        }
    }
    
    singleUpdate() {
        this.frameCount++;
        
        if (this.frameCount % CONFIG.ITEM_SPAWN_RATE === 0) {
            this.spawnItem();
        }
        
        this.items = this.items.filter(item => item.active);
        for (let item of this.items) {
            item.update();
        }
        
        for (let unit of this.units) {
            unit.update(this.grid, this.gameWidth, this.gameHeight, this.padding);
        }
        
        CollisionManager.checkCollisions(this.units, this.items, this.grid);
        
        // Update text effects
        for (let i = this.textEffects.length - 1; i >= 0; i--) {
            let effect = this.textEffects[i];
            effect.y -= 1; // Float up
            effect.life--;
            if (effect.life <= 0) {
                this.textEffects.splice(i, 1);
            }
        }
        
        this.checkWinner();
    }
    
    update() {
        for (let i = 0; i < this.gameSpeed; i++) {
            this.singleUpdate();
        }
    }
    
    loop = () => {
        if (!this.isRunning) return;
        
        this.update();
        this.renderer.draw(this.grid, this.units, this.items, this.textEffects, this.padding);
        
        requestAnimationFrame(this.loop);
    }
}
