import player from './js/player.js';
import initFirstScreen from './js/intro.js';

const initStatusbarTimer = (function(target) {
  const format = (n) => n > 9 ? n : `0${n}`;

  return function tick() {
    const date = new Date;
    const h = format(date.getHours());
    const m = format(date.getMinutes());
    const delay = (60 - date.getSeconds()) * 1e3;
    target.data = `${h}:${m}`;
    return setTimeout(tick, delay);
  }
})(document.getElementById('time').firstChild);

initStatusbarTimer();
initFirstScreen(player.__init__.bind(player));