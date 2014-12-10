'use strict'

function Vector(x, y) {
  this.x = x;
  this.y = y;
}
Vector.prototype.equals = function(other) {
  return (this.x == other.x) && (this.y == other.y);
};
Vector.prototype.isOppositeOf = function(other) { 
  return (this.x == -other.x) && (this.y == -other.y);
};


function Grid(width, height) {
  this.space  = new Array(width * height);
  this.width  = width; 
  this.height = height;
}
Grid.prototype.get = function(vector) {
  return this.space[vector.x + this.width * vector.y];
};
Grid.prototype.set = function(vector, value) {
  this.space[vector.x + this.width * vector.y] = value;
};


function Coin() {
  this.placed = false;
  this.value  = 10;
  this.position;
}
Coin.prototype.isPlaced = function() {
  return this.placed;
};
Coin.prototype.getValue = function() {
  return this.value;
};
Coin.prototype.getPosition = function() {
  return this.position;
};
Coin.prototype.place = function(occupied, width, height) {
  while (!this.placed) {
    var posX = Math.floor(Math.random() * width);
    var posY = Math.floor(Math.random() * height);
    var position = new Vector(posX, posY);
    this.placed = true;
    occupied.forEach(function(other) {
      if (position.equals(other)) this.placed = false;
    }.bind(this));
  }
  this.position = position;
};
Coin.prototype.grab = function() {
  this.placed = false;
};


function Snake() {
  this.size             = 1;
  this.direction        = new Vector(1, 0);
  this.positions        = [new Vector(0, 0)];
}
Snake.prototype.hitItself = function() {
  for (var i = 1; i < this.positions.length; i++)
    if (this.positions[0].equals(this.positions[i]))
      return true;
  return false;
};
Snake.prototype.getPositions = function() {
  return this.positions;
};
Snake.prototype.grow = function() {
  this.size += 1;
};
Snake.prototype.move = function(direction, width, height) {
  if (!direction.isOppositeOf(this.direction))
    this.direction = direction;

  // compute the new head position
  var posX = (this.positions[0].x + this.direction.x + width) % width;
  var posY = (this.positions[0].y + this.direction.y + height) % height;
  this.positions.unshift(new Vector(posX, posY));

  if (this.positions.length > this.size)
    this.trailingPosition = this.positions.pop();
};


function Directions() {
  this.activeKey = 39;  // default direction
  document.body.addEventListener("keydown", function(event) {
    if (this.legend.hasOwnProperty(event.keyCode)) {
      if (!renderer.isStopped()) this.activeKey = event.keyCode;
      event.preventDefault();
    }
  }.bind(this));
}
Directions.prototype.legend = {
  37 : new Vector(-1, 0),
  38 : new Vector(0, -1),
  39 : new Vector(1, 0),
  40 : new Vector(0, 1)
};
Directions.prototype.getActive = function() {
  return this.legend[this.activeKey];
};


function World(width, height) {
  this.width        = width;
  this.height       = height;
  this.directions   = new Directions();
  this.snake        = new Snake();
  this.coin         = new Coin();
  this.lost         = false;
  this.score        = 0;
  this.grid;            
}
World.prototype.playerLost = function() {
  return this.lost;
};
World.prototype.getScore = function() {
  return this.score;
};
World.prototype.getGrid = function() {
  return this.grid;
};
World.prototype.turn = function() {
  this.snake.move(this.directions.getActive(), this.width, this.height);
  if (this.snake.hitItself()) {
    this.lost = true;
    return;
  }

  this.grid = new Grid(this.width, this.height); 
  var snakePositions = this.snake.getPositions(), coinPosition;
  snakePositions.forEach(function(pos) {
    this.grid.set(pos, 'x');
  }.bind(this));

  if (this.coin.isPlaced()) {
    coinPosition = this.coin.getPosition();
    if (coinPosition.equals(snakePositions[0])) {
      this.coin.grab();
      this.snake.grow();
      this.score += this.coin.getValue();
    } else this.grid.set(coinPosition, 'o');
  } else {
    if (snakePositions.length < this.width * this.height) {
      this.coin.place(snakePositions, this.width, this.height);
      coinPosition = this.coin.getPosition();
      this.grid.set(coinPosition, 'o');
    }
  }
};


function Display(unit, width, height) {
  this.unit           = unit;
  this.width          = width;
  this.height         = height;

  var game            = document.querySelector("#game");
  this.cx             = game.getContext("2d");
  this.cx.fillStyle   = "#000000";
  this.cx.strokeStyle = "#000000";
  this.cx.lineWidth   = 2;
}
Display.prototype.clear = function() {
  this.cx.clearRect(0, 0, this.width * this.unit, this.height * this.unit);  
};
Display.prototype.fill = function(vector) {
  this.cx.fillRect((vector.x + 0.05) * this.unit, 
                   (vector.y + 0.05) * this.unit, 
                   0.9 * this.unit, 0.9 * this.unit);
};
Display.prototype.stroke = function(vector) {
  this.cx.strokeRect((vector.x + 0.15) * this.unit, 
                     (vector.y + 0.15) * this.unit,
                     0.7 * this.unit, 0.7 * this.unit);
}
Display.prototype.drawFrame = function(grid) {
  this.clear();
  var vector;
  for (var y = 0; y < this.height; y++) 
    for (var x = 0; x < this.width; x++) {
      vector = new Vector(x, y);
      if (grid.get(vector) == 'x') this.fill(vector);    // snake
      if (grid.get(vector) == 'o') this.stroke(vector);  // coin
    }
};


