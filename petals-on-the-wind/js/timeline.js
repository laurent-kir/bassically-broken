const elTimeline = document.getElementById('timeline')
const [elTime, elTrackline] = elTimeline.children;
const elInput = elTrackline.firstElementChild;
const [curTime, endTime] = [...elTime.children].map(el => el.firstChild);

const leadingZero = (n) => n > 9 ? n : `0${n}`;
const setCSS = elTrackline.style.setProperty.bind(elTrackline.style);

export default {
  __init__,
  format,
  updateCurrentTime,
  updateDuration,
  progress,
  bufferize
};

function __init__(player) {
  const self = this;

  elInput.addEventListener('change', function(e) {
    const val = +this.value;
    updateCurrentTime(val);
    fillTrack(val, this.max);
    player.currentTrack.currentTime = val;
    self.seeking = false;
  });

  elInput.addEventListener('input', function(e) {
    const val = +this.value;
    self.seeking = true;
    updateCurrentTime(val);
    fillTrack(val, this.max);
  });
}

function progress(val) {
  elInput.value = val;
  updateCurrentTime(val);
  fillTrack(val, elInput.max);
}

function updateCurrentTime(val) {
  curTime.data = format(val);
}

function updateDuration(val) {
  elInput.max = val >> 0;
  endTime.data = format(val);
}

function format(val) {
  const min = (val / 60 >> 0) % 60;
  const sec = ~~val % 60;
  return `${leadingZero(min)}:${leadingZero(sec)}`;
}

function fillTrack(val, max) {
  const x = Math.min(100, val / max * 100);
  setCSS('--fill', `${+x.toFixed(5)}%`);
}

function bufferize(val, max) {
  const x = Math.min(100, val / max * 100);
  setCSS('--buffer', `${+x.toFixed(5)}%`);
}