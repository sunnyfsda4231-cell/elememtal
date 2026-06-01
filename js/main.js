
let activePixels = new Set();
let playerStats = { spin: 3, move: 3, damage: 3, size: 3, luck: 3, health: 3 };

function showScreen(id) {
    document.querySelectorAll(".menu-screen, #game-container").forEach(el => el.classList.add("hidden"));
    document.getElementById(id).classList.remove("hidden");
}

function initPixelEditor() {
    const grid = document.getElementById("pixel-editor-grid");
    grid.innerHTML = "";
    activePixels.clear();
    
    // x: 6 to 17 (12 cols), y: -6 to 6 (13 rows)
    for (let y = -6; y <= 6; y++) {
        for (let x = 6; x <= 17; x++) {
            const cell = document.createElement("div");
            cell.className = "grid-cell";
            cell.dataset.x = x;
            cell.dataset.y = y;
            
            cell.addEventListener("mousedown", (e) => {
                if (e.buttons === 1) togglePixel(cell, true);
                if (e.buttons === 2) togglePixel(cell, false);
            });
            cell.addEventListener("mouseenter", (e) => {
                if (e.buttons === 1) togglePixel(cell, true);
                if (e.buttons === 2) togglePixel(cell, false);
            });
            cell.addEventListener("contextmenu", e => e.preventDefault());
            
            grid.appendChild(cell);
        }
    }
    
    // Load from localStorage if exists
    try {
        const savedPixels = JSON.parse(localStorage.getItem('savedCustomPixels'));
        if (savedPixels && Array.isArray(savedPixels)) {
            savedPixels.forEach(p => {
                const cell = grid.querySelector(`.grid-cell[data-x="${p.x}"][data-y="${p.y}"]`);
                if (cell) togglePixel(cell, true);
            });
        }
        
        const savedStats = JSON.parse(localStorage.getItem('savedCustomStats'));
        if (savedStats) playerStats = { ...playerStats, ...savedStats };
        
        const savedColor = localStorage.getItem('savedCustomColor');
        if (savedColor) document.getElementById("custom-color").value = savedColor;
        
        const savedName = localStorage.getItem('savedCustomName');
        if (savedName) document.getElementById("custom-name").value = savedName;
    } catch (e) {
        console.error("Failed to load custom data", e);
    }
    
    updateCreatorUI();
}

function togglePixel(cell, turnOn) {
    const key = cell.dataset.x + "," + cell.dataset.y;
    if (turnOn && activePixels.size < 28) {
        if (!activePixels.has(key)) {
            activePixels.add(key);
            cell.classList.add("active");
        }
    } else if (!turnOn) {
        if (activePixels.has(key)) {
            activePixels.delete(key);
            cell.classList.remove("active");
        }
    }
    updateCreatorUI();
}

function updateCreatorUI() {
    // Pixels
    document.getElementById("pixels-left").textContent = (28 - activePixels.size);
    
    // Stats
    let totalPoints = Object.values(playerStats).reduce((a, b) => a + b, 0);
    let remaining = 18 - totalPoints;
    document.getElementById("stat-points-left").textContent = remaining;
    
    Object.keys(playerStats).forEach(key => {
        document.getElementById(`stat-val-${key}`).textContent = playerStats[key];
    });
    
    // Start Validation
    const startBtn = document.getElementById("btn-start-custom");
    if (activePixels.size === 28 && remaining === 0) {
        startBtn.disabled = false;
    } else {
        startBtn.disabled = true;
    }
}

function setupStatButtons() {
    document.querySelectorAll(".stat-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const stat = e.target.dataset.stat;
            const isAdd = e.target.classList.contains("stat-add");
            let totalPoints = Object.values(playerStats).reduce((a, b) => a + b, 0);
            let remaining = 18 - totalPoints;
            
            if (isAdd && remaining > 0 && playerStats[stat] < 5) {
                playerStats[stat]++;
            } else if (!isAdd && playerStats[stat] > 1) {
                playerStats[stat]--;
            }
            updateCreatorUI();
        });
    });
}

