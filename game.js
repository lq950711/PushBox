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
        this.canvasTop = document.getElementById('gameCanvasTop');
        this.canvasBottom = document.getElementById('gameCanvasBottom');
        this.ctxTop = this.canvasTop.getContext('2d');
        this.ctxBottom = this.canvasBottom.getContext('2d');
        
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

        const currentMap = this.playerPos.y < HALF_SIZE ? this.mapTop : this.mapBottom;
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

        const currentMap = fromTopHalf ? this.mapTop : this.mapBottom;

        // Check if new box position is valid
        if (!this.isWalkable(newBoxX, newBoxY, fromTopHalf)) {
            return;
        }

        // Check for portal
        const currentMapData = fromTopHalf ? this.mapTop : this.mapBottom;
        if (currentMapData[newBoxY] && currentMapData[newBoxY][newBoxX] === TILE_TYPES.PORTAL) {
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
                if (targetMap[this.boxPos.y] && targetMap[this.boxPos.y][this.boxPos.x] === TILE_TYPES.GOAL) {
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
        } else {
            if (y < HALF_SIZE || y >= GRID_SIZE) return false;
        }

        const adjustedY = isTopHalf ? y : y - HALF_SIZE;
        const tile = currentMap[adjustedY][x];
        return tile !== TILE_TYPES.WALL;
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
                    [1, 2, 2, 3, 2, 1],
                    // Bottom half
                    [1, 2, 2, 3, 2, 1],
                    [1, 2, 2, 2, 2, 1],
                    [1, 1, 1, 4, 1, 1]
                ].slice(0, 3),
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
                        bottomPos: { x: 3, y: 0 }
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
                        bottomPos: { x: 3, y: 0 }
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
                        bottomPos: { x: 2, y: 0 }
                    },
                    {
                        topPos: { x: 1, y: 2 },
                        bottomPos: { x: 3, y: 0 }
                    }
                ]
            }
        };

        return levels[level];
    }

    isWalkable(x, y, isTopHalf) {
        if (x < 0 || x >= GRID_SIZE) return false;
        
        const currentMap = isTopHalf ? this.mapTop : this.mapBottom;
        
        if (isTopHalf) {
            if (y < 0 || y >= HALF_SIZE) return false;
        } else {
            if (y < HALF_SIZE || y >= GRID_SIZE) return false;
        }

        const adjustedY = isTopHalf ? y : y - HALF_SIZE;
        const tile = currentMap[adjustedY][x];
        return tile !== TILE_TYPES.WALL;
    }

    render() {
        this.drawCanvas(this.ctxTop, this.mapTop, true);
        this.drawCanvas(this.ctxBottom, this.mapBottom, false);
        
        this.updateUI();
    }

    drawCanvas(ctx, map, isTopHalf) {
        const cellSize = CELL_SIZE;
        
        // Clear canvas
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // Draw grid
        for (let y = 0; y < HALF_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                this.drawTile(ctx, x, y, map[y][x], isTopHalf, cellSize);
            }
        }

        // Draw box if it's in this half
        if ((this.boxPos.y < HALF_SIZE && isTopHalf) || (this.boxPos.y >= HALF_SIZE && !isTopHalf)) {
            const boxY = isTopHalf ? this.boxPos.y : this.boxPos.y - HALF_SIZE;
            this.drawBox(ctx, this.boxPos.x, boxY, cellSize);
        }

        // Draw player if in this half
        if ((this.playerPos.y < HALF_SIZE && isTopHalf) || (this.playerPos.y >= HALF_SIZE && !isTopHalf)) {
            const playerY = isTopHalf ? this.playerPos.y : this.playerPos.y - HALF_SIZE;
            this.drawPlayer(ctx, this.playerPos.x, playerY, cellSize);
        }
    }

    drawTile(ctx, x, y, tileType, isTopHalf, cellSize) {
        const px = x * cellSize;
        const py = y * cellSize;

        // Background based on half
        if (isTopHalf) {
            ctx.fillStyle = '#ffd4a3'; // Warm color for top half
        } else {
            ctx.fillStyle = '#a8d5ff'; // Cool color for bottom half
        }
        ctx.fillRect(px, py, cellSize, cellSize);

        // Draw grid lines
        ctx.strokeStyle = '#ccc';
        ctx.lineWidth = 1;
        ctx.strokeRect(px, py, cellSize, cellSize);

        switch (tileType) {
            case TILE_TYPES.WALL:
                ctx.fillStyle = isTopHalf ? '#cc8844' : '#4488cc';
                ctx.fillRect(px + 2, py + 2, cellSize - 4, cellSize - 4);
                break;
            
            case TILE_TYPES.PORTAL:
                ctx.fillStyle = isTopHalf ? '#ffaa00' : '#00aaff';
                ctx.beginPath();
                ctx.arc(px + cellSize / 2, py + cellSize / 2, cellSize / 3, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(px + cellSize / 2, py + cellSize / 2, cellSize / 3 - 3, 0, Math.PI * 2);
                ctx.stroke();
                break;
            
            case TILE_TYPES.GOAL:
                ctx.fillStyle = '#ff1744';
                ctx.fillRect(px + 8, py + 8, cellSize - 16, cellSize - 16);
                
                ctx.fillStyle = 'white';
                ctx.font = 'bold 20px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('★', px + cellSize / 2, py + cellSize / 2);
                break;
        }
    }

    drawPlayer(ctx, x, y, cellSize) {
        const px = x * cellSize + cellSize / 2;
        const py = y * cellSize + cellSize / 2;

        ctx.fillStyle = '#2ecc71';
        ctx.beginPath();
        ctx.arc(px, py, cellSize / 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#27ae60';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('P', px, py);
    }

    drawBox(ctx, x, y, cellSize) {
        const px = x * cellSize + cellSize / 2;
        const py = y * cellSize + cellSize / 2;
        const size = cellSize / 2.5;

        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(px - size / 2, py - size / 2, size, size);

        ctx.strokeStyle = '#c0392b';
        ctx.lineWidth = 2;
        ctx.strokeRect(px - size / 2, py - size / 2, size, size);

        ctx.fillStyle = 'white';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('B', px, py);
    }

    updateUI() {
        document.getElementById('moveCount').textContent = this.moveCount;
        
        const boxHalf = this.boxPos.y < HALF_SIZE ? '上' : '下';
        document.getElementById('boxPosition').textContent = `(${this.boxPos.x}, ${this.boxPos.y}) - ${boxHalf}半`;
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
