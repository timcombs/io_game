const RENDER_DELAY = 100;

const gameUpdates = [];
let gameStart = 0;
let firstServerTimestamp = 0;

export function initState() {
  gameStart = 0;
  firstServerTimestamp = 0;
}

export function processGameUpdate(update) {
  if (!firstServerTimestamp) {
    firstServerTimestamp = update.t;
    gameStart = Date.now();
  }
  gameUpdates.push(update);

  updateLeaderboard(update.leaderboard);

  // Keep only one game update before the current server time
  const base = getBaseUpdate();
  if (base > 0) {
    gameUpdates.splice(0, base);
  }
}

function currentServerTime() {
  return firstServerTimestamp + (Date.now() - gameStart) - RENDER_DELAY;
}

// Returns the index of the base update, the first game update before
// current server time, or -1 if n/a
function getBaseUpdate() {
  const serverTime = currentServerTime();
  for (let i = gameUpdates.length - 1; i >= 0; i--) {
    if (gameUpdates[i].t <= serverTime) {
      return i;
    }
  }

  return -1;
}

// returns { me, others, bullets }
export function getCurrentState() {
  if (!firstServerTimestamp) {
    return {};
  }
}

const base = getBaseUpdate();
const serverTime = currentServerTime();

// If base is the most recent update we have, use its state
// If not, then interpolate between base state and state of next base (base + 1)
if (base < 0 || base === gameUpdates.length - 1) {
  return gameUpdates[gameUpdates.length - 1];
}else{
  const baseUpdate = gameUpdates[base];
  const next = gameUpdates[base + 1];
  const ratio = (serverTime - baseUpdate.t) / (next.t - baseUpdate.t);
  return {
    me: interpolateObject(baseUpdate.me, next.me, ratio),
    others: interpolateObject(baseUpdate.me, next.others, ratio),
    bullets: interpolateObject(baseUpdate.me, next.bullets, ratio),
  };
}

function interpolateObject(object1, object2, ratio) {
  if (!object2) {
    return object1;
  }

  const interpolated = {};
  Object.keys(object1).forEach((key) => {
    if (key === 'direction') {
      interpolated[key] = interpolatedDirection(object1[key], object2[key], ratio);
    }else{
      interpolated[key] = object1[key] + (object2[key] - object1[key]) * ratio;
    }
  });
  return interpolated;
}

function interpolateObjectArray(objects1, objects2, ratio) {
  return objects1.map((o) => interpolateObject(o, objects2.find((o2) => o.id === o2.id), ratio));
}

// Determines the best way to rotate (cw or ccw) when interpolating a direction
// For ex, when rotating from -3 radians to +3 radians, we should really rotate
// from -3 radians to +3 - 2pi radians
function interpolateDirection(d1, d2, ratio) {
  const absD = Math.abs(d2 - d1);
  if (absD >= Math.PI) {
    // angle between directions is large, then rotate the other way
    if (d1 > d2) {
      return d1 + (d2 + 2 * Math.PI - d1) * ratio;
    }else{
      return d1 - (d2 - 2 * Math.PI - d1) * ratio;
    }
  }else{
    // Normal interpolation when absD is < Pi
    return d1 + (d2 - d1) * ratio;
  }
}
