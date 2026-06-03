// Game Constants
const GRID_WIDTH = 5;
const GRID_HEIGHT = 6;
const HALF_HEIGHT = 3;
const CELL_SIZE = 50;
const TILE_TYPES = {
    EMPTY: 0,
    WALL: 1,
    FLOOR: 2,
    CHANNEL: 3,  // 改名为通道
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
        this.channelPos = null; // 上半场的通道位置
        
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

        // Check for channel (only in top half)
        if (fromTopHalf) {
            const currentMapData = this.mapTop;
            
            if (currentMapData[newBoxY] && currentMapData[newBoxY][newBoxX] === TILE_TYPES.CHANNEL) {
                // Box pushed onto channel - activate passage
                // 玩家和箱子保持相对位置，穿过通道到下半场
                const playerRelX = this.playerPos.x - boxX;
                const playerRelY = this.playerPos.y - boxY;
                
                this.boxPos.x = newBoxX;
                this.boxPos.y = newBoxY + HALF_HEIGHT;  // 转换到下半场
                
                this.playerPos.x = newBoxX + playerRelX;
                this.playerPos.y = newBoxY + playerRelY + HALF_HEIGHT;  // 转换到下半场
                
                // Check if box reached goal
                const targetMap = this.mapBottom;
                const targetMapY = this.boxPos.y - HALF_HEIGHT;
                if (targetMap[targetMapY] && targetMap[targetMapY][this.boxPos.x] === TILE_TYPES.GOAL) {
                    this.gameWon = true;
                    this.showMessage(`🎉 恭喜！关卡 ${this.currentLevel} 完成！用时 ${this.moveCount} 步`, 'success');
                    document.getElementById('nextLevelBtn').style.display = this.currentLevel < 3 ? 'block' : 'none';
                }
            } else {
                // Normal box movement
                this.boxPos.x = newBoxX;
                this.boxPos.y = newBoxY;
            }
        } else {
            // Normal box movement in bottom half
            this.boxPos.x = newBoxX;
            this.boxPos.y = newBoxY;
        }

        // Move player
        this.playerPos.x = boxX;
        this.playerPos.y = boxY;
        this.moveCount++;
        this.render();
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
        this.channelPos = levelData.channelPos;

        document.getElementById('levelDisplay').textContent = levelNum;
        document.getElementById('moveCount').textContent = '0';
        this.render();
    }

    getLevelData(level) {
        const levels = {
            1: {
                mapTop: [
                    [1, 1, 1, 1, 1],
                    [1, 2, 2, 3, 1],
                    [1, 2, 2, 2, 1]
                ],
                mapBottom: [
                    [1, 2, 2, 2, 1],
                    [1, 2, 2, 2, 1],
                    [1, 1, 1, 4, 1]
                ],
                playerPos: { x: 1, y: 1 },
                boxPos: { x: 2, y: 1 },
                channelPos: { x: 3, y: 1 }
            },
            2: {
                mapTop: [
                    [1, 1, 1, 1, 1],
                    [1, 2, 2, 2, 1],
                    [1, 2, 3, 2, 1]
                ],
                mapBottom: [
                    [1, 2, 2, 2, 1],
                    [1, 2, 2, 2, 1],
                    [1, 1, 1, 4, 1]
                ],
                playerPos: { x: 1, y: 1 },
                boxPos: { x: 2, y: 1 },
                channelPos: { x: 2, y: 2 }
            },
            3: {
                mapTop: [
                    [1, 1, 1, 1, 1],
                    [1, 2, 2, 2, 1],
                    [1, 2, 3, 2, 1]
                ],
                mapBottom: [
                    [1, 2, 2, 2, 1],
                    [1, 2, 2, 2, 1],
                    [1, 1, 1, 4, 1]
                ],
                playerPos: { x: 1, y: 1 },
                boxPos: { x: 2, y: 1 },
                channelPos: { x: 2, y: 2 }
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
            
            case TILE_TYPES.CHANNEL:
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
