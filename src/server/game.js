const Constants = require('../shared/constants');
const Player = require('./player');
const applyCollisions = require('./collisions');

class Game {
  constructor() {
    this.sockets = {};
    this.players = {};
    this.bullets = {};
    this.lastUpdateTime = Date.now();
    this.shouldSendUpdate = false;
    setInterval(this.update.bind(this), 1000 / 60);
  }

  addPlayer(socket, username) {
    this.sockets[socket.id] = socket;

    // generate initial position for this player
    const x = Constants.MAP_SIZE * (0.25 + Math.random() * 0.5);
    const y = Constants.MAP_SIZE * (0.25 + Math.random() * 0.5);
    this.players[socket.id] = new Player(socket.id, username, x, y);
  }

  removePlayer(socket) {
    delete this.sockets[socket.id];
    delete this.players[socket.id];
  }

  handleInput(socket, dir) {
    if (this.players[socket.id]) {
      this.players[socket.id].setDirection(dir);
    }
  }

  update() {
    // calculate time elapsed
    const now = Date.now();
    const dt = (now - this.lastUpdateTime) / 1000;
    this.lastUpdateTime = now;

    // update each bullet
    const bulletsToRemove = [];
    this.bullets.forEach((bullet) => {
      if (bullet.update(dt)) {
        // destroy this bullet!!!
        bulletsToRemove.push(bullet);
      }
    });
    this.bullets = this.bullets.filter((bullet) => {
      return !bulletsToRemove.includes(bullet);
    });
  }


}