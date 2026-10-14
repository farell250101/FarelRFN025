(() => {
  const fmt = s =>
    Number.isFinite(s) ? Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0') : '0:00';

  document.querySelectorAll('[data-player]').forEach(player => {
    const audio = player.querySelector('audio');
    const btn = player.querySelector('.play-btn');
    const seek = player.querySelector('.seek');
    const time = player.querySelector('.time');
    let dragging = false;

    const paint = () => {
      const pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
      if (!dragging) seek.value = pct;
      seek.style.setProperty('--p', seek.value + '%');
      time.textContent = fmt(audio.currentTime) + ' / ' + fmt(audio.duration);
    };

    btn.addEventListener('click', () => {
      if (audio.paused) audio.play().catch(() => {});
      else audio.pause();
    });

    audio.addEventListener('play', () => {
      player.classList.add('is-playing');
      btn.setAttribute('aria-label', 'Jeda');
      document.querySelectorAll('video').forEach(v => v.pause());
      document.querySelectorAll('audio').forEach(a => a !== audio && a.pause());
    });
    audio.addEventListener('pause', () => {
      player.classList.remove('is-playing');
      btn.setAttribute('aria-label', 'Putar');
    });
    audio.addEventListener('ended', () => { audio.currentTime = 0; paint(); });
    audio.addEventListener('error', () => { time.textContent = 'File lagu tidak ditemukan'; });
    ['timeupdate', 'loadedmetadata', 'durationchange'].forEach(ev => audio.addEventListener(ev, paint));

    seek.addEventListener('pointerdown', () => { dragging = true; });
    seek.addEventListener('input', () => {
      if (audio.duration) audio.currentTime = (seek.value / 100) * audio.duration;
      paint();
    });
    ['change', 'pointerup', 'pointercancel'].forEach(ev =>
      seek.addEventListener(ev, () => { dragging = false; })
    );
  });

  document.addEventListener('play', e => {
    if (e.target.tagName === 'VIDEO') document.querySelectorAll('audio').forEach(a => a.pause());
  }, true);
})();