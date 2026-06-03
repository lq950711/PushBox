class LevelEditor {
    constructor() {
        this.gridWidth = 5;
        this.gridHeight = 6;
        this.halfHeight = 3;
        this.currentTool = 'floor';
        
        // 数据存储
        this.mapTop = this.createEmptyMap();
        this.mapBottom = this.createEmptyMap();
        this.playerPos = null;
        this.boxPos = null;
        this.goalPos = null;
        this.portals = {};
        
        this.init();
    }

    createEmptyMap() {
        return Array(this.halfHeight).fill(null).map(() => 
            Array(this.gridWidth).fill(2) // 2 = FLOOR
        );
    }

    init() {
        this.createGrids();
        this.attachToolButtons();
        this.attachGridListeners();
        this.updatePreview();
    }

    createGrids() {
        const gridTop = document.getElementById('gridTop');
        const gridBottom = document.getElementById('gridBottom');
        
        // Create top grid
        gridTop.innerHTML = '';
        for (let y = 0; y < this.halfHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell cell-floor';
                cell.dataset.half = 'top';
                cell.dataset.x = x;
                cell.dataset.y = y;
                cell.textContent = '';
                gridTop.appendChild(cell);
            }
        }
        
        // Add divider
        const divider = document.createElement('div');
        divider.className = 'divider';
        divider.dataset.half = 'top';
        gridTop.appendChild(divider);
        
        // Create bottom grid
        gridBottom.innerHTML = '';
        for (let y = 0; y < this.halfHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell cell-floor';
                cell.dataset.half = 'bottom';
                cell.dataset.x = x;
                cell.dataset.y = y;
                cell.textContent = '';
                gridBottom.appendChild(cell);
            }
        }
    }

    attachToolButtons() {
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentTool = btn.dataset.tool;
            });
        });
    }

    attachGridListeners() {
        document.querySelectorAll('.grid-cell').forEach(cell => {
            cell.addEventListener('click', () => this.handleCellClick(cell));
        });
    }

    handleCellClick(cell) {
        const half = cell.dataset.half;
        const x = parseInt(cell.dataset.x);
        const y = parseInt(cell.dataset.y);

        this.setCell(half, x, y, this.currentTool);
        this.updateCell(cell);
        this.updatePreview();
    }

    setCell(half, x, y, tool) {
        const map = half === 'top' ? this.mapTop : this.mapBottom;
        const tileMap = {
            'floor': 2,
            'wall': 1,
            'portal': 3,
            'goal': 4,
            'player': 5,
            'box': 6
        };

        // 清除其他玩家/箱子
        if (tool === 'player' && !this.playerPos) {
            this.playerPos = { half, x, y };
        } else if (tool === 'player') {
            if (this.playerPos.half === half) {
                map[this.playerPos.y][this.playerPos.x] = 2;
            }
            this.playerPos = { half, x, y };
        } else if (tool === 'box' && !this.boxPos) {
            this.boxPos = { half, x, y };
        } else if (tool === 'box') {
            if (this.boxPos.half === half) {
                map[this.boxPos.y][this.boxPos.x] = 2;
            }
            this.boxPos = { half, x, y };
        } else if (tool === 'goal') {
            // 清除其他目标
            if (this.goalPos && this.goalPos.half === half) {
                const goalMap = this.goalPos.half === 'top' ? this.mapTop : this.mapBottom;
                goalMap[this.goalPos.y][this.goalPos.x] = 2;
            }
            this.goalPos = { half, x, y };
        }

        // 设置新的单元格
        if (tool === 'player') {
            map[y][x] = 2; // 显示地板，记录位置
        } else if (tool === 'box') {
            map[y][x] = 2; // 显示地板，记录位置
        } else {
            map[y][x] = tileMap[tool];
        }
    }

    updateCell(cell) {
        const half = cell.dataset.half;
        const x = parseInt(cell.dataset.x);
        const y = parseInt(cell.dataset.y);

        // 移除所有类
        cell.className = 'grid-cell';

        // 检查特殊对象
        if (this.playerPos && this.playerPos.half === half && this.playerPos.x === x && this.playerPos.y === y) {
            cell.classList.add('cell-player');
            cell.textContent = 'P';
            return;
        }
        if (this.boxPos && this.boxPos.half === half && this.boxPos.x === x && this.boxPos.y === y) {
            cell.classList.add('cell-box');
            cell.textContent = 'B';
            return;
        }
        if (this.goalPos && this.goalPos.half === half && this.goalPos.x === x && this.goalPos.y === y) {
            cell.classList.add('cell-goal');
            cell.textContent = '★';
            return;
        }

        // 根据地图显示
        const map = half === 'top' ? this.mapTop : this.mapBottom;
        const tile = map[y][x];

        switch (tile) {
            case 1:
                cell.classList.add('cell-wall');
                cell.textContent = '■';
                break;
            case 3:
                cell.classList.add('cell-portal');
                cell.textContent = '◯';
                break;
            case 4:
                cell.classList.add('cell-goal');
                cell.textContent = '★';
                break;
            default:
                cell.classList.add('cell-floor');
                cell.textContent = '';
        }
    }

    updatePreview() {
        const preview = document.getElementById('preview');
        preview.innerHTML = '';

        // 上半场
        for (let y = 0; y < this.halfHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                const cell = document.createElement('div');
                cell.className = 'preview-cell cell-floor';

                if (this.playerPos && this.playerPos.half === 'top' && this.playerPos.x === x && this.playerPos.y === y) {
                    cell.className = 'preview-cell cell-player';
                    cell.textContent = 'P';
                } else if (this.boxPos && this.boxPos.half === 'top' && this.boxPos.x === x && this.boxPos.y === y) {
                    cell.className = 'preview-cell cell-box';
                    cell.textContent = 'B';
                } else {
                    const tile = this.mapTop[y][x];
                    if (tile === 1) {
                        cell.className = 'preview-cell cell-wall';
                        cell.textContent = '■';
                    } else if (tile === 3) {
                        cell.className = 'preview-cell cell-portal';
                        cell.textContent = '◯';
                    }
                }
                preview.appendChild(cell);
            }
        }

        // 分界线
        const divider = document.createElement('div');
        divider.className = 'divider-line';
        preview.appendChild(divider);

        // 下半场
        for (let y = 0; y < this.halfHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                const cell = document.createElement('div');
                cell.className = 'preview-cell cell-floor';

                if (this.playerPos && this.playerPos.half === 'bottom' && this.playerPos.x === x && this.playerPos.y === y) {
                    cell.className = 'preview-cell cell-player';
                    cell.textContent = 'P';
                } else if (this.boxPos && this.boxPos.half === 'bottom' && this.boxPos.x === x && this.boxPos.y === y) {
                    cell.className = 'preview-cell cell-box';
                    cell.textContent = 'B';
                } else if (this.goalPos && this.goalPos.half === 'bottom' && this.goalPos.x === x && this.goalPos.y === y) {
                    cell.className = 'preview-cell cell-goal';
                    cell.textContent = '★';
                } else {
                    const tile = this.mapBottom[y][x];
                    if (tile === 1) {
                        cell.className = 'preview-cell cell-wall';
                        cell.textContent = '■';
                    } else if (tile === 3) {
                        cell.className = 'preview-cell cell-portal';
                        cell.textContent = '◯';
                    }
                }
                preview.appendChild(cell);
            }
        }

        this.updateChecklist();
    }

    updateChecklist() {
        // 计算玩家数
        let playerCount = 0;
        if (this.playerPos) playerCount = 1;

        // 计算箱子数
        let boxCount = 0;
        if (this.boxPos) boxCount = 1;

        // 计算目标数
        let goalCount = 0;
        if (this.goalPos) goalCount = 1;

        // 计算传送门对数
        let portalCount = 0;
        for (let y = 0; y < this.halfHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                if (this.mapTop[y][x] === 3) portalCount++;
                if (this.mapBottom[y][x] === 3) portalCount++;
            }
        }
        portalCount = Math.floor(portalCount / 2);

        document.getElementById('checkPlayer').textContent = playerCount;
        document.getElementById('checkBox').textContent = boxCount;
        document.getElementById('checkGoal').textContent = goalCount;
        document.getElementById('checkPortal').textContent = portalCount;
        document.getElementById('checkHalf').textContent = 
            this.playerPos && this.playerPos.half === 'top' ? '上半场 ✓' : '下半场 ✗';
        document.getElementById('checkGoalHalf').textContent = 
            this.goalPos && this.goalPos.half === 'bottom' ? '下半场 ✓' : '上半场 ✗';
    }

    exportData() {
        const data = {
            mapTop: this.mapTop,
            mapBottom: this.mapBottom,
            playerPos: this.playerPos,
            boxPos: this.boxPos,
            goalPos: this.goalPos
        };

        const code = `{
    mapTop: ${JSON.stringify(this.mapTop)},
    mapBottom: ${JSON.stringify(this.mapBottom)},
    playerPos: { x: ${this.playerPos.x}, y: ${this.playerPos.y} },
    boxPos: { x: ${this.boxPos.x}, y: ${this.boxPos.half === 'bottom' ? this.boxPos.y + 3 : this.boxPos.y} },
    portalPairs: [
        {
            topPos: { x: 0, y: 0 },
            bottomPos: { x: 0, y: 3 }
        }
    ]
}`;

        document.getElementById('dataExport').value = code;
        alert('数据已导出！');
    }

    importData() {
        const text = document.getElementById('dataExport').value;
        try {
            // 简单的 JSON 解析
            const data = JSON.parse(text.replace(/([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '"$1":'));
            
            if (data.mapTop && data.mapBottom) {
                this.mapTop = data.mapTop;
                this.mapBottom = data.mapBottom;
                this.playerPos = data.playerPos ? { ...data.playerPos, half: 'top' } : null;
                this.boxPos = data.boxPos ? { 
                    x: data.boxPos.x, 
                    y: data.boxPos.y % 3,
                    half: data.boxPos.y >= 3 ? 'bottom' : 'top'
                } : null;
                this.goalPos = data.goalPos ? { ...data.goalPos, half: 'bottom' } : null;
                
                this.createGrids();
                this.attachGridListeners();
                this.updateAllCells();
                alert('数据导入成功！');
            }
        } catch (e) {
            alert('导入失败：' + e.message);
        }
    }

    updateAllCells() {
        document.querySelectorAll('.grid-cell').forEach(cell => {
            this.updateCell(cell);
        });
        this.updatePreview();
    }

    copyToClipboard() {
        const textarea = document.getElementById('dataExport');
        textarea.select();
        document.execCommand('copy');
        alert('已复制到剪贴板！');
    }

    clearAll() {
        if (confirm('确定要清空所有数据吗？')) {
            this.mapTop = this.createEmptyMap();
            this.mapBottom = this.createEmptyMap();
            this.playerPos = null;
            this.boxPos = null;
            this.goalPos = null;
            this.createGrids();
            this.attachGridListeners();
            this.updateAllCells();
        }
    }

    testLevel() {
        if (!this.playerPos || !this.boxPos || !this.goalPos) {
            alert('请设置玩家、箱子和目标的位置！');
            return;
        }
        alert('测试功能将在游戏中集成！\\n现在请复制导出的数据到 game.js 中的关卡配置。');
    }
}

// 初始化编辑器
const editor = new LevelEditor();
