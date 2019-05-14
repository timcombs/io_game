const Constants = require('../shared/constants');

// Returns an array of bullets to be destroyed
function applyCollisions(players, bullets) {
  const destroyedBullets = [];
  for (let i = 0; i < bullets.length; i++) {
    // look for a player to collide with each bullet they did not create
    // when we find one break out of loop to prevent double counting
    for (let j = 0; j < players.length; j++) {
      const bullet = bullets[i];
      const player = players[j];
      if (
        bullet.parentId !== player.id &&
        player.distanceTo(bullet) <= Constants.PLAYER_RADIUS + Constants.BULLET_RADIUS
      ) {
        destroyedBullets.push(bullet);
        player.takeBulletDamage();
        break;
      }
    }
  }

  return destroyedBullets;
}

module.exports = applyCollisions;