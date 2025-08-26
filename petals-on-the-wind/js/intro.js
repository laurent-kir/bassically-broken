export default function initialize(callback) {
  const target = document.getElementById('intro');
  const elIntroDescr = target.lastElementChild;
  const diveTrigger = elIntroDescr.previousElementSibling;
  const [trigger, elDescrText] = elIntroDescr.children;

  const elDescr = document.getElementById('descr');
  elDescr.append(elDescrText.cloneNode(true));

  diveTrigger.addEventListener('click', function handler(e) {
    this.removeEventListener(e.type, handler);
    elIntroDescr.classList.add('intro__descr--shown');
  });

  trigger.addEventListener('click', async function handler(e) {
    this.removeEventListener(e.type, handler);
    this.classList.add('intro__trigger--pending');

    const noop = Function.prototype;
    const tracks = await loadTracks('tracks.json').catch(noop);
    const lyrics = await loadLyrics('lyrics.html', tracks).catch(noop);

    if (!(tracks && lyrics)) {
      this.addEventListener(e.type, handler);
      this.classList.remove('intro__trigger--pending');
      return alert('Something went wrong. Try again.');
    }

    callback({ tracks, lyrics });

    setHideHandler();
    target.classList.add('intro--hidden');
  });

  function setHideHandler() {
    target.addEventListener('transitionend', function handler(e) {
      this.removeEventListener(e.type, handler);
      this.remove();
    });
  }
}

async function loadTracks(url) {
  const res = await fetch(url);
  return res.json();
}

async function loadLyrics(url, tracks) {
  const text = await fetch(url).then(res => res.text());
  const chunks = text.replaceAll('\r', '').split('\n\n— — —\n\n');
  return Object.fromEntries(tracks.map((track, i) => [track.id, chunks[i]]));
}