/**
 * app.js - Lógica de interfaz, reproductor musical e interacciones de romance
 */

document.addEventListener('DOMContentLoaded', () => {
  const cardToggle = document.getElementById('cardToggle');
  const noteCard = document.getElementById('noteCard');
  const btnHug = document.getElementById('btnHug');
  const hugCountLabel = document.getElementById('hugCountLabel');
  const touchHint = document.getElementById('touchHint');
  const screenVignette = document.getElementById('screenVignette');

  // Elementos del Reproductor Musical
  const musicPlayerWidget = document.getElementById('musicPlayerWidget');
  const btnTrackSelector = document.getElementById('btnTrackSelector');
  const btnPlayerPlay = document.getElementById('btnPlayerPlay');
  const btnPlayerNext = document.getElementById('btnPlayerNext');
  const playerTrackIcon = document.getElementById('playerTrackIcon');
  const playerTrackTitle = document.getElementById('playerTrackTitle');
  const trackMenuOptions = document.querySelectorAll('.menu-track-option');

  let hugsCount = 0;
  let hasInteracted = false;

  // =========================================================================
  // 1. REPRODUCTOR MUSICAL DE CANCIONES LINDAS
  // =========================================================================

  if (window.soundEngine && musicPlayerWidget) {
    // A. Play / Pause
    if (btnPlayerPlay) {
      btnPlayerPlay.addEventListener('click', (e) => {
        e.stopPropagation();
        hasInteracted = true;
        window.soundEngine.toggle();
      });
    }

    // B. Siguiente Canción
    if (btnPlayerNext) {
      btnPlayerNext.addEventListener('click', (e) => {
        e.stopPropagation();
        hasInteracted = true;
        window.soundEngine.nextTrack();
        if (!window.soundEngine.isPlaying) {
          window.soundEngine.play();
        }
      });
    }

    // C. Abrir / Cerrar Menú de Canciones
    if (btnTrackSelector) {
      btnTrackSelector.addEventListener('click', (e) => {
        e.stopPropagation();
        musicPlayerWidget.classList.toggle('menu-open');
      });
    }

    // Cerrar menú al hacer clic fuera
    document.addEventListener('click', (e) => {
      if (!musicPlayerWidget.contains(e.target)) {
        musicPlayerWidget.classList.remove('menu-open');
      }
    });

    // D. Selección directa de pista desde el menú
    trackMenuOptions.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        hasInteracted = true;
        const index = parseInt(btn.dataset.index, 10);
        window.soundEngine.selectTrack(index);
        if (!window.soundEngine.isPlaying) {
          window.soundEngine.play();
        }
        musicPlayerWidget.classList.remove('menu-open');
      });
    });

    // E. Escuchar eventos del motor de audio
    window.soundEngine.onStateChange((isPlaying) => {
      musicPlayerWidget.classList.toggle('is-playing', isPlaying);
    });

    window.soundEngine.onTrackChange((track, index) => {
      if (playerTrackIcon && track.icon) {
        playerTrackIcon.textContent = track.icon;
      }
      if (playerTrackTitle && track.title) {
        const shortName = track.title.split(' • ')[0].split(' / ')[0];
        playerTrackTitle.textContent = shortName;
      }
      trackMenuOptions.forEach((btn, idx) => {
        btn.classList.toggle('active', idx === index);
      });
    });
  }

  // =========================================================================
  // 2. EXPANDIR / COLAPSAR NOTA DEDICATORIA
  // =========================================================================

  if (cardToggle && noteCard) {
    cardToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isExpanded = noteCard.classList.toggle('expanded');

      if (touchHint) {
        touchHint.style.opacity = isExpanded ? '0' : '0.75';
      }

      // Iniciar suavemente la primera canción si no ha iniciado aún
      if (!hasInteracted && window.soundEngine) {
        window.soundEngine.play();
        hasInteracted = true;
      }
    });
  }

  // =========================================================================
  // 3. BOTÓN "DAR UN ABRAZO"
  // =========================================================================

  if (btnHug) {
    btnHug.addEventListener('click', (e) => {
      e.stopPropagation();
      hugsCount++;
      if (hugCountLabel) {
        hugCountLabel.textContent = `Abracito (${hugsCount})`;
      }

      // Sonido dulce de abrazo
      if (window.soundEngine) {
        window.soundEngine.playHug();
      }

      // Detonar ráfaga de brillo en la flor central
      if (window.flowerScene) {
        window.flowerScene.triggerBurst();
      }

      // Efecto viñeta cálida en pantalla
      if (screenVignette) {
        screenVignette.classList.add('active');
        setTimeout(() => screenVignette.classList.remove('active'), 900);
      }

      // Partículas flotantes en la posición del botón
      const rect = btnHug.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top;

      const symbols = ['💜', '🫂', '✨', '🌸', '💫', '💖'];
      for (let i = 0; i < 6; i++) {
        setTimeout(() => {
          const offsetX = (Math.random() - 0.5) * 90;
          const offsetY = (Math.random() - 0.5) * 25;
          spawnParticle(x + offsetX, y + offsetY, symbols[Math.floor(Math.random() * symbols.length)]);
        }, i * 65);
      }
    });
  }

  // =========================================================================
  // 4. DESTELLOS FLOTANTES AL TOCAR
  // =========================================================================

  document.addEventListener('click', (e) => {
    // Si no fue en controles o botones
    if (!e.target.closest('button') && !e.target.closest('.card-pill-header') && !e.target.closest('.track-menu-popover')) {
      spawnParticle(e.clientX, e.clientY, Math.random() > 0.5 ? '💜' : '✨');
    }
  });

  function spawnParticle(x, y, symbol) {
    const el = document.createElement('div');
    el.className = 'floating-particle';
    el.textContent = symbol;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    document.body.appendChild(el);

    setTimeout(() => el.remove(), 1200);
  }

  // Despertar AudioContext con primer gesto del usuario
  ['pointerdown', 'touchstart', 'click'].forEach((evt) => {
    window.addEventListener(evt, () => {
      if (window.soundEngine && !window.soundEngine.mediaActive && window.soundEngine.ctx && window.soundEngine.ctx.state === 'suspended') {
        window.soundEngine.ctx.resume();
      }
    }, { once: true });
  });

  // Si la URL contiene #expand o #nota, expandir la nota automáticamente
  if ((window.location.hash === '#expand' || window.location.hash === '#nota') && noteCard) {
    noteCard.classList.add('expanded');
    if (touchHint) touchHint.style.opacity = '0';
  }
});

