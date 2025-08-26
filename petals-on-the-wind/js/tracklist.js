const CLASS_TRACKS_SHOWN = 'tracks--shown';
const CLASS_TRACK_ACTIVE = 'track--active';

const elTracks = document.getElementById('tracks');
const elTracklist = elTracks.lastElementChild;
const switcherBtn = elTracks.previousElementSibling;

const stack = new Map;
const setActive = (el, test) => el.classList.toggle(CLASS_TRACK_ACTIVE, test);

export default { toggle, playpause, setActiveTrack };

function playpause(player, elem) {
  const { id } = elem.dataset;
  if (stack.get(id) !== elem) return;
  player.switchTrack(id);
}

function toggle(player, tracks) {
  const test = switcherBtn.classList.toggle('tracklist-switcher--active');
  if (!elTracks.classList.toggle(CLASS_TRACKS_SHOWN, test)) return;
  if (!stack.size) initTracklist(player, tracks);
  setActiveTrack(player.currentTrackId);
}

function initTracklist(player, tracks) {
  const dur = 400;
  const delay = 40;
  const { format } = player.timeline;
  const template = document.getElementById('template-track');
  const tempTrack = template.content.firstElementChild;

  const cssRules = tracks.map((x, i) => {
    const ind = i + 1;
    const ms = delay * ind;
    return `.track:nth-child(${ind}) {animation-delay: ${ms}ms;}`;
  });

  cssRules.unshift(`.track {animation: initTrack ${dur}ms backwards;}`);

  const style = document.createElement('style');
  style.textContent = cssRules.join('');
  document.head.appendChild(style);

  tracks.forEach(({ id, name, duration }) => {
    const elem = tempTrack.cloneNode(true);
    const elName = elem.querySelector('.track__name');
    const elDuration = elem.querySelector('.track__duration');
    elem.dataset.id = id;
    elName.textContent = name;
    elDuration.textContent = format(duration);
    stack.set(id, elem);
  });

  elTracklist.append(...stack.values());
  elTracklist.addEventListener('keyup', listenKeyboard.bind(player));
  setTimeout(style.remove.bind(style), tracks.length * delay + dur);
}

function listenKeyboard(e) {
  if (e.key !== 'Enter' || !e.target.matches('.track')) return;
  e.preventDefault();
  playpause(this, e.target);
}

function setActiveTrack(trackId) {
  if (!stack.size) return;
  if (!elTracks.classList.contains(CLASS_TRACKS_SHOWN)) return;

  const elNextTrack = stack.get(trackId);
  const elCurTrack = elTracklist.querySelector(`.${CLASS_TRACK_ACTIVE}`);

  if (elNextTrack === elCurTrack) return;
  if (elCurTrack) setActive(elCurTrack, 0);
  if (elNextTrack) setActive(elNextTrack, 1);
}