function Buttons(unit) {
  this.unit = unit;

  var buttons         = document.querySelector("#buttons");
  this.cx             = buttons.getContext("2d");
  this.cx.fillStyle   = "#66CCFF";
  this.cx.strokeStyle = "#66CCFF";
  this.cx.lineWidth   = 2;

  buttons.addEventListener("mousedown", function(event) {
    if (renderer.isStopped()) {
      renderer.start();
      this.drawPlaying();
    } else {
      renderer.stop();
      this.drawPaused();
    }
  }.bind(this));

  this.drawPaused();
};
Buttons.prototype.drawPaused = function() {
  var lw = this.cx.lineWidth;
  this.cx.clearRect(0, 0, 4 * this.unit, 2 * this.unit);

  // filled play button
  this.cx.beginPath();
  this.cx.moveTo(0, 0);
  this.cx.lineTo(1.5 * this.unit, this.unit);
  this.cx.lineTo(0, 2 * this.unit);
  this.cx.closePath();
  this.cx.fill();

  // stroked pause button
  this.cx.strokeRect(2 * this.unit + 0.5 * lw, 0.5 * lw,
                     0.5 * this.unit - lw, 2 * this.unit - lw);
  this.cx.strokeRect(3 * this.unit + 0.5 * lw, 0.5 * lw,
                     0.5 * this.unit - lw, 2 * this.unit - lw);
};
Buttons.prototype.drawPlaying = function() {
  var lw = this.cx.lineWidth;
  this.cx.clearRect(0, 0, 4 * this.unit, 2 * this.unit);

  // stroked play button
  this.cx.beginPath();
  this.cx.moveTo(0 + 0.5 * lw, 0 + 0.5 * lw);
  this.cx.lineTo(1.5 * this.unit - 0.5 * lw, this.unit);
  this.cx.lineTo(0 + 0.5 * lw, 2 * this.unit - 0.5 * lw);
  this.cx.closePath();
  this.cx.stroke();

  // filled pause button
  this.cx.fillRect(2 * this.unit, 0, 0.5 * this.unit, 2 * this.unit);
  this.cx.fillRect(3 * this.unit, 0, 0.5 * this.unit, 2 * this.unit);  
};


function ScoreBoard() {
  this.score      = document.querySelector("#score");
  this.gameOver   = document.querySelector("#gameOver");
  this.score.appendChild(document.createTextNode(this.pad(0, 4)));
}
ScoreBoard.prototype.pad = function(number, length) {
  var s = '' + number;
  while (s.length < length) s = '0' + s;
  return s;
};
ScoreBoard.prototype.writeScore = function(score) {
  var nodes; // remove last round's game over text
  if (nodes = this.gameOver.childNodes)
    for (var i = 0; i < nodes.length; i++)
      this.gameOver.removeChild(nodes[i]);

  this.score.removeChild(this.score.firstChild);
  this.score.appendChild(document.createTextNode(this.pad(score, 4)));
};
ScoreBoard.prototype.writeFinalScore = function(score) {
  var highScore = parseInt(localStorage.getItem("highScore")) || 0;
  if (score > highScore) {
    localStorage.setItem("highScore", score);
    this.gameOver.appendChild(document.createTextNode(
                              "Huge Success!"));
    this.gameOver.appendChild(document.createElement("br"));
    this.gameOver.appendChild(document.createTextNode(
                              "New Best: " + this.pad(score, 4)));
  } else {
    this.gameOver.appendChild(document.createTextNode(
                              "Your Score: " + this.pad(score, 4)));
    this.gameOver.appendChild(document.createElement("br"));
    this.gameOver.appendChild(document.createTextNode(
                              "High Score: " + this.pad(highScore, 4)));
  }
};


function Game(unit, width, height) {
  this.width      = width;
  this.height     = height;
  this.world      = new World(width, height);
  this.display    = new Display(unit, width, height);
  this.buttons    = new Buttons(unit);
  this.scoreBoard = new ScoreBoard();
}
Game.prototype.onGameOver = function() {
  setTimeout(function() {
    this.display.clear();
    this.scoreBoard.writeFinalScore(this.world.getScore());
    this.buttons.drawPaused();
    this.world = new World(this.width, this.height);
  }.bind(this), 1000);
};
Game.prototype.nextFrame = function() {
  this.world.turn();
  if (!this.world.playerLost()) {
    this.display.drawFrame(this.world.getGrid());
    this.scoreBoard.writeScore(this.world.getScore());
  } else {
    renderer.stop();
    this.onGameOver();
  }
};


function Renderer(fps) {
  this.fps       = fps;
  this.requestId = 0;
  this.stopped   = true;
}
Renderer.prototype.isStopped = function() {
  return this.stopped;
};
Renderer.prototype.start = function() {
  this.stopped   = false;
  this.requestId = requestAnimationFrame(this.render.bind(this));
};
Renderer.prototype.render = function() {
  if (!this.stopped) {
    setTimeout(function() {
      this.requestId = requestAnimationFrame(this.render.bind(this));
      game.nextFrame();
    }.bind(this), 1000 / this.fps);
  }
};
Renderer.prototype.stop = function() {
  if (this.requestId) cancelAnimationFrame(this.requestId);
  this.stopped = true;
};


var game, renderer;
function main() {
  var unit = 20, width = 26, height = 20;
  game = new Game(unit, width, height);
  var fps = 8;
  renderer = new Renderer(fps);
}

main();