// La foto y el video viven dentro de la carta; el jardín sigue siendo su fondo.
document.addEventListener('DOMContentLoaded', () => {
  const wrapper = document.querySelector('.bottom-card-wrapper');
  const note = document.getElementById('noteCard');
  const reader = document.getElementById('btnReadingMode');
  const keepsake = document.getElementById('videoKeepsake');
  const video = document.getElementById('letterVideo');
  const error = document.getElementById('videoError');
  if (!wrapper || !reader || !video || !keepsake) return;

  const clips = [...document.querySelectorAll('.letter-clip')];
  clips.forEach((button) => {
    button.addEventListener('click', () => {
      if (button.getAttribute('aria-pressed') === 'true') return;
      video.pause();
      const source = video.querySelector('source');
      source.dataset.src = button.dataset.video;
      source.src = button.dataset.video;
      video.poster = button.dataset.poster;
      video.style.aspectRatio = button.dataset.ratio;
      video.classList.toggle('is-portrait', button.dataset.portrait === 'true');
      video.setAttribute('aria-label', button.dataset.label + ', para Yadi');
      video.querySelectorAll('a').forEach((link) => { link.href = button.dataset.video; });
      error.querySelector('a').href = button.dataset.video;
      error.hidden = true;
      document.getElementById('activeClipLabel').textContent = button.dataset.label;
      clips.forEach((clip) => clip.setAttribute('aria-pressed', String(clip === button)));
      video.load();
      requestAnimationFrame(() => video.scrollIntoView({ block: 'nearest', behavior: 'auto' }));
    });
  });

  function setReadingMode(active) {
    wrapper.classList.toggle('reading-mode', active);
    reader.setAttribute('aria-pressed', String(active));
    reader.setAttribute('aria-label', active ? 'Volver al jardín' : 'Ampliar carta');
    reader.title = active ? 'Volver al jardín' : 'Leer sin prisa';
    if (active) note.classList.add('expanded');
  }
  reader.addEventListener('click', (event) => {
    event.stopPropagation();
    setReadingMode(!wrapper.classList.contains('reading-mode'));
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && wrapper.classList.contains('reading-mode')) {
      video.pause();
      setReadingMode(false);
      reader.focus();
    }
  });

  keepsake.addEventListener('toggle', () => {
    if (keepsake.open) {
      setReadingMode(true);
      const source = video.querySelector('source');
      if (!source.hasAttribute('src')) {
        source.src = source.dataset.src;
        video.load();
      }
      requestAnimationFrame(() => video.scrollIntoView({ block: 'nearest', behavior: 'auto' }));
    } else {
      video.pause();
    }
  });

  // Suspender congela la posición musical y silencia también notas pendientes.
  // Una cola serial evita carreras entre play/pause rápidos del video.
  let audioTransition = Promise.resolve();
  function syncAudio() {
    if (window.letterMusic) window.letterMusic.syncWithVideo();
    const engine = window.soundEngine;
    if (!engine) return;
    engine.mediaActive = !video.paused && !video.ended;
    audioTransition = audioTransition.catch(() => {}).then(async () => {
      if (!engine.ctx || engine.ctx.state === 'closed') return;
      if (engine.mediaActive || document.hidden) {
        if (engine.ctx.state === 'running') await engine.ctx.suspend();
      } else if (engine.ctx.state === 'suspended') {
        await engine.ctx.resume();
      }
    }).catch(() => {});
  }
  video.addEventListener('play', syncAudio);
  video.addEventListener('pause', syncAudio);
  video.addEventListener('ended', syncAudio);
  video.addEventListener('error', () => { error.hidden = false; video.pause(); syncAudio(); });
  video.querySelector('source').addEventListener('error', () => { error.hidden = false; video.pause(); syncAudio(); });
  // Otra interacción devuelve el control al jardín antes de ejecutar su audio.
  document.addEventListener('pointerdown', (event) => {
    if (!video.paused && event.target !== video && (!event.target.closest('.glass-card') || event.target.closest('button'))) video.pause();
  }, true);
  document.addEventListener('click', (event) => {
    if (!video.paused && event.target !== video && event.target.closest('button')) video.pause();
  }, true);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) video.pause();
    syncAudio();
  });
  new MutationObserver(() => {
    document.getElementById('btnToggleArrow').setAttribute('aria-expanded', String(note.classList.contains('expanded')));
    if (!note.classList.contains('expanded')) {
      if (window.letterMusic) window.letterMusic.pause();
      video.pause();
      setReadingMode(false);
    }
  }).observe(note, { attributes: true, attributeFilter: ['class'] });
});
