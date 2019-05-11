import { debounce } from 'throttle-debounce';
import { getAsset } from './assets';
import { getCurrentState } from './state';

const Constants = require('../shared/constants');

const { PLAYER_RADIUS, PLAYER_MAX_HP, BULLET_RADIUS, MAP_SIZE } = Constants;

// Get the canvas graphics context
const canvas = document.getElementById('game-canvas');
const context = canvas.getContext('2d');
setCanvasDimensions();

// Make the canvas fullscreen
function setCanvasDimensions() {
  // on small screens - we want to "zoom out" so players can see
  // at lease 800 in-game units of width
  const scaleRatio = Math.max(1, 800 / window.innerWidth);
  canvas.width = scaleRatio * window.innerWidth;
  canvas.height = scaleRatio * window.innerHeight;
}

// viewport listener to grab when user resizes screen
window.addEventListener('resize', debounce(40, setCanvasDimensions));

function render() {
  const { me, others, bullets } = getCurrentState();
  if (!me) { return; }

  // Draw background
  renderBackground(me.x, me.y);

  // Draw game boundaries
  context.strokeStyle = 'black';
  context.lineWidth = 1;
  context.strokeRect(canvas.width / 2 - me.x, canvas.height / 2 - me.y, MAP_SIZE, MAP_SIZE);

  // Draw all bullets
  bullets.forEach(renderBullet.bind(null, me));

  // Draw all players
  renderPlayer(me, me);
  others.forEach(renderPlayer.bind(null, me));

  /* +++++++++ helper functions +++++++++++ */
  function renderBackground(x, y) {
    const backgroundX = MAP_SIZE / 2 - x + canvas.width / 2;
    const backgroundY = MAP_SIZE / 2 - y + canvas.width / 2;
    const backgroundGradient = context.createRadialGradient(
      backgroundX,
      backgroundY,
      MAP_SIZE / 10,
      backgroundX,
      backgroundY,
      MAP_SIZE / 2
    );

    backgroundGradient.addColorStop(0, 'black');
    backgroundGradient.addColorStop(1, 'gray');
    context.fillStyle = backgroundGradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }

  // renders ship at given coordinates
  function renderPlayer(me, player) {
    const { x, y, direction } = player;
    const canvasX = canvas.width / 2 + - me.x;
    const canvasY = canvas.height / 2 + y - me.y;

    // draw ship
    context.save();
    context.translate(canvasX, canvasY);
    context.rotate(direction);
    context.drawImage(
      getAsset('ship.svg'),
      -PLAYER_RADIUS,
      -PLAYER_RADIUS,
      PLAYER_RADIUS * 2,
      PLAYER_RADIUS * 2,
    );
    context.restore();

    // draw ship health bar
    context.fillStyle = 'white';
    context.fillRect(
      canvasX - PLAYER_RADIUS,
      canvasY + PLAYER_RADIUS + 8,
      PLAYER_RADIUS * 2,
      2,
    );
  }

  function renderBullet(me, bullet) {
    const { x, y } = bullet;
    context.drawImage(
      getAsset('bullet.svg'),
      canvas.width / 2 + x - me.x - BULLET_RADIUS,
      canvas.height / 2 + y - me.y - BULLET_RADIUS,
      BULLET_RADIUS * 2,
      BULLET_RADIUS * 2,
    );
  }

  function renderMainMenu() {
    const t = Date.now() / 7500;
    const x = MAP_SIZE / 2 + 800 * Math.cos(t);
    const y = MAP_SIZE / 2 + 800 * Math.sin(t);
    renderBackground(x, y);
  }


  let renderInterval = setInterval(renderMainMenu, 1000 / 60);

  export function startRendering() {
    renderInterval = setInterval(render, 1000 / 60);
  }

  export function stopRendering() {
    clearInterval(renderInterval);
  }

}