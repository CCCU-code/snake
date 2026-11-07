const canvas = document.querySelector("#gameCanvas");
const context = canvas.getContext("2d");
const scoreElement = document.querySelector("#score");
const highScoreElement = document.querySelector("#highScore");
const statusElement = document.querySelector("#statusText");
const statusLabel = document.querySelector("#statusLabel");
const startButton = document.querySelector("#startButton");
const startButtonLabel = document.querySelector("#startButtonLabel");
const restartButton = document.querySelector("#restartButton");
const overlay = document.querySelector("#gameOverlay");
const overlayButton = document.querySelector("#overlayButton");
const overlayLabel = document.querySelector("#overlayLabel");
const overlayTitle = document.querySelector("#overlayTitle");
const overlayText = document.querySelector("#overlayText");

const GRID_SIZE = 20;
const BOARD_SIZE = 560;
const CELL_SIZE = BOARD_SIZE / GRID_SIZE;
const START_STEP_MS = 125;
const MIN_STEP_MS = 82;
const HIGH_SCORE_KEY = "snake-high-score";
const DIRECTIONS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

let snake = [];
let food = { x: 0, y: 0 };
let direction = DIRECTIONS.right;
let queuedDirection = DIRECTIONS.right;
let score = 0;
let highScore = readHighScore();
let status = "ready";
let stepDuration = START_STEP_MS;
let accumulator = 0;
let lastFrameTime = 0;
let animationFrameId = null;
let foodPulse = 0;
let particles = [];

function readHighScore() {
  try {
    return Number.parseInt(localStorage.getItem(HIGH_SCORE_KEY) || "0", 10) || 0;
  } catch {
    return 0;
  }
}

function saveHighScore() {
  try {
    localStorage.setItem(HIGH_SCORE_KEY, String(highScore));
  } catch {
    // The game still works when storage is unavailable.
  }
}

function resetGame() {
  snake = [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ];
  direction = DIRECTIONS.right;
  queuedDirection = DIRECTIONS.right;
  score = 0;
  stepDuration = START_STEP_MS;
  accumulator = 0;
  status = "ready";
  particles = [];
  setFood();
  updateScore();
  setStatus("ready", "准备开始");
  setStartButton(false);
  overlay.classList.add("is-hidden");
  render();
}

function startGame() {
  if (status === "over") {
    resetGame();
  }

  status = "running";
  accumulator = 0;
  lastFrameTime = performance.now();
  setStatus("running", "游戏进行中");
  setStartButton(true);
  overlay.classList.add("is-hidden");

  if (!animationFrameId) {
    animationFrameId = requestAnimationFrame(gameLoop);
  }
}

function pauseGame() {
  if (status !== "running") {
    return;
  }

  status = "paused";
  setStatus("paused", "已暂停");
  setStartButton(false);
}

function toggleGame() {
  if (status === "running") {
    pauseGame();
  } else {
    startGame();
  }
}

function endGame() {
  status = "over";
  setStatus("over", "游戏结束");
  setStartButton(false);
  overlayLabel.textContent = "GAME OVER";
  overlayTitle.textContent = "撞到了";
  overlayText.textContent = `本局得分 ${score}`;

  if (score > highScore) {
    highScore = score;
    saveHighScore();
    updateScore();
    overlayLabel.textContent = "NEW HIGH SCORE";
    overlayTitle.textContent = "新纪录";
  }

  overlay.classList.remove("is-hidden");
}

function setStatus(nextStatus, label) {
  statusElement.classList.toggle("is-running", nextStatus === "running");
  statusElement.classList.toggle("is-over", nextStatus === "over");
  statusLabel.textContent = label;
}

function setStartButton(isPlaying) {
  startButton.classList.toggle("is-playing", isPlaying);
  startButtonLabel.textContent = isPlaying
    ? "暂停"
    : status === "paused"
      ? "继续"
      : "开始游戏";
}

function updateScore() {
  scoreElement.textContent = score;
  highScoreElement.textContent = highScore;
}

function setFood() {
  const availableCells = [];

  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      if (!snake.some((segment) => segment.x === x && segment.y === y)) {
        availableCells.push({ x, y });
      }
    }
  }

  if (availableCells.length === 0) {
    endGame();
    return;
  }

  food = availableCells[Math.floor(Math.random() * availableCells.length)];
}

function queueDirection(nextDirection) {
  if (status === "over") {
    return;
  }

  const isOpposite =
    nextDirection.x + queuedDirection.x === 0 &&
    nextDirection.y + queuedDirection.y === 0;
  const isSame =
    nextDirection.x === queuedDirection.x &&
    nextDirection.y === queuedDirection.y;

  if (!isOpposite && !isSame) {
    queuedDirection = nextDirection;
  }

  if (status === "ready") {
    startGame();
  }
}

