class Grid {
    constructor(width, height, cellSize) {
        this.width = width;
        this.height = height;
        this.cellSize = cellSize;
        this.cols = Math.ceil(width / cellSize);
        this.rows = Math.ceil(height / cellSize);
        
        // Initialize grid with NEUTRAL
        this.cells = new Array(this.cols * this.rows).fill(FACTIONS.NEUTRAL);
        this.factionCounts = { [FACTIONS.NEUTRAL]: this.cols * this.rows };
        
        this.canvas = document.createElement('canvas');
        this.canvas.width = width;
        this.canvas.height = height;
        this.ctx = this.canvas.getContext('2d');
        
        // 정적 격자선 캔버스
        this.gridLinesCanvas = document.createElement('canvas');
        this.gridLinesCanvas.width = width;
        this.gridLinesCanvas.height = height;
        const glCtx = this.gridLinesCanvas.getContext('2d');
        glCtx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        glCtx.lineWidth = 1;
        glCtx.beginPath();
        for (let r = 0; r <= this.rows; r++) {
            glCtx.moveTo(0, r * cellSize);
            glCtx.lineTo(width, r * cellSize);
        }
        for (let c = 0; c <= this.cols; c++) {
            glCtx.moveTo(c * cellSize, 0);
            glCtx.lineTo(c * cellSize, height);
        }
        glCtx.stroke();
    }
    
    getIndex(col, row) {
        return row * this.cols + col;
    }
    
    setCell(col, row, faction) {
        if (col >= 0 && col < this.cols && row >= 0 && row < this.rows) {
            const idx = this.getIndex(col, row);
            const oldFaction = this.cells[idx];
            if (oldFaction !== faction) {
                this.factionCounts[oldFaction]--;
                this.factionCounts[faction] = (this.factionCounts[faction] || 0) + 1;
                this.cells[idx] = faction;
                
                // 오프스크린 캔버스 업데이트
                this.ctx.clearRect(col * this.cellSize, row * this.cellSize, this.cellSize, this.cellSize);
                if (faction !== FACTIONS.NEUTRAL) {
                    this.ctx.fillStyle = COLORS[faction];
                    this.ctx.globalAlpha = 0.3;
                    this.ctx.fillRect(col * this.cellSize, row * this.cellSize, this.cellSize, this.cellSize);
                }
            }
        }
    }
    
    getCell(col, row) {
        if (col >= 0 && col < this.cols && row >= 0 && row < this.rows) {
            return this.cells[this.getIndex(col, row)];
        }
        return null; // out of bounds
    }
    
    getFactionAt(x, y) {
        const col = Math.floor(x / this.cellSize);
        const row = Math.floor(y / this.cellSize);
        return this.getCell(col, row);
    }
    
    colorCircle(cx, cy, radius, faction) {
        const startCol = Math.max(0, Math.floor((cx - radius) / this.cellSize));
        const endCol = Math.min(this.cols - 1, Math.floor((cx + radius) / this.cellSize));
        const startRow = Math.max(0, Math.floor((cy - radius) / this.cellSize));
        const endRow = Math.min(this.rows - 1, Math.floor((cy + radius) / this.cellSize));
        
        for (let r = startRow; r <= endRow; r++) {
            for (let c = startCol; c <= endCol; c++) {
                // Check distance from circle center to cell center
                const cellX = c * this.cellSize + this.cellSize / 2;
                const cellY = r * this.cellSize + this.cellSize / 2;
                
                const dx = cellX - cx;
                const dy = cellY - cy;
                if (dx * dx + dy * dy <= radius * radius) {
                    this.setCell(c, r, faction);
                }
            }
        }
    }
}
