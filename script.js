const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const previewCtx = document.getElementById('previewCanvas').getContext('2d');

// 添加键盘控制
document.addEventListener('keydown', (e) => {
  if(!gameLoop) return;
  switch(e.key) {
    case 'ArrowLeft': if(!collision(-1,0,currentPiece.shape)) currentPiece.x--; break;
    case 'ArrowRight': if(!collision(1,0,currentPiece.shape)) currentPiece.x++; break;
    case 'ArrowUp': rotatePiece(); break;
    case 'ArrowDown': if(!collision(0,1,currentPiece.shape)) currentPiece.y++; break;
    case ' ': while(!collision(0,1,currentPiece.shape)) currentPiece.y++; break;
  }
  draw();
});
const BLOCK_SIZE = 40;
const COLS = 10;
const ROWS = 20;

// 初始化游戏状态
let score = 0;
let gameLoop;
let currentPiece;
let nextPiece;
let board = Array(ROWS).fill().map(() => Array(COLS).fill(0));

// 方块形状定义
// 绘制函数
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // 绘制当前方块
  ctx.fillStyle = currentPiece.color;
  currentPiece.shape.forEach((row, y) => {
    row.forEach((value, x) => {
      if(value) {
        ctx.fillRect(
          (currentPiece.x + x) * BLOCK_SIZE,
          (currentPiece.y + y) * BLOCK_SIZE,
          BLOCK_SIZE - 1,
          BLOCK_SIZE - 1
        );
      }
    });
  });

  // 绘制已固定方块
  board.forEach((row, y) => {
    row.forEach((value, x) => {
      if(value) {
        ctx.fillStyle = value;
        ctx.fillRect(
          x * BLOCK_SIZE,
          y * BLOCK_SIZE,
          BLOCK_SIZE - 1,
          BLOCK_SIZE - 1
        );
      }
    });
  });
}

// 预览方块绘制
function drawPreview() {
  previewCtx.clearRect(0, 0, 100, 100);
  const blockSize = 20;
  nextPiece.shape.forEach((row, y) => {
    row.forEach((value, x) => {
      if(value) {
        previewCtx.fillStyle = nextPiece.color;
        previewCtx.fillRect(
          x * blockSize + 10,
          y * blockSize + 10,
          blockSize - 1,
          blockSize - 1
        );
      }
    });
  });
}

// 碰撞检测
function collision(offsetX, offsetY, shape) {
  return shape.some((row, y) => 
    row.some((value, x) => {
      const newX = currentPiece.x + x + offsetX;
      const newY = currentPiece.y + y + offsetY;
      return (
        value && (
          newX < 0 || 
          newX >= COLS ||
          newY >= ROWS ||
          (newY >= 0 && board[newY]?.[newX])
        )
      );
    })
  );
}

// 合并方块到棋盘
function mergePiece() {
  currentPiece.shape.forEach((row, y) => {
    row.forEach((value, x) => {
      if(value) {
        board[currentPiece.y + y][currentPiece.x + x] = '#4CAF50';
      }
    });
  });
}

// 消行检测
function clearLines() {
  let linesCleared = 0;
  for(let y = ROWS - 1; y >= 0; y--) {
    if(board[y].every(cell => cell)) {
      board.splice(y, 1);
      board.unshift(Array(COLS).fill(0));
      linesCleared++;
      y++; // 重新检查当前行
    }
  }
  if(linesCleared > 0) {
    updateScore(linesCleared * 100);
  }
}

const SHAPES = [
  [[1,1,1,1]], // I型
  [[1,1],[1,1]], // O型
  [[1,1,1],[0,1,0]], // T型
  [[1,1,1],[1,0,0]], // L型
  [[1,1,1],[0,0,1]], // J型
  [[1,1,0],[0,1,1]], // S型
  [[0,1,1],[1,1,0]]  // Z型
];

// 初始化事件监听
document.addEventListener('DOMContentLoaded', updateLeaderboard);
document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('pauseBtn').addEventListener('click', togglePause);
document.getElementById('resetBtn').addEventListener('click', resetGame);

// 游戏控制函数
function startGame() {
  if (gameLoop) return;
  board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
  score = 0;
  document.getElementById('score').textContent = '0';
  currentPiece = createNewPiece();
  nextPiece = createNewPiece();
  drawPreview();
  gameLoop = setInterval(gameUpdate, 1000);
}

function togglePause() {
  if (gameLoop) {
    clearInterval(gameLoop);
    gameLoop = null;
    this.textContent = '继续';
  } else {
    gameLoop = setInterval(gameUpdate, 1000);
    this.textContent = '暂停';
  }
}

function resetGame() {
  clearInterval(gameLoop);
  gameLoop = null;
  board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
  score = 0;
  document.getElementById('score').textContent = '0';
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// 方块生成与旋转逻辑
function createNewPiece() {
  const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
  const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];
  return {
    shape,
    color: colors[Math.floor(Math.random() * colors.length)],
    x: Math.floor(COLS/2) - Math.floor(shape[0].length/2),
    y: 0
  };
}

function rotatePiece() {
  const newShape = currentPiece.shape[0].map((_, i) =>
    currentPiece.shape.map(row => row[i]).reverse()
  );
  if (!collision(0, 0, newShape)) {
    currentPiece.shape = newShape;
  }
}

// 游戏主循环
function gameUpdate() {
  if (!collision(0, 1, currentPiece.shape)) {
    currentPiece.y++;
  } else {
    mergePiece();
    clearLines();
    currentPiece = nextPiece;
    nextPiece = createNewPiece();
    drawPreview();
    if (collision(0, 0, currentPiece.shape)) {
      clearInterval(gameLoop);
      
      // 保存当前分数
      let scores = JSON.parse(localStorage.getItem('tetrisScores') || '[]');
      scores.push(score);
      scores = [...new Set(scores)].sort((a,b) => b-a).slice(0,5);
      localStorage.setItem('tetrisScores', JSON.stringify(scores));
      
      alert('游戏结束！');
      updateLeaderboard();
      return;
    }
  }
  draw();
}

// 积分与排行榜处理
function updateScore(points) {
  score += points;
  document.getElementById('score').textContent = score;
}

function updateLeaderboard() {
  let scores = JSON.parse(localStorage.getItem('tetrisScores') || '[]');
  const list = document.getElementById('highScores');
  list.innerHTML = scores
    .sort((a,b) => b - a)
    .slice(0,5)
    .map((score,index) => `<li>第${index+1}名: ${score}分</li>`)
    .join('');
}