function moveSnake() {
  direction = queuedDirection;

  const head = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y,
  };
  const willEat = head.x === food.x && head.y === food.y;
  const nextSnake = [head, ...snake];

  if (!willEat) {
    nextSnake.pop();
  }

  const hitWall =
    head.x < 0 ||
    head.x >= GRID_SIZE ||
    head.y < 0 ||
    head.y >= GRID_SIZE;
  const hitSelf = nextSnake
    .slice(1)
    .some((segment) => segment.x === head.x && segment.y === head.y);

  if (hitWall || hitSelf) {
    endGame();
    return;
  }

  snake = nextSnake;

  if (willEat) {
    score += 10;
    stepDuration = Math.max(
      MIN_STEP_MS,
      START_STEP_MS - Math.floor(score / 50) * 5,
    );
    createFoodBurst(food);
    setFood();
    updateScore();
  }
}

function createFoodBurst(position) {
  const centerX = (position.x + 0.5) * CELL_SIZE;
  const centerY = (position.y + 0.5) * CELL_SIZE;

  for (let index = 0; index < 8; index += 1) {
    const angle = (Math.PI * 2 * index) / 8;
    const speed = 1.5 + Math.random() * 2.2;

    particles.push({
      x: centerX,
      y: centerY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      size: 3 + Math.random() * 3,
    });
  }
}

function updateParticles(deltaTime) {
  particles = particles.filter((particle) => {
    particle.x += particle.vx * deltaTime * 0.06;
    particle.y += particle.vy * deltaTime * 0.06;
    particle.vy += 0.055 * deltaTime * 0.06;
    particle.life -= deltaTime * 0.0024;
    return particle.life > 0;
  });
}

function gameLoop(timestamp) {
  const deltaTime = Math.min(timestamp - lastFrameTime, 100);
  lastFrameTime = timestamp;
  foodPulse += deltaTime * 0.006;
  updateParticles(deltaTime);

  if (status === "running") {
    accumulator += deltaTime;

    while (accumulator >= stepDuration) {
      moveSnake();
      accumulator -= stepDuration;

      if (status !== "running") {
        accumulator = 0;
        break;
      }
    }
  }

  render();
  animationFrameId = requestAnimationFrame(gameLoop);
}

function roundedRect(x, y, width, height, radius) {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.roundRect(x, y, width, height, safeRadius);
}

function drawBoard() {
  context.fillStyle = "#12251d";
  context.fillRect(0, 0, BOARD_SIZE, BOARD_SIZE);

  const glow = context.createRadialGradient(
    BOARD_SIZE * 0.72,
    BOARD_SIZE * 0.22,
    0,
    BOARD_SIZE * 0.72,
    BOARD_SIZE * 0.22,
    BOARD_SIZE * 0.7,
  );
  glow.addColorStop(0, "rgba(47, 167, 111, 0.13)");
  glow.addColorStop(1, "rgba(18, 37, 29, 0)");
  context.fillStyle = glow;
  context.fillRect(0, 0, BOARD_SIZE, BOARD_SIZE);

  context.strokeStyle = "rgba(255, 255, 255, 0.052)";
  context.lineWidth = 1;

  for (let index = 1; index < GRID_SIZE; index += 1) {
    const position = index * CELL_SIZE + 0.5;
    context.beginPath();
    context.moveTo(position, 0);
    context.lineTo(position, BOARD_SIZE);
    context.stroke();
    context.beginPath();
    context.moveTo(0, position);
    context.lineTo(BOARD_SIZE, position);
    context.stroke();
  }

  const inset = 8;
  context.strokeStyle = "rgba(125, 222, 159, 0.2)";
  context.lineWidth = 2;
  roundedRect(inset, inset, BOARD_SIZE - inset * 2, BOARD_SIZE - inset * 2, 13);
  context.stroke();
}

