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

  function pause() {
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
      playerVars: { origin: location.origin, playsinline: 1, rel: 0, autoplay: 0, loop: 1, playlist: 'bRfMwoIizTQ' },
      events: {
        onReady(event) {
          ready = true;
          const iframe = event.target.getIframe();
          iframe.title = 'A Little Death — The Neighbourhood, reproductor oficial';
          iframe.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture; fullscreen');
          status.textContent = 'Toca reproducir para acompañar la lectura.';
        },
        onStateChange(event) {
          shortcut.classList.toggle('is-playing', event.data === 1);
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
            status.textContent = 'A Little Death · The Neighbourhood';
          } else if (event.data === 2) {
            status.textContent = videoActive ? 'La canción espera mientras ves el video.' : 'Toca reproducir para continuar.';
          }
        },
        onAutoplayBlocked() { status.textContent = 'Toca reproducir en YouTube para continuar la canción.'; },
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
    if (panel.open) {
      const reader = document.getElementById('btnReadingMode');
      if (reader.getAttribute('aria-pressed') !== 'true') reader.click();
      loadPlayer();
      requestAnimationFrame(() => panel.scrollIntoView({ block: 'start', behavior: 'auto' }));
    } else pause();
  });
  shortcut.addEventListener('click', () => {
    panel.open = true;
    const reader = document.getElementById('btnReadingMode');
    if (reader.getAttribute('aria-pressed') !== 'true') reader.click();
    panel.scrollIntoView({ block: 'start', behavior: 'auto' });
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
});
