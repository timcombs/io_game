const Constants = require('../shared/constants');
const Player = require('./player');
const applyCollisions = require('./collisions');

class Game {
  constructor() {
    this.sockets = {};
    this.players = {};
    this.bullets = [];
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

    // update each player
    Object.keys(this.sockets).forEach((playerID) => {
      const player = this.players[playerID];
      const newBullet = player.update(dt);
      if (newBullet) {
        this.bullets.push(newBullet);
      }
    });

    // apply collisions, give players score for hitting bullets
    const destroyedBullets = applyCollisions(Object.values(this.players), this.bullets);
    destroyedBullets.forEach((b) => {
      if (this.players[b.parentID]) {
        this.players[b.parentID].onDealtDamage();
      }
    });
    this.bullets = this.bullets.filter((bullet) => {
      return !destroyedBullets.includes(bullet);
    });

    // check for dead players
    Object.keys(this.sockets).forEach((playerID) => {
      const socket = this.sockets[playerID];
      const player = this.players[playerID];

      if (player.hp <= 0) {
        socket.emit(Constants.MSG_TYPES.GAME_OVER);
        this.removePlayer(socket);
      }
    });

    // send game update to each player every other time
    if (this.shouldSendUpdate) {
      const leaderboard = this.getLeaderboard();
      Object.keys(this.sockets).forEach((playerID) => {
        const socket = this.sockets[playerID];
        const player = this.players[playerID];
        socket.emit(Constants.MSG_TYPES.GAME_UPDATE, this.createUpdate(player, leaderboard));
      });
      this.shouldSendUpdate = false;
    }else{
      this.shouldSendUpdate = true;
    }
  }

  getLeaderboard() {
    return Object.values(this.players)
      .sort((p1, p2) => p2.score - p1.score)
      .slice(0, 5)
      .map((p) => ({ username: p.username, score: Math.round(p.score) }));
  }

  createUpdate(player, leaderboard) {
    const nearbyPlayers = Object.values(this.players)
      .filter((p) => p !== player &&
                     p.distanceTo(player) <= Constants.MAP_SIZE / 2);
    const nearbyBullets = this.bullets
      .filter((b) => b.distanceTo(player) <= Constants.MAP_SIZE / 2);

    return {
      t: Date.now(),
      me: player.serializeForUpdate(),
      others: nearbyPlayers.map((p) => p.serializeForUpdate()),
      bullets: nearbyBullets.map((p) => p.serializeForUpdate()),
      leaderboard,
    };
  }
}

module.exports = Game;
