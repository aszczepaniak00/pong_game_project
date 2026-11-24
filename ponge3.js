<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Pong Coil Project Online</title>
    <style>
        body {
            background-color: #1a1a1a;
            color: #ffffff;
            font-family: monospace;
            text-align: center;
            margin: 0;
            padding: 20px;
        }
        h1 { color: #4CAF50; margin-bottom: 10px; }
        .score-board { font-size: 24px; margin-bottom: 10px; }
        .controls { margin-bottom: 15px; }
        button {
            padding: 8px 16px;
            margin: 0 5px;
            font-family: monospace;
            font-size: 14px;
            cursor: pointer;
            background-color: #4CAF50;
            color: #ffffff;
            border: none;
            border-radius: 4px;
        }
        #restartBtn { display: none; background-color: #ff9800; font-weight: bold; }
        canvas {
            background-color: #000000;
            border: 2px solid #4CAF50;
            max-width: 95vw;
            height: auto;
        }
    </style>
</head>
<body>
    <h1>Pong Project - Test Environment</h1>
    
    <div class="score-board">
        Player 1: <span id="p1Score">0</span> &nbsp;&nbsp;|&nbsp;&nbsp; Player 2: <span id="p2Score">0</span>
    </div>

    <div class="controls">
        <button id="sfxBtn">SFX: ON</button>
        <button id="musicBtn">Music: OFF</button>
        <button id="restartBtn">Play Again</button>
    </div>

    <canvas width="1500" height="585" id="game"></canvas>

<script>
const canvas = document.getElementById('game');
const context = canvas.getContext('2d');
const grid = 15;
const paddleHeight = grid * 5;
const maxPaddleY = canvas.height - grid - paddleHeight;

var paddleSpeed = 6;
var ballSpeed = 3;
var maxBallSpeed = 8;

const WINNING_SCORE = 10;
let score1 = 0;
let score2 = 0;
let gameOver = false;
let winnerText = '';

const p1ScoreEl = document.getElementById('p1Score');
const p2ScoreEl = document.getElementById('p2Score');
const restartBtn = document.getElementById('restartBtn');

const leftPaddle = { x: grid * 2, y: canvas.height / 2 - paddleHeight / 2, width: grid, height: paddleHeight, dy: 0 };
const rightPaddle = { x: canvas.width - grid * 3, y: canvas.height / 2 - paddleHeight / 2, width: grid, height: paddleHeight, dy: 0 };
const ball = { x: canvas.width / 2, y: canvas.height / 2, width: grid, height: grid, resetting: false, dx: ballSpeed, dy: -ballSpeed };

let audioCtx = null;
let sfxEnabled = true;

function initAudio() {
  if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playBeep(freq, dur) {
  if (!sfxEnabled || !audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + dur);
}

document.getElementById('sfxBtn').onclick = function() {
  initAudio();
  sfxEnabled = !sfxEnabled;
  this.textContent = sfxEnabled ? 'SFX: ON' : 'SFX: OFF';
  this.blur();
};

let bgMusic = null;
let musicPlaying = false;
document.getElementById('musicBtn').onclick = function() {
  initAudio();
  if (!bgMusic) {
    bgMusic = new Audio('muzyka.mp3');
    bgMusic.loop = true;
    bgMusic.volume = 0.3;
  }
  if (!musicPlaying) {
    bgMusic.play().then(() => { musicPlaying = true; this.textContent = 'Music: ON'; }).catch(() => { this.textContent = 'No muzyka.mp3'; });
  } else {
    bgMusic.pause();
    musicPlaying = false;
    this.textContent = 'Music: OFF';
  }
  this.blur();
};

restartBtn.onclick = function() {
  score1 = 0; score2 = 0;
  p1ScoreEl.textContent = 0; p2ScoreEl.textContent = 0;
  gameOver = false;
  restartBtn.style.display = 'none';
  leftPaddle.y = canvas.height / 2 - paddleHeight / 2;
  rightPaddle.y = canvas.height / 2 - paddleHeight / 2;
  ball.x = canvas.width / 2; ball.y = canvas.height / 2;
  ball.dx = ballSpeed; ball.dy = -ballSpeed;
  ball.resetting = false;
  this.blur();
};

function collides(obj1, obj2) {
  return obj1.x < obj2.x + obj2.width && obj1.x + obj1.width > obj2.x && obj1.y < obj2.y + obj2.height && obj1.y + obj1.height > obj2.y;
}

let blocks = [
  { x: 400, y: 150, width: 30, height: 60 },
  { x: 400, y: 380, width: 30, height: 60 },
  { x: 1070, y: 150, width: 30, height: 60 },
  { x: 1070, y: 380, width: 30, height: 60 }
];

function moveBlocks() {
  for (let i = 0; i < blocks.length; i++) {
    blocks[i].y = Math.floor(Math.random() * 420) + 60;
  }
}

function loop() {
  requestAnimationFrame(loop);
  context.clearRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = 'lightgrey';
  context.fillRect(0, 0, canvas.width, grid);
  context.fillRect(0, canvas.height - grid, canvas.width, canvas.height);

  if (gameOver) {
    context.fillStyle = '#4CAF50';
    context.font = 'bold 48px monospace';
    context.textAlign = 'center';
    context.fillText(winnerText, canvas.width / 2, canvas.height / 2 - 20);
    context.fillStyle = '#ffffff';
    context.font = '24px monospace';
    context.fillText('Final Score: ' + score1 + ' - ' + score2, canvas.width / 2, canvas.height / 2 + 30);
    return;
  }

  leftPaddle.y += leftPaddle.dy;
  rightPaddle.y += rightPaddle.dy;

  if (leftPaddle.y < grid) leftPaddle.y = grid;
  else if (leftPaddle.y > maxPaddleY) leftPaddle.y = maxPaddleY;

  if (rightPaddle.y < grid) rightPaddle.y = grid;
  else if (rightPaddle.y > maxPaddleY) rightPaddle.y = maxPaddleY;

  context.fillStyle = 'white';
  context.fillRect(leftPaddle.x, leftPaddle.y, leftPaddle.width, leftPaddle.height);
  context.fillRect(rightPaddle.x, rightPaddle.y, rightPaddle.width, rightPaddle.height);
  context.fillStyle = '#4CAF50';
  for (let i = 0; i < blocks.length; i++) {
    context.fillRect(blocks[i].x, blocks[i].y, blocks[i].width, blocks[i].height);
    if (collides(ball, blocks[i])) {
      ball.dx *= -1;
      playBeep(330, 0.08);
    }
  }

  ball.x += ball.dx;
  ball.y += ball.dy;

  if (ball.y < grid) { ball.y = grid; ball.dy *= -1; playBeep(220, 0.08); }
  else if (ball.y + grid > canvas.height - grid) { ball.y = canvas.height - grid * 2; ball.dy *= -1; playBeep(220, 0.08); }

  if ((ball.x < 0 || ball.x > canvas.width) && !ball.resetting) {
    ball.resetting = true;
    let dir = ball.x < 0 ? 1 : -1;
    if (ball.x < 0) { score2++; p2ScoreEl.textContent = score2; }
    else { score1++; p1ScoreEl.textContent = score1; }

    if (score1 >= WINNING_SCORE || score2 >= WINNING_SCORE) {
      gameOver = true;
      winnerText = score1 >= WINNING_SCORE ? 'PLAYER 1 WINS!' : 'PLAYER 2 WINS!';
      restartBtn.style.display = 'inline-block';
      playBeep(660, 0.3);
      return;
    }

    playBeep(110, 0.25);
	moveBlocks();
    setTimeout(() => {
      if (gameOver) return;
      ball.resetting = false;
      ball.x = canvas.width / 2; ball.y = canvas.height / 2;
      ball.dx = ballSpeed * dir;
      ball.dy = (Math.random() > 0.5 ? 1 : -1) * ballSpeed;
    }, 400);
  }

  if (collides(ball, leftPaddle)) {
    ball.dx *= -1;
    if (Math.abs(ball.dx) < maxBallSpeed) ball.dx *= 1.15;
    ball.x = leftPaddle.x + leftPaddle.width;
    playBeep(440, 0.08);
  } else if (collides(ball, rightPaddle)) {
    ball.dx *= -1;
    if (Math.abs(ball.dx) < maxBallSpeed) ball.dx *= 1.15;
    ball.x = rightPaddle.x - ball.width;
    playBeep(440, 0.08);
  }

  context.fillRect(ball.x, ball.y, ball.width, ball.height);

  context.fillStyle = 'lightgrey';
  for (let i = grid; i < canvas.height - grid; i += grid * 2) {
    context.fillRect(canvas.width / 2 - grid / 2, i, grid, grid);
  }
}

document.addEventListener('keydown', function(e) {
  initAudio();
  if (e.which === 38) rightPaddle.dy = -paddleSpeed;
  else if (e.which === 40) rightPaddle.dy = paddleSpeed;
  if (e.which === 87) leftPaddle.dy = -paddleSpeed;
  else if (e.which === 83) leftPaddle.dy = paddleSpeed;
});

document.addEventListener('keyup', function(e) {
  if (e.which === 38 || e.which === 40) rightPaddle.dy = 0;
  if (e.which === 83 || e.which === 87) leftPaddle.dy = 0;
});

requestAnimationFrame(loop);
</script>
</body>
</html>