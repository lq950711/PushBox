// Game Constants
const GRID_WIDTH = 5;
const GRID_HEIGHT = 6;
const HALF_HEIGHT = 3;
const CELL_SIZE = 50;
const TILE_TYPES = {
    EMPTY: 0,
    WALL: 1,
    FLOOR: 2,
    PORTAL: 3,
    GOAL: 4
};

// Player directions
const DIRECTIONS = {
    UP: { x: 0, y: -1, key: 'UP' },
    DOWN: { x: 0, y: 1, key: 'DOWN' },
    LEFT: { x: -1, y: 0, key: 'LEFT' },
    RIGHT: { x: 1, y: 0, key: 'RIGHT' }
};

class SokobanGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.currentLevel = 1;
        this.moveCount = 0;
        this.gameWon = false;
        
        // Game state
        this.playerPos = { x: 0, y: 0 };
        this.boxPos = { x: 0, y: 0 };
        this.mapTop = [];
        this.mapBottom = [];
        this.portalPairs = [];
        
        this.setupEventListeners();
        this.loadLevel(1);
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        document.querySelectorAll('.level-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.loadLevel(parseInt(e.target.dataset.level));
            });
        });
    }

    handleKeyPress(e) {
        if (this.gameWon) return;

        const keyMap = {
            'ArrowUp': DIRECTIONS.UP,
            'ArrowDown': DIRECTIONS.DOWN,
            'ArrowLeft': DIRECTIONS.LEFT,
            'ArrowRight': DIRECTIONS.RIGHT,
            'w': DIRECTIONS.UP,
            'W': DIRECTIONS.UP,
            's': DIRECTIONS.DOWN,
            'S': DIRECTIONS.DOWN,
            'a': DIRECTIONS.LEFT,
            'A': DIRECTIONS.LEFT,
            'd': DIRECTIONS.RIGHT,
            'D': DIRECTIONS.RIGHT
        };

        const direction = keyMap[e.key];
        if (direction) {
            e.preventDefault();
            this.movePlayer(direction);
        }
    }

    movePlayer(direction) {
        const newX = this.playerPos.x + direction.x;
        const newY = this.playerPos.y + direction.y;

        const isTopHalf = this.playerPos.y < HALF_HEIGHT;

        // Check if new position is walkable
        if (!this.isWalkable(newX, newY, isTopHalf)) {
            return;
        }

        // Check if there's a box at the new position
        if (this.boxPos.x === newX && this.boxPos.y === newY && 
            ((this.boxPos.y < HALF_HEIGHT) === isTopHalf)) {
            // Try to push the box
            this.pushBox(newX, newY, direction, isTopHalf);
            return;
        }

        // Move player
        this.playerPos.x = newX;
        this.playerPos.y = newY;

        this.moveCount++;
        this.render();
    }

    pushBox(boxX, boxY, direction, fromTopHalf) {
        const newBoxX = boxX + direction.x;
        const newBoxY = boxY + direction.y;

        // Check if new box position is valid
        if (!this.isWalkable(newBoxX, newBoxY, fromTopHalf)) {
            return;
        }

        // Check for portal
        const currentMapData = fromTopHalf ? this.mapTop : this.mapBottom;
        const mapY = fromTopHalf ? newBoxY : newBoxY - HALF_HEIGHT;
        
        if (currentMapData[mapY] && currentMapData[mapY][newBoxX] === TILE_TYPES.PORTAL) {
            // Box is on portal, teleport it
            const portalIndex = this.getPortalIndex(newBoxX, newBoxY, fromTopHalf);
            if (portalIndex !== -1) {
                const otherPortal = fromTopHalf ? 
                    this.portalPairs[portalIndex].bottomPos : 
                    this.portalPairs[portalIndex].topPos;
                
                this.boxPos.x = otherPortal.x;
                this.boxPos.y = otherPortal.y;

                // Check if box reached goal
                const targetMap = !fromTopHalf ? this.mapTop : this.mapBottom;
                const targetMapY = !fromTopHalf ? this.boxPos.y : this.boxPos.y - HALF_HEIGHT;
                if (targetMap[targetMapY] && targetMap[targetMapY][this.boxPos.x] === TILE_TYPES.GOAL) {
                    this.gameWon = true;
                    this.showMessage(`🎉 恭喜！关卡 ${this.currentLevel} 完成！用时 ${this.moveCount} 步`, 'success');
                    document.getElementById('nextLevelBtn').style.display = this.currentLevel < 3 ? 'block' : 'none';
                }
            }
        } else {
            // Normal box movement
            this.boxPos.x = newBoxX;
            this.boxPos.y = newBoxY;
        }

        // Move player
        this.playerPos.x = boxX;
        this.playerPos.y = boxY;
        this.moveCount++;
        this.render();
    }

    getPortalIndex(x, y, isTopHalf) {
        for (let i = 0; i < this.portalPairs.length; i++) {
            if (isTopHalf) {
                const pos = this.portalPairs[i].topPos;
                if (pos.x === x && pos.y === y) return i;
            } else {
                const pos = this.portalPairs[i].bottomPos;
                if (pos.x === x && pos.y === y) return i;
            }
        }
        return -1;
    }

    isWalkable(x, y, isTopHalf) {
        if (x < 0 || x >= GRID_WIDTH) return false;
        
        const currentMap = isTopHalf ? this.mapTop : this.mapBottom;
        
        if (isTopHalf) {
            if (y < 0 || y >= HALF_HEIGHT) return false;
            const tile = currentMap[y][x];
            return tile !== TILE_TYPES.WALL;
        } else {
            if (y < HALF_HEIGHT || y >= GRID_HEIGHT) return false;
            const adjustedY = y - HALF_HEIGHT;
            const tile = currentMap[adjustedY][x];
            return tile !== TILE_TYPES.WALL;
        }
    }

    loadLevel(levelNum) {
        this.currentLevel = levelNum;
        this.moveCount = 0;
        this.gameWon = false;
        document.getElementById('nextLevelBtn').style.display = 'none';
        this.showMessage('', 'info');
        
        const levelData = this.getLevelData(levelNum);
        this.mapTop = JSON.parse(JSON.stringify(levelData.mapTop));
        this.mapBottom = JSON.parse(JSON.stringify(levelData.mapBottom));
        this.playerPos = { ...levelData.playerPos };
        this.boxPos = { ...levelData.boxPos };
        this.portalPairs = JSON.parse(JSON.stringify(levelData.portalPairs));

        document.getElementById('levelDisplay').textContent = levelNum;
        document.getElementById('moveCount').textContent = '0';
        this.render();
    }

    getLevelData(level) {
        const levels = {
            1: {
                // 关卡1：简单的传送
                // 上半场：玩家在左，箱子在中间，传送门在右
                mapTop: [
                    [1, 1, 1, 1, 1],
                    [1, 2, 2, 3, 1],
                    [1, 2, 2, 2, 1]
                ],
                // 下半场：传送门在左，目标在右
                mapBottom: [
                    [1, 3, 2, 2, 1],
                    [1, 2, 2, 2, 1],
                    [1, 1, 1, 4, 1]
                ],
                playerPos: { x: 1, y: 1 },
                boxPos: { x: 2, y: 1 },
                portalPairs: [
                    {
                        topPos: { x: 3, y: 1 },
                        bottomPos: { x: 1, y: 0 }
                    }
                ]
            },
            2: {
                // 关卡2：需要往下推箱子到传送门
                // 上半场：玩家在上，箱子在中间，传送门在下
                mapTop: [
                    [1, 1, 1, 1, 1],
                    [1, 2, 2, 2, 1],
                    [1, 2, 3, 2, 1]
                ],
                // 下半场：传送门在上，目标在下方
                mapBottom: [
                    [1, 3, 2, 2, 1],
                    [1, 2, 2, 2, 1],
                    [1, 2, 2, 4, 1]
                ],
                playerPos: { x: 1, y: 1 },
                boxPos: { x: 2, y: 1 },
                portalPairs: [
                    {
                        topPos: { x: 2, y: 2 },
                        bottomPos: { x: 1, y: 0 }
                    }
                ]
            },
            3: {
                // 关卡3：双传送门，复杂路线
                // 上半场：两个传送门
                mapTop: [
                    [1, 1, 1, 1, 1],
                    [1, 2, 3, 2, 1],
                    [1, 2, 2, 3, 1]
                ],
                // 下半场：对应的两个传送门和目标
                mapBottom: [
                    [1, 3, 2, 2, 1],
                    [1, 2, 2, 3, 1],
                    [1, 2, 2, 4, 1]
                ],
                playerPos: { x: 1, y: 1 },
                boxPos: { x: 2, y: 1 },
                portalPairs: [
                    {
                        topPos: { x: 2, y: 1 },
                        bottomPos: { x: 1, y: 0 }
                    },
                    {
                        topPos: { x: 3, y: 2 },
                        bottomPos: { x: 3, y: 1 }
                    }
                ]
            }
        };

        return levels[level];
    }

    render() {
        this.drawCanvas();
        this.updateUI();
    }

    drawCanvas() {
        const cellSize = CELL_SIZE;
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        
        // Clear canvas
        this.ctx.fillStyle = '#f8f9fa';
        this.ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // Draw top half
        for (let y = 0; y < HALF_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                const px = x * cellSize;
                const py = y * cellSize;
                
                // Background
                this.ctx.fillStyle = '#ffd4a3';
                this.ctx.fillRect(px, py, cellSize, cellSize);
                
                // Grid lines
                this.ctx.strokeStyle = '#ccc';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(px, py, cellSize, cellSize);
                
                // Tile content
                this.drawTileContent(px, py, this.mapTop[y][x], true, cellSize);
            }
        }

        // Draw divider line
        const dividerY = cellSize * HALF_HEIGHT;
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(0, dividerY);
        this.ctx.lineTo(canvasWidth, dividerY);
        this.ctx.stroke();

        // Draw bottom half
        for (let y = 0; y < HALF_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                const px = x * cellSize;
                const py = dividerY + y * cellSize;
                
                // Background
                this.ctx.fillStyle = '#a8d5ff';
                this.ctx.fillRect(px, py, cellSize, cellSize);
                
                // Grid lines
                this.ctx.strokeStyle = '#ccc';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(px, py, cellSize, cellSize);
                
                // Tile content
                this.drawTileContent(px, py, this.mapBottom[y][x], false, cellSize);
            }
        }

        // Draw box
        this.drawBox(cellSize);

        // Draw player
        this.drawPlayer(cellSize);
    }

    drawTileContent(px, py, tileType, isTopHalf, cellSize) {
        switch (tileType) {
            case TILE_TYPES.WALL:
                this.ctx.fillStyle = isTopHalf ? '#cc8844' : '#4488cc';
                this.ctx.fillRect(px + 2, py + 2, cellSize - 4, cellSize - 4);
                break;
            
            case TILE_TYPES.PORTAL:
                this.ctx.fillStyle = isTopHalf ? '#ffaa00' : '#00aaff';
                this.ctx.beginPath();
                this.ctx.arc(px + cellSize / 2, py + cellSize / 2, cellSize / 3, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.strokeStyle = 'white';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(px + cellSize / 2, py + cellSize / 2, cellSize / 3 - 3, 0, Math.PI * 2);
                this.ctx.stroke();
                break;
            
            case TILE_TYPES.GOAL:
                this.ctx.fillStyle = '#ff1744';
                this.ctx.fillRect(px + 8, py + 8, cellSize - 16, cellSize - 16);
                
                this.ctx.fillStyle = 'white';
                this.ctx.font = 'bold 20px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText('★', px + cellSize / 2, py + cellSize / 2);
                break;
        }
    }

    drawPlayer(cellSize) {
        const px = this.playerPos.x * cellSize + cellSize / 2;
        const py = this.playerPos.y * cellSize + cellSize / 2;

        this.ctx.fillStyle = '#2ecc71';
        this.ctx.beginPath();
        this.ctx.arc(px, py, cellSize / 3, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.strokeStyle = '#27ae60';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('P', px, py);
    }

    drawBox(cellSize) {
        const px = this.boxPos.x * cellSize + cellSize / 2;
        const py = this.boxPos.y * cellSize + cellSize / 2;
        const size = cellSize / 2.5;

        this.ctx.fillStyle = '#e74c3c';
        this.ctx.fillRect(px - size / 2, py - size / 2, size, size);

        this.ctx.strokeStyle = '#c0392b';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(px - size / 2, py - size / 2, size, size);

        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 10px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('B', px, py);
    }

    updateUI() {
        document.getElementById('moveCount').textContent = this.moveCount;
        
        const boxHalf = this.boxPos.y < HALF_HEIGHT ? '上' : '下';
        const boxRow = this.boxPos.y < HALF_HEIGHT ? this.boxPos.y : this.boxPos.y - HALF_HEIGHT;
        document.getElementById('boxPosition').textContent = `(${this.boxPos.x}, ${boxRow}) - ${boxHalf}半`;
    }

    resetLevel() {
        this.loadLevel(this.currentLevel);
    }

    nextLevel() {
        if (this.currentLevel < 3) {
            document.querySelectorAll('.level-btn').forEach(btn => {
                if (btn.dataset.level === String(this.currentLevel + 1)) {
                    btn.click();
                }
            });
        }
    }

    showMessage(text, type) {
        const messageEl = document.getElementById('gameMessage');
        messageEl.textContent = text;
        messageEl.className = `game-message ${type}`;
    }
}

// Initialize game when page loads
window.addEventListener('DOMContentLoaded', () => {
    window.game = new SokobanGame();
});
