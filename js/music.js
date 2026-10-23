// Reproductor oficial: no se copia ni se descarga la canción.
document.addEventListener('DOMContentLoaded', () => {
  const panel = document.getElementById('letterSong');
  const status = document.getElementById('songStatus');
  const shortcut = document.getElementById('songShortcut');
  const video = document.getElementById('letterVideo');
  if (!panel || !shortcut) return;
  let player;
  let ready = false;
  let loading = false;
  let videoActive = false;
  let resumeAfterVideo = false;
  let autoPending = true;
  let initialOpen = true;

  function pause() {
    autoPending = false;
    resumeAfterVideo = false;
    if (ready) player.pauseVideo();
  }
  window.letterMusic = {
    pause,
    syncWithVideo() {
      const active = !video.paused && !video.ended;
      if (active && !videoActive) {
        resumeAfterVideo = ready && [1, 3].includes(player.getPlayerState());
        videoActive = true;
        if (ready) player.pauseVideo();
      } else if (!active && videoActive) {
        videoActive = false;
        const resume = resumeAfterVideo && !document.hidden && panel.open;
        resumeAfterVideo = false;
        if (resume && ready) player.playVideo();
      }
    }
  };

  function createPlayer() {
    if (player) return;
    player = new YT.Player('officialSongPlayer', {
      host: 'https://www.youtube-nocookie.com',
      width: '100%', height: '240', videoId: 'bRfMwoIizTQ',
      playerVars: { origin: location.origin, playsinline: 1, rel: 0, controls: 0, autoplay: 1, loop: 1, playlist: 'bRfMwoIizTQ' },
      events: {
        onReady(event) {
          ready = true;
          const iframe = event.target.getIframe();
          iframe.title = 'A Little Death — The Neighbourhood, reproductor oficial';
          iframe.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture; fullscreen');
          status.textContent = 'Preparando la canción para acompañar la lectura…';
          if (autoPending && panel.open && !document.hidden && video.paused) event.target.playVideo();
        },
        onStateChange(event) {
          shortcut.classList.toggle('is-playing', event.data === 1);
          shortcut.setAttribute('aria-pressed', String(event.data === 1));
          shortcut.setAttribute('aria-label', (event.data === 1 ? 'Pausar' : 'Escuchar') + ' A Little Death de The Neighbourhood');
          if (event.data === 1) {
            // Un evento de carga tardío no debe interrumpir un clip personal.
            if (videoActive || (!video.paused && !video.ended)) {
              player.pauseVideo();
              return;
            }
            if (document.hidden || !panel.open || !document.getElementById('noteCard').classList.contains('expanded')) {
              pause();
              return;
            }
            resumeAfterVideo = false;
            autoPending = false;
            shortcut.classList.remove('needs-touch');
            shortcut.querySelector('small').textContent = 'The Neighbourhood';
            status.textContent = 'A Little Death · The Neighbourhood';
          } else if (event.data === 2) {
            status.textContent = videoActive ? 'La canción espera mientras ves el video.' : 'Toca reproducir para continuar.';
          }
        },
        onAutoplayBlocked() {
          status.textContent = 'Toca la carta o el botón de música para activar el sonido.';
          shortcut.classList.add('needs-touch');
          shortcut.querySelector('small').textContent = 'Toca para activar música';
        },
        onError(event) {
          status.dataset.playerError = String(event.data);
          panel.classList.add('song-unavailable');
          event.target.getIframe().style.display = 'none';
          status.textContent = event.data === 101 || event.data === 150
            ? 'YouTube no permite escuchar esta canción dentro de la carta. Puedes abrirla aquí.'
            : 'YouTube no pudo reproducirla aquí. Puedes abrirla con este enlace.';
        }
      }
    });
  }
  function loadPlayer() {
    if (loading) return;
    loading = true;
    if (window.YT && window.YT.Player) { createPlayer(); return; }
    window.onYouTubeIframeAPIReady = createPlayer;
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.onerror = () => { status.textContent = 'No se pudo conectar con YouTube. Puedes usar el enlace de abajo.'; };
    document.head.appendChild(script);
  }
  panel.addEventListener('toggle', () => {
    if (initialOpen) { initialOpen = false; return; }
    if (panel.open) {
      autoPending = true;
      const reader = document.getElementById('btnReadingMode');
      if (reader.getAttribute('aria-pressed') !== 'true') reader.click();
      loadPlayer();
      if (ready && video.paused && !document.hidden) player.playVideo();
      requestAnimationFrame(() => panel.scrollIntoView({ block: 'start', behavior: 'auto' }));
    } else pause();
  });
  shortcut.addEventListener('click', () => {
    if (ready && player.getPlayerState() === 1) { pause(); return; }
    autoPending = true;
    panel.open = true;
    if (!video.paused) video.pause();
    if (ready && video.paused && !document.hidden) player.playVideo();
  });
  // Si el navegador bloquea el inicio con sonido, usar el primer gesto real.
  function startOnGesture(event) {
    if (!autoPending || !ready || !panel.open || document.hidden || !video.paused) return;
    if (event.target.closest('video, .letter-clip, #videoKeepsake, #cardToggle, #letterSong summary')) return;
    player.playVideo();
  }
  document.addEventListener('pointerdown', startOnGesture);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') startOnGesture(event);
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  panel.open = true;
  loadPlayer();
});