function startGame(mode) {
    window.lastGameMode = mode;
    showScreen("game-container");
    
    const canvas = document.getElementById("game-canvas");
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight - 100;
    
    let selectedFactions = [];
    
    if (mode === "spectate") {
        // AI 관전 모드: 인원 수 선택 적용
        let aiCount = parseInt(document.getElementById("ai-count").value, 10);
        if (isNaN(aiCount) || aiCount < 2) aiCount = 2;
        if (aiCount > 8) aiCount = 8;
        
        const aiFactions = Object.keys(FACTIONS).filter(f => f !== "NEUTRAL" && f !== "PLAYER").map(f => FACTIONS[f]);
        for (let i = aiFactions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [aiFactions[i], aiFactions[j]] = [aiFactions[j], aiFactions[i]];
        }
        selectedFactions = aiFactions.slice(0, aiCount);
    } else if (mode === "custom") {
        // Player + 3 Random AI
        const aiFactions = Object.keys(FACTIONS).filter(f => f !== "NEUTRAL" && f !== "PLAYER").map(f => FACTIONS[f]);
        for (let i = aiFactions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [aiFactions[i], aiFactions[j]] = [aiFactions[j], aiFactions[i]];
        }
        selectedFactions = [FACTIONS.PLAYER, ...aiFactions.slice(0, 3)];
        
        // Save custom settings
        const name = document.getElementById("custom-name").value || "PLAYER";
        window.playerCustomName = name.substring(0, 10);
        window.playerCustomColor = document.getElementById("custom-color").value;
        window.playerCustomStats = { ...playerStats };
        
        // Save raw grid coordinates to localStorage
        const rawPixels = Array.from(activePixels).map(p => {
            const parts = p.split(",");
            return { x: parseInt(parts[0]), y: parseInt(parts[1]) };
        });
        
        try {
            localStorage.setItem('savedCustomPixels', JSON.stringify(rawPixels));
            localStorage.setItem('savedCustomStats', JSON.stringify(playerStats));
            localStorage.setItem('savedCustomColor', window.playerCustomColor);
            localStorage.setItem('savedCustomName', window.playerCustomName);
        } catch (e) {
            console.error("Failed to save custom data", e);
        }
        
        window.playerCustomPixels = rawPixels.map(p => {
            const gridX = p.x;
            const gridY = p.y;
            
            // 상단(y=-6)이 원소의 '앞'(x=18 근처), 하단(y=6)이 '뒤/본체'(x=6)가 되도록 변환
            const localX = 12 - gridY;
            const localY = gridX - 12; // 6 -> -6, 17 -> 5
            
            return { x: localX, y: localY };
        });
    }
    
    // Generate UI dynamically
    const uiContainer = document.getElementById("faction-ui-container");
    uiContainer.innerHTML = "";
    selectedFactions.forEach(faction => {
        let color = COLORS[faction];
        let displayName = faction.toUpperCase();
        if (faction === FACTIONS.PLAYER) {
            color = window.playerCustomColor;
            COLORS[FACTIONS.PLAYER] = color; // Update global for rendering
            displayName = window.playerCustomName;
        }
        
        uiContainer.innerHTML += `
            <div class="faction-ui ${faction}" id="ui-${faction}">
                <div class="faction-name" style="color: ${color}; text-shadow: 0 0 10px ${color};">${displayName}</div>
                <div class="health-bar-container">
                    <div class="health-bar" id="hp-${faction}" style="background: ${color}; box-shadow: 0 0 10px ${color};"></div>
                </div>
            </div>
        `;
    });
    
    document.getElementById("game-over-overlay").classList.add("hidden");
    if (window.gameLoop) window.gameLoop.stop();
    
    window.gameLoop = new GameLoop(canvas, selectedFactions);
    
    // Apply custom renderer data if player exists
    if (mode === "custom" && window.gameLoop.renderer) {
        window.gameLoop.renderer.setPlayerCustomData(window.playerCustomColor, window.playerCustomPixels);
    }
    
    window.gameLoop.start();
}

window.addEventListener("load", () => {
    // Menu navigation
    document.getElementById("btn-start-game").addEventListener("click", () => showScreen("mode-select"));
    
    document.getElementById("btn-spectate-mode-select").addEventListener("click", () => {
        showScreen("spectate-setup-screen");
    });
    
    document.getElementById("btn-start-spectate").addEventListener("click", () => {
        startGame("spectate");
    });
    
    document.getElementById("btn-custom-mode").addEventListener("click", () => {
        showScreen("creator-screen");
        initPixelEditor();
    });
    
    document.querySelectorAll(".btn-back").forEach(btn => {
        btn.addEventListener("click", (e) => showScreen(e.target.dataset.target));
    });
    
    document.getElementById("btn-start-custom").addEventListener("click", () => {
        startGame("custom");
    });
    
    setupStatButtons();
    
    // In-game controls
    document.getElementById("restart-btn").addEventListener("click", () => {
        // 동일한 세팅(모드)으로 즉시 다시 시작
        startGame(window.lastGameMode);
    });
    
    document.getElementById("quick-restart-btn").addEventListener("click", () => {
        // 상단 UI에서 언제든 누를 수 있는 빠른 재시작 버튼
        startGame(window.lastGameMode);
    });
    
    document.getElementById("home-btn").addEventListener("click", () => {
        // 처음 화면으로 완전히 새로고침
        location.reload();
    });
    
    document.querySelectorAll(".speed-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            document.querySelectorAll(".speed-btn").forEach(b => b.classList.remove("active"));
            e.target.classList.add("active");
            if (window.gameLoop) window.gameLoop.setSpeed(parseInt(e.target.dataset.speed, 10));
        });
    });
    
    document.addEventListener("click", () => {
        if (window.soundManager) window.soundManager.init();
    }, {once: true});
});

