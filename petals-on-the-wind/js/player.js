import timeline from './timeline.js';
import tracklist from './tracklist.js';

const elPlayer = document.getElementById('player');
const elDescr = document.getElementById('descr');

const elControls = document.getElementById('controls');
const controls = Object.fromEntries([...elControls.children].map(el => {
  return [el.dataset.action, el];
}));

const elLyrics = document.getElementById('lyrics');
const elLyricsText = elLyrics.lastElementChild;

const elInfo = document.getElementById('info');
const nodeInfoName = elInfo.firstElementChild.firstChild;

let currentTrack;
const imports = {};
const allTracks = new Map;

export default {
  __init__,
  playpause,
  switchTrack,
  toggleLike,
  toggleLyrics,
  rewindBackward,
  rewindForward,
  nextTrack: setNextPrev.bind(null, 1),
  prevTrack: setNextPrev.bind(null, -1),
  get currentTrackId() { return currentTrack._trackId },
  get currentTrack() { return currentTrack },
  get timeline() { return timeline },
  get tracklist() { return tracklist },
};

function __init__({ tracks, lyrics }) {
  delete this.__init__;
  Object.assign(imports, { tracks, lyrics });
  timeline.__init__(this);
  elPlayer.addEventListener('click', globalHandler.bind(this));
  switchTrack(tracks[0].id, false);
}

function globalHandler(e) {
  const { action } = e.target.dataset;

  if (!action) return;

  switch (action) {
    case 'toggleDescr': return elDescr.classList.toggle('layer--shown');
    case 'toggleTracklist': return tracklist.toggle(this, imports.tracks);
    case 'track::playpause': return tracklist.playpause(this, e.target);
    default: return this[action]();
  }
}

function toggleLyrics() {
  const shown = elLyrics.classList.toggle('layer--shown');
  controls.toggleLyrics.classList.toggle('controls__item--active', shown);
}

function setCurrentLyrics(track) {
  elLyricsText.scrollTop = 0;
  elLyricsText.innerHTML = [
    imports.lyrics[track._trackId],
    '\n\n<em>Music by <strong>suno.com</strong></em>',
    '\n<em>Lyrics by <strong>Leonid Marinin</strong></em>'
  ].join('');
}

function playpause() {
  if (currentTrack.paused) return currentTrack.play();
  return currentTrack.pause();
}

function rewindBackward() {
  const time = currentTrack.currentTime;
  currentTrack.currentTime = Math.max(0, time - 10);
  currentTrack.ontimeupdate();
}

function rewindForward() {
  const time = currentTrack.currentTime;
  const duration = currentTrack.duration;
  currentTrack.currentTime = Math.min(duration, time + 10);
  currentTrack.ontimeupdate();
}

function setNextPrev(step) {
  const { tracks } = imports;
  const track = tracks[step + tracks.indexOf(currentTrack._meta)];
  if (track) switchTrack(track.id);
}

async function switchTrack(id, autoplay = true) {
  const track = allTracks.get(id) || createNewTrack(id);

  if (!track) return;
  if (track === currentTrack) return playpause();

  if (!track._hasMetadata) await waitForMetadata(track);

  if (currentTrack && !currentTrack.paused) currentTrack.pause();

  const { tracks } = imports;
  const i = tracks.indexOf(track._meta);

  currentTrack = track;
  track.currentTime = 0;
  timeline.seeking = false;
  timeline.updateDuration(track.duration);
  timeline.progress(0);

  nodeInfoName.data = track._meta.name;

  controls.prevTrack.disabled = i === 0;
  controls.nextTrack.disabled = i === tracks.length - 1;

  setCurrentLike(track);
  setCurrentLyrics(track);

  if (autoplay) track.play();
}

function waitForMetadata(track) {
  return new Promise(resolve => {
    track.onloadedmetadata = function(e) {
      this.onloadedmetadata = null;
      this._hasMetadata = true;
      resolve();
    }
  });
}

// ========== [[ LIKES ]]

const likesCache = (function() {
  let state;
  const key = 'BBroken__likes';

  try {
    state = JSON.parse(localStorage.getItem(key) || '[]');
    if (!Array.isArray(state)) state = [];
  } catch (e) {
    state = [];
  }

  const cache = new Set(state);
  const toJSON = () => JSON.stringify([...cache]);
  cache.updateStorage = () => localStorage.setItem(key, toJSON());
  return cache;
})();

function toggleLike() {
  const id = currentTrack._trackId;
  if (likesCache.has(id)) likesCache.delete(id);
  else likesCache.add(id);
  likesCache.updateStorage();
  setCurrentLike(currentTrack);
}

function setCurrentLike(track) {
  const icon = likesCache.has(track._trackId) ? 'liked' : 'like';
  setSvgUse('toggleLike', icon);
}

function setSvgUse(controlName, icon) {
  const svgUse = controls[controlName].querySelector('use');
  svgUse.setAttribute('href', `icons.svg#i-${icon}`);
}

// ===============

function createNewTrack(id) {
  const that = imports.tracks.find(track => track.id === id);

  if (!that) return;

  const track = allTracks.set(id, new Audio(that.src)).get(id);
  track.volume = 0.8;
  track._trackId = id;
  track._meta = that;

  initTrackHandlers(track);
  return track;
}

function initTrackHandlers(track) {
  track.onplay = onPlayStateChange;
  track.onpause = onPlayStateChange;
  track.ontimeupdate = onTimeUpdate;
  track.onprogress = onProgress;
  track.onended = onTrackEnd;
}

function onPlayStateChange() {
  const playing = elPlayer.classList.toggle('player--playing', !this.paused);
  setSvgUse('playpause', playing ? 'pause' : 'play');

  if (!playing) return;

  nodeInfoName.data = this._meta.name;
  timeline.updateDuration(this.duration);
  timeline.progress(this.currentTime);
  tracklist.setActiveTrack(this._trackId);
}

function onTimeUpdate() {
  if (this.seeking || timeline.seeking) return;
  timeline.progress(this.currentTime);
}

function onTrackEnd() {
  setNextPrev(1);
}

function onProgress() {
  if (this.seeking || timeline.seeking) return;

  const { duration } =  this;
  if (!duration) return;

  const { currentTime, buffered } = this;
  let i = buffered.length;

  while (i--) {
    if (buffered.start(i) >= currentTime) continue;
    return timeline.bufferize(buffered.end(i), duration);
  }
}