// Game Constants
const GRID_SIZE = 6;
const HALF_SIZE = 3;
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
        this.portalPairs = []; // Array of { topPos, bottomPos }
        
        this.setupEventListeners();
        this.loadLevel(1);
        this.render();
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

        const isTopHalf = this.playerPos.y < HALF_SIZE;

        // Check if new position is walkable
        if (!this.isWalkable(newX, newY, isTopHalf)) {
            return;
        }

        // Check if there's a box at the new position
        if (this.boxPos.x === newX && this.boxPos.y === newY && 
            ((this.boxPos.y < HALF_SIZE) === isTopHalf)) {
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
        const mapY = fromTopHalf ? newBoxY : newBoxY - HALF_SIZE;
        
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
                const targetMapY = !fromTopHalf ? this.boxPos.y : this.boxPos.y - HALF_SIZE;
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
        if (x < 0 || x >= GRID_SIZE) return false;
        
        const currentMap = isTopHalf ? this.mapTop : this.mapBottom;
        
        if (isTopHalf) {
            if (y < 0 || y >= HALF_SIZE) return false;
            const tile = currentMap[y][x];
            return tile !== TILE_TYPES.WALL;
        } else {
            if (y < HALF_SIZE || y >= GRID_SIZE) return false;
            const adjustedY = y - HALF_SIZE;
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
        this.mapTop = levelData.mapTop;
        this.mapBottom = levelData.mapBottom;
        this.playerPos = { ...levelData.playerPos };
        this.boxPos = { ...levelData.boxPos };
        this.portalPairs = levelData.portalPairs;

        document.getElementById('levelDisplay').textContent = levelNum;
        document.getElementById('moveCount').textContent = '0';
        this.render();
    }

    getLevelData(level) {
        // Level data format: mapTop, mapBottom, playerPos, boxPos, portalPairs
        const levels = {
            1: {
                mapTop: [
                    [1, 1, 1, 1, 1, 1],
                    [1, 2, 2, 2, 2, 1],
                    [1, 2, 2, 3, 2, 1]
                ],
                mapBottom: [
                    [1, 2, 2, 3, 2, 1],
                    [1, 2, 2, 2, 2, 1],
                    [1, 1, 1, 4, 1, 1]
                ],
                playerPos: { x: 1, y: 1 },
                boxPos: { x: 2, y: 1 },
                portalPairs: [
                    {
                        topPos: { x: 3, y: 2 },
                        bottomPos: { x: 3, y: 3 }
                    }
                ]
            },
            2: {
                mapTop: [
                    [1, 1, 1, 1, 1, 1],
                    [1, 2, 3, 2, 2, 1],
                    [1, 2, 2, 2, 2, 1]
                ],
                mapBottom: [
                    [1, 2, 2, 3, 2, 1],
                    [1, 2, 2, 2, 2, 1],
                    [1, 1, 4, 2, 1, 1]
                ],
                playerPos: { x: 1, y: 1 },
                boxPos: { x: 3, y: 1 },
                portalPairs: [
                    {
                        topPos: { x: 2, y: 1 },
                        bottomPos: { x: 3, y: 3 }
                    }
                ]
            },
            3: {
                mapTop: [
                    [1, 1, 1, 1, 1, 1],
                    [1, 2, 2, 2, 3, 1],
                    [1, 3, 2, 2, 2, 1]
                ],
                mapBottom: [
                    [1, 2, 3, 2, 2, 1],
                    [1, 2, 2, 2, 2, 1],
                    [1, 1, 2, 4, 2, 1]
                ],
                playerPos: { x: 1, y: 1 },
                boxPos: { x: 3, y: 2 },
                portalPairs: [
                    {
                        topPos: { x: 4, y: 1 },
                        bottomPos: { x: 2, y: 3 }
                    },
                    {
                        topPos: { x: 1, y: 2 },
                        bottomPos: { x: 3, y: 3 }
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

        // Draw top half (rows 0-2)
        for (let y = 0; y < HALF_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                this.drawTile(x, y, this.mapTop[y][x], true, cellSize);
            }
        }

        // Draw divider line
        this.ctx.strokeStyle = '#666';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(0, cellSize * HALF_SIZE);
        this.ctx.lineTo(canvasWidth, cellSize * HALF_SIZE);
        this.ctx.stroke();

        // Draw divider label
        this.ctx.fillStyle = '#666';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🌙 下半场', canvasWidth / 2, cellSize * HALF_SIZE + 15);

        // Draw bottom half (rows 3-5, displayed as rows 0-2 on canvas)
        for (let y = 0; y < HALF_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                const canvasY = y + HALF_SIZE;
                this.drawTileAtPosition(x, canvasY, this.mapBottom[y][x], false, cellSize);
            }
        }

        // Draw box
        this.drawBox(cellSize);

        // Draw player
        this.drawPlayer(cellSize);
    }

    drawTile(x, y, tileType, isTopHalf, cellSize) {
        const px = x * cellSize;
        const py = y * cellSize;

        // Background based on half
        if (isTopHalf) {
            this.ctx.fillStyle = '#ffd4a3'; // Warm color for top half
        } else {
            this.ctx.fillStyle = '#a8d5ff'; // Cool color for bottom half
        }
        this.ctx.fillRect(px, py, cellSize, cellSize);

        // Draw grid lines
        this.ctx.strokeStyle = '#ccc';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(px, py, cellSize, cellSize);

        this.drawTileContent(px, py, tileType, isTopHalf, cellSize);
    }

    drawTileAtPosition(x, canvasY, tileType, isTopHalf, cellSize) {
        const px = x * cellSize;
        const py = canvasY * cellSize;

        // Background based on half
        if (isTopHalf) {
            this.ctx.fillStyle = '#ffd4a3'; // Warm color for top half
        } else {
            this.ctx.fillStyle = '#a8d5ff'; // Cool color for bottom half
        }
        this.ctx.fillRect(px, py, cellSize, cellSize);

        // Draw grid lines
        this.ctx.strokeStyle = '#ccc';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(px, py, cellSize, cellSize);

        this.drawTileContent(px, py, tileType, isTopHalf, cellSize);
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
        
        const boxHalf = this.boxPos.y < HALF_SIZE ? '上' : '下';
        document.getElementById('boxPosition').textContent = `(${this.boxPos.x}, ${this.boxPos.y % HALF_SIZE}) - ${boxHalf}半`;
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