function drawFood() {
  const centerX = (food.x + 0.5) * CELL_SIZE;
  const centerY = (food.y + 0.55) * CELL_SIZE;
  const radius = CELL_SIZE * (0.24 + Math.sin(foodPulse) * 0.012);

  context.save();
  context.shadowColor = "rgba(243, 107, 79, 0.52)";
  context.shadowBlur = 16;
  context.fillStyle = "#f36b4f";
  context.beginPath();
  context.arc(centerX, centerY, radius, 0, Math.PI * 2);
  context.fill();
  context.restore();

  context.fillStyle = "#ff9d78";
  context.beginPath();
  context.arc(centerX - radius * 0.3, centerY - radius * 0.34, radius * 0.22, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = "#f4c95d";
  context.lineWidth = 2.4;
  context.lineCap = "round";
  context.beginPath();
  context.moveTo(centerX + 1, centerY - radius * 0.78);
  context.quadraticCurveTo(centerX + 4, centerY - radius * 1.45, centerX + 9, centerY - radius * 1.5);
  context.stroke();
}

function drawSnake() {
  snake.forEach((segment, index) => {
    const inset = index === 0 ? 2.1 : 2.7;
    const x = segment.x * CELL_SIZE + inset;
    const y = segment.y * CELL_SIZE + inset;
    const size = CELL_SIZE - inset * 2;
    const isHead = index === 0;

    context.save();
    context.shadowColor = isHead
      ? "rgba(125, 222, 159, 0.38)"
      : "rgba(47, 167, 111, 0.18)";
    context.shadowBlur = isHead ? 14 : 7;
    context.fillStyle = isHead ? "#7dde9f" : index % 2 === 0 ? "#47c882" : "#3dbd77";
    roundedRect(x, y, size, size, isHead ? 8 : 7);
    context.fill();
    context.restore();

    if (isHead) {
      drawEyes(segment, x, y, size);
    }
  });
}

function drawEyes(segment, x, y, size) {
  const eyeRadius = 2.2;
  const forwardOffset = size * 0.28;
  const sideOffset = size * 0.22;
  let eyeOne;
  let eyeTwo;

  if (direction === DIRECTIONS.up || direction === DIRECTIONS.down) {
    const xOffset = direction === DIRECTIONS.up ? -forwardOffset : forwardOffset;
    eyeOne = { x: x + size / 2 - sideOffset, y: y + size / 2 + xOffset };
    eyeTwo = { x: x + size / 2 + sideOffset, y: y + size / 2 + xOffset };
  } else {
    const xOffset = direction === DIRECTIONS.left ? -forwardOffset : forwardOffset;
    eyeOne = { x: x + size / 2 + xOffset, y: y + size / 2 - sideOffset };
    eyeTwo = { x: x + size / 2 + xOffset, y: y + size / 2 + sideOffset };
  }

  context.fillStyle = "#173126";
  context.beginPath();
  context.arc(eyeOne.x, eyeOne.y, eyeRadius, 0, Math.PI * 2);
  context.arc(eyeTwo.x, eyeTwo.y, eyeRadius, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#ffffff";
  context.beginPath();
  context.arc(eyeOne.x - 0.7, eyeOne.y - 0.7, 0.7, 0, Math.PI * 2);
  context.arc(eyeTwo.x - 0.7, eyeTwo.y - 0.7, 0.7, 0, Math.PI * 2);
  context.fill();
}

function drawParticles() {
  particles.forEach((particle) => {
    context.globalAlpha = particle.life;
    context.fillStyle = particle.life > 0.55 ? "#f4c95d" : "#f36b4f";
    context.beginPath();
    context.arc(particle.x, particle.y, particle.size * particle.life, 0, Math.PI * 2);
    context.fill();
  });
  context.globalAlpha = 1;
}

function render() {
  context.clearRect(0, 0, BOARD_SIZE, BOARD_SIZE);
  drawBoard();
  drawFood();
  drawSnake();
  drawParticles();
}

function configureCanvas() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = BOARD_SIZE * ratio;
  canvas.height = BOARD_SIZE * ratio;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.imageSmoothingEnabled = true;
  render();
}

const keyDirections = {
  ArrowUp: DIRECTIONS.up,
  ArrowDown: DIRECTIONS.down,
  ArrowLeft: DIRECTIONS.left,
  ArrowRight: DIRECTIONS.right,
  w: DIRECTIONS.up,
  W: DIRECTIONS.up,
  s: DIRECTIONS.down,
  S: DIRECTIONS.down,
  a: DIRECTIONS.left,
  A: DIRECTIONS.left,
  d: DIRECTIONS.right,
  D: DIRECTIONS.right,
};

window.addEventListener("keydown", (event) => {
  const nextDirection = keyDirections[event.key];

  if (nextDirection) {
    event.preventDefault();
    queueDirection(nextDirection);
    return;
  }

  if (event.key === " " || event.key === "Enter") {
    event.preventDefault();
    toggleGame();
  }
});

startButton.addEventListener("click", toggleGame);
restartButton.addEventListener("click", () => {
  resetGame();
  startGame();
});
overlayButton.addEventListener("click", () => {
  resetGame();
  startGame();
});

window.addEventListener("resize", configureCanvas);
document.addEventListener("visibilitychange", () => {
  if (document.hidden && status === "running") {
    pauseGame();
  }
});

configureCanvas();
resetGame();
