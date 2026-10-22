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
      if (window.soundEngine && window.soundEngine.ctx && window.soundEngine.ctx.state === 'suspended') {
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
