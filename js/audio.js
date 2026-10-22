/**
 * audio.js - Motor de Audio Web Audio API: 'Canciones Lindas' (Music Player Romantico)
 * Sintetizador polifonico autonomo con 3 canciones romanticas completas seleccionables:
 * 1. 'Golden Hour / Atardecer Morado' (arpegios suaves y emotivos estilo piano romantico)
 * 2. 'Cajita de Recuerdos' (celesta / campanas dulces estilo caja de musica)
 * 3. 'Brisa de Medianoche' (acordes etereos y calidos)
 *
 * Incluye controles de play, pause, pista siguiente, selector de pista y retrocompatibilidad total.
 */

(function(root) {
  const noteMap = {
    'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4,
    'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9,
    'A#': 10, 'Bb': 10, 'B': 11
  };

  function noteToFreq(noteStr) {
    if (typeof noteStr === 'number') return noteStr;
    const m = String(noteStr).trim().match(/^([A-G][#b]?)(-?\d+)$/);
    if (!m) return 440;
    const name = m[1];
    const oct = parseInt(m[2], 10);
    const semitone = noteMap[name];
    const midi = (oct + 1) * 12 + semitone;
    return +(440 * Math.pow(2, (midi - 69) / 12)).toFixed(2);
  }

  // --- Composicion de Canciones Romanticas Completas ---

  function buildGoldenHour() {
    const bpm = 76;
    const beat = 60 / bpm; // ~0.7895s
    const s16 = beat / 4;  // ~0.1974s
    const events = [];

    // Progresion de piano romantico: Gmaj7 -> D/F# -> Em9 -> Cmaj9 -> Gmaj9 -> D/F# -> Em11 -> Cmaj7
    const measures = [
      // 1. Gmaj7
      {
        bass: 'G2',
        arp: ['G3', 'B3', 'D4', 'F#4', 'G4', 'D4', 'B3', 'D4'],
        mel: [['D5', 0, 1.8], ['E5', 2, 0.9], ['D5', 3, 0.9]]
      },
      // 2. D/F#
      {
        bass: 'F#2',
        arp: ['F#3', 'A3', 'D4', 'F#4', 'A4', 'F#4', 'D4', 'A3'],
        mel: [['F#5', 0, 1.8], ['G5', 2, 0.9], ['F#5', 3, 0.9]]
      },
      // 3. Em9
      {
        bass: 'E2',
        arp: ['E3', 'G3', 'B3', 'D4', 'E4', 'G4', 'B4', 'G4'],
        mel: [['G5', 0, 1.8], ['A5', 2, 0.9], ['G5', 3, 0.9]]
      },
      // 4. Cmaj9
      {
        bass: 'C2',
        arp: ['C3', 'E3', 'G3', 'B3', 'C4', 'E4', 'G4', 'E4'],
        mel: [['E5', 0, 1.4], ['D5', 1.5, 0.8], ['C5', 2.5, 0.7], ['B4', 3.2, 0.8]]
      },
      // 5. Gmaj9 (Climax romantico)
      {
        bass: 'G2',
        arp: ['G3', 'D4', 'G4', 'B4', 'D5', 'B4', 'G4', 'D4'],
        mel: [['B5', 0, 1.8], ['A5', 2, 0.9], ['G5', 3, 0.9]]
      },
      // 6. D/F#
      {
        bass: 'F#2',
        arp: ['F#3', 'D4', 'F#4', 'A4', 'D5', 'A4', 'F#4', 'D4'],
        mel: [['A5', 0, 1.8], ['G5', 2, 0.9], ['F#5', 3, 0.9]]
      },
      // 7. Em11
      {
        bass: 'E2',
        arp: ['E3', 'B3', 'E4', 'G4', 'B4', 'G4', 'E4', 'B3'],
        mel: [['G5', 0, 1.4], ['F#5', 1.5, 0.8], ['E5', 2.3, 0.8], ['D5', 3.1, 0.8]]
      },
      // 8. Cmaj7(add9) resolucion tierna
      {
        bass: 'C2',
        arp: ['C3', 'G3', 'C4', 'E4', 'G4', 'B4', 'C5', 'E5'],
        mel: [['E5', 0, 1.2], ['G5', 1.5, 1.0], ['B5', 2.5, 1.2], ['A5', 3.5, 0.8]]
      }
    ];

    let timeOffset = 0;
    measures.forEach(m => {
      // Bajo acustico calido
      events.push({ time: timeOffset, freq: noteToFreq(m.bass), dur: beat * 3.6, vel: 0.72, type: 'piano_bass', pan: -0.25 });

      // Arpegio continuo en semicorcheas (2 ciclos de 8 notas)
      for (let cycle = 0; cycle < 2; cycle++) {
        m.arp.forEach((note, idx) => {
          const t = timeOffset + (cycle * 8 + idx) * s16;
          const dyn = 0.38 + (idx % 2 === 0 ? 0.08 : 0);
          events.push({ time: t, freq: noteToFreq(note), dur: s16 * 1.9, vel: dyn, type: 'piano_arp', pan: 0.05 });
        });
      }

      // Melodia expresiva
      m.mel.forEach(([note, beatStart, durBeats]) => {
        events.push({
          time: timeOffset + beatStart * beat,
          freq: noteToFreq(note),
          dur: durBeats * beat,
          vel: 0.88,
          type: 'piano_lead',
          pan: 0.20
        });
      });

      timeOffset += 4 * beat;
    });

    return {
      id: 'golden-hour',
      title: 'Golden Hour / Atardecer Morado',
      subtitle: 'Arpegios suaves y emotivos estilo piano romantico',
      icon: '💜',
      duration: timeOffset,
      events
    };
  }

  function buildCajitaRecuerdos() {
    const bpm = 106;
    const beat = 60 / bpm; // ~0.566s por tiempo en 3/4
    const events = [];

    // Vals nostálgico estilo caja de música antigua
    const measures = [
      // Parte A
      { bass: 'C4', chord: ['E5', 'G5'], mel: [['G5', 0, 1], ['C6', 1, 1], ['E6', 2, 1]] },
      { bass: 'B3', chord: ['E5', 'G5'], mel: [['D6', 0, 1.5], ['B5', 1.5, 0.75], ['G5', 2.25, 0.75]] },
      { bass: 'A3', chord: ['C5', 'E5'], mel: [['C6', 0, 1], ['E6', 1, 1], ['A6', 2, 1]] },
      { bass: 'G3', chord: ['B4', 'E5'], mel: [['G6', 0, 1.5], ['E6', 1.5, 0.75], ['B5', 2.25, 0.75]] },
      { bass: 'F3', chord: ['A4', 'C5'], mel: [['A5', 0, 1], ['C6', 1, 1], ['F6', 2, 1]] },
      { bass: 'E3', chord: ['G4', 'C5'], mel: [['E6', 0, 1], ['D6', 1, 1], ['C6', 2, 1]] },
      { bass: 'D3', chord: ['F4', 'A4'], mel: [['D6', 0, 1], ['F6', 1, 1], ['E6', 2, 1]] },
      { bass: 'G3', chord: ['F4', 'B4'], mel: [['D6', 0, 1.5], ['B5', 1.5, 0.75], ['G5', 2.25, 0.75]] },
      // Parte B (destellos cristalinos agudos)
      { bass: 'F3', chord: ['A4', 'C5'], mel: [['F6', 0, 1], ['A6', 1, 1], ['G6', 2, 1]] },
      { bass: 'G3', chord: ['B4', 'D5'], mel: [['E6', 0, 1], ['D6', 1, 1], ['C6', 2, 1]] },
      { bass: 'E3', chord: ['G4', 'B4'], mel: [['G6', 0, 1], ['E6', 1, 1], ['B5', 2, 1]] },
      { bass: 'A3', chord: ['C5', 'E5'], mel: [['C6', 0, 1], ['B5', 1, 1], ['A5', 2, 1]] },
      { bass: 'D3', chord: ['F4', 'A4'], mel: [['F6', 0, 1], ['E6', 1, 1], ['D6', 2, 1]] },
      { bass: 'G3', chord: ['F4', 'B4'], mel: [['B5', 0, 1], ['C6', 1, 1], ['D6', 2, 1]] },
      { bass: 'C4', chord: ['E5', 'G5'], mel: [['E6', 0, 0.75], ['G6', 0.75, 0.75], ['C7', 1.5, 1.5]] },
      { bass: 'C3', chord: ['E4', 'G4', 'C5'], mel: [['C6', 0, 3]] }
    ];

    let timeOffset = 0;
    measures.forEach(m => {
      // Tiempo 1: Clavija baja
      events.push({ time: timeOffset, freq: noteToFreq(m.bass), dur: beat * 2.5, vel: 0.65, type: 'box_bass', pan: -0.15 });

      // Tiempos 2 y 3: Campana de acompañamiento
      m.chord.forEach(note => {
        events.push({ time: timeOffset + beat, freq: noteToFreq(note), dur: beat * 1.5, vel: 0.38, type: 'box_chime', pan: 0.15 });
        events.push({ time: timeOffset + 2 * beat, freq: noteToFreq(note), dur: beat * 1.5, vel: 0.36, type: 'box_chime', pan: 0.15 });
      });

      // Melodía principal con sutil humanización de cuerda de reloj
      m.mel.forEach(([note, beatStart, durBeats]) => {
        const wobble = (Math.random() - 0.5) * 0.012;
        events.push({
          time: timeOffset + beatStart * beat + wobble,
          freq: noteToFreq(note),
          dur: durBeats * beat * 1.4,
          vel: 0.86,
          type: 'box_melody',
          pan: 0.10
        });
      });

      timeOffset += 3 * beat;
    });

    return {
      id: 'cajita-recuerdos',
      title: 'Cajita de Recuerdos',
      subtitle: 'Celesta / campanas dulces estilo caja de musica',
      icon: '✨',
      duration: timeOffset,
      events
    };
  }

  function buildBrisaMedianoche() {
    const events = [];

    // Progresión de ensueño nocturno: Dmaj9 -> Bm11 -> Gmaj7#11 -> Asus4(add9) -> F#m7(11) -> Gmaj9 -> Em9 -> Dmaj7(add9)
    const phases = [
      { chord: ['D2', 'F#3', 'A3', 'C#4', 'E4'], dur: 5.8, sparkles: [['A5', 1.6, 2.5], ['C#6', 3.0, 2.5], ['E6', 4.2, 2.8]] },
      { chord: ['B1', 'F#3', 'A3', 'D4', 'E4'], dur: 5.8, sparkles: [['F#5', 1.5, 2.5], ['A5', 2.8, 2.5], ['D6', 4.1, 2.8]] },
      { chord: ['G1', 'G3', 'B3', 'D4', 'F#4', 'C#5'], dur: 5.8, sparkles: [['D6', 1.6, 2.5], ['F#6', 3.0, 2.5], ['B6', 4.3, 2.8]] },
      { chord: ['A1', 'E3', 'A3', 'B3', 'C#4', 'E4'], dur: 5.8, sparkles: [['E6', 1.5, 2.5], ['A6', 2.9, 2.5], ['C#7', 4.2, 3.0]] },
      { chord: ['F#1', 'F#3', 'A3', 'B3', 'C#4', 'E4'], dur: 5.8, sparkles: [['C#6', 1.6, 2.5], ['E6', 3.0, 2.5], ['F#6', 4.2, 2.8]] },
      { chord: ['G1', 'G3', 'B3', 'D4', 'F#4', 'A4'], dur: 5.8, sparkles: [['A5', 1.5, 2.5], ['B5', 2.8, 2.5], ['D6', 4.0, 2.8]] },
      { chord: ['E1', 'E3', 'G3', 'B3', 'D4', 'F#4'], dur: 5.8, sparkles: [['G5', 1.6, 2.5], ['B5', 3.0, 2.5], ['F#6', 4.2, 3.0]] },
      { chord: ['D2', 'D3', 'F#3', 'A3', 'C#4', 'E4'], dur: 7.0, sparkles: [['F#6', 1.8, 3.0], ['A6', 3.6, 3.5], ['D6', 5.0, 3.8]] }
    ];

    let timeOffset = 0;
    phases.forEach(p => {
      // Acorde cálido de pad etéreo con respiración lenta
      p.chord.forEach((note, idx) => {
        events.push({
          time: timeOffset,
          freq: noteToFreq(note),
          dur: p.dur + 1.8, // Envolvente solapada para crossfade natural
          vel: idx === 0 ? 0.65 : 0.35,
          type: 'pad_voice',
          pan: (idx % 2 === 0 ? -0.2 : 0.2)
        });
      });

      // Destellos cósmicos de medianoche
      p.sparkles.forEach(([note, tRel, dur]) => {
        events.push({
          time: timeOffset + tRel,
          freq: noteToFreq(note),
          dur: dur,
          vel: 0.60,
          type: 'pad_sparkle',
          pan: (Math.random() - 0.5) * 0.5
        });
      });

      timeOffset += p.dur;
    });

    return {
      id: 'brisa-medianoche',
      title: 'Brisa de Medianoche',
      subtitle: 'Acordes etereos y calidos',
      icon: '🌙',
      duration: timeOffset,
      events
    };
  }

  // --- Motor de Audio Web Audio API ---

  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.isPlaying = false;
      this.currentTrackIndex = 0;
      this.tracks = [];

      // Control del scheduler en tiempo real
      this.schedulerTimer = null;
      this.songTime = 0;
      this.lastScheduleTime = 0;
      this.scheduleAheadTime = 0.12; // Ventana de anticipacion de 120ms
      this.checkInterval = 35;        // Revision cada 35ms

      // Nodos maestros de audio
      this.masterGain = null;
      this.compressor = null;
      this.reverbNode = null;
      this.reverbGain = null;
      this.dryGain = null;

      // Event listeners para la UI
      this.listeners = {
        trackChange: [],
        stateChange: []
      };

      // Compatibilidad previa
      this.scale = [329.63, 392.00, 440.00, 493.88, 587.33, 659.25, 783.99, 880.00];

      // Inicializar canciones
      this.tracks = [
        buildGoldenHour(),
        buildCajitaRecuerdos(),
        buildBrisaMedianoche()
      ];
    }

    init() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();

        // 1. Compresor dinamico maestro (evita distorsion y mezcla con calidez de estudio)
        this.compressor = this.ctx.createDynamicsCompressor();
        this.compressor.threshold.setValueAtTime(-15, this.ctx.currentTime);
        this.compressor.knee.setValueAtTime(12, this.ctx.currentTime);
        this.compressor.ratio.setValueAtTime(3.8, this.ctx.currentTime);
        this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
        this.compressor.release.setValueAtTime(0.25, this.ctx.currentTime);

        // 2. Ganancia Maestra
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.78, this.ctx.currentTime);

        // 3. Reverberacion algoritmica de sala de concierto
        this.reverbNode = this.createReverbBuffer(2.4, 2.0);
        this.reverbGain = this.ctx.createGain();
        this.reverbGain.gain.setValueAtTime(0.32, this.ctx.currentTime);

        this.dryGain = this.ctx.createGain();
        this.dryGain.gain.setValueAtTime(0.85, this.ctx.currentTime);

        // Conexiones: Dry + Wet -> Compresor -> Master -> Salida
        this.dryGain.connect(this.compressor);
        this.reverbNode.connect(this.reverbGain);
        this.reverbGain.connect(this.compressor);

        this.compressor.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);
      }

      if (this.ctx.state === 'suspended' && !this.mediaActive) {
        this.ctx.resume();
      }
    }

    createReverbBuffer(duration = 2.4, decay = 2.0) {
      const convolver = this.ctx.createConvolver();
      const rate = this.ctx.sampleRate;
      const length = rate * duration;
      const impulse = this.ctx.createBuffer(2, length, rate);
      const left = impulse.getChannelData(0);
      const right = impulse.getChannelData(1);

      for (let i = 0; i < length; i++) {
        const t = i / length;
        const n = Math.exp(-t * decay);
        left[i] = (Math.random() * 2 - 1) * n;
        right[i] = (Math.random() * 2 - 1) * n;
      }

      convolver.buffer = impulse;
      return convolver;
    }

    // --- Sintesis de Instrumentos ---

    playPianoNote(freq, time, duration, velocity = 0.7, pan = 0) {
      if (!this.ctx) return;
      try {
        const t0 = Math.max(time, this.ctx.currentTime);
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const noteGain = this.ctx.createGain();

        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(freq, t0);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(freq * 2, t0);

        // Filtro pasabajos con apertura dinamica al pulsar
        filter.type = 'lowpass';
        const startCutoff = Math.min(3200, freq * 3.6 + 450);
        const endCutoff = Math.max(260, freq * 1.15);
        filter.frequency.setValueAtTime(startCutoff, t0);
        filter.frequency.exponentialRampToValueAtTime(endCutoff, t0 + Math.min(0.8, duration * 0.7));

        // Envolvente de volumen (ataque suave de fieltro, caida natural)
        const peakGain = Math.min(0.22, velocity * 0.20);
        noteGain.gain.setValueAtTime(0.0001, t0);
        noteGain.gain.exponentialRampToValueAtTime(peakGain, t0 + 0.006);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(noteGain);

        // Panning estereo
        if (this.ctx.createStereoPanner) {
          const panner = this.ctx.createStereoPanner();
          panner.pan.setValueAtTime(Math.max(-1, Math.min(1, pan)), t0);
          noteGain.connect(panner);
          panner.connect(this.dryGain);
          panner.connect(this.reverbNode);
        } else {
          noteGain.connect(this.dryGain);
          noteGain.connect(this.reverbNode);
        }

        osc1.start(t0);
        osc2.start(t0);
        osc1.stop(t0 + duration);
        osc2.stop(t0 + duration);
      } catch (e) {
        console.warn('Piano voice error:', e);
      }
    }

    playMusicBoxNote(freq, time, duration, velocity = 0.7, pan = 0) {
      if (!this.ctx) return;
      try {
        const t0 = Math.max(time, this.ctx.currentTime);
        const fundamental = this.ctx.createOscillator();
        const chime = this.ctx.createOscillator();
        const mainGain = this.ctx.createGain();
        const chimeGain = this.ctx.createGain();

        // Fundamental pura de campana
        fundamental.type = 'sine';
        fundamental.frequency.setValueAtTime(freq, t0);

        // Armonico inarmonico caracteristico de celesta / campana
        chime.type = 'sine';
        chime.frequency.setValueAtTime(freq * 2.756, t0);

        // Envolventes de campana cristalina
        const peakGain = Math.min(0.24, velocity * 0.22);
        mainGain.gain.setValueAtTime(0.0001, t0);
        mainGain.gain.exponentialRampToValueAtTime(peakGain, t0 + 0.002);
        mainGain.gain.exponentialRampToValueAtTime(0.00005, t0 + Math.min(duration, 3.2));

        chimeGain.gain.setValueAtTime(peakGain * 0.28, t0);
        chimeGain.gain.exponentialRampToValueAtTime(0.00005, t0 + 0.35);

        fundamental.connect(mainGain);
        chime.connect(chimeGain);

        // Combinar en panner
        const mixer = this.ctx.createGain();
        mainGain.connect(mixer);
        chimeGain.connect(mixer);

        if (this.ctx.createStereoPanner) {
          const panner = this.ctx.createStereoPanner();
          panner.pan.setValueAtTime(Math.max(-1, Math.min(1, pan)), t0);
          mixer.connect(panner);
          panner.connect(this.dryGain);
          panner.connect(this.reverbNode);
        } else {
          mixer.connect(this.dryGain);
          mixer.connect(this.reverbNode);
        }

        fundamental.start(t0);
        chime.start(t0);
        fundamental.stop(t0 + Math.min(duration, 3.2));
        chime.stop(t0 + 0.4);
      } catch (e) {
        console.warn('Music box voice error:', e);
      }
    }

    playPadVoice(freq, time, duration, velocity = 0.5, pan = 0) {
      if (!this.ctx) return;
      try {
        const t0 = Math.max(time, this.ctx.currentTime);
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const noteGain = this.ctx.createGain();

        // Dos osciladores suavemente desafinados para calidez de coro analogo
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(freq, t0);
        osc1.detune.setValueAtTime(-6, t0);

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(freq, t0);
        osc2.detune.setValueAtTime(6, t0);

        // Filtro resonante calido
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, t0);
        filter.frequency.exponentialRampToValueAtTime(750, t0 + 1.4);
        filter.Q.setValueAtTime(1.5, t0);

        // Envolvente de aparicion y desvanecimiento suave (pad celestial)
        const peakGain = Math.min(0.08, velocity * 0.075);
        noteGain.gain.setValueAtTime(0.0001, t0);
        noteGain.gain.exponentialRampToValueAtTime(peakGain, t0 + 1.2);
        noteGain.gain.setValueAtTime(peakGain, t0 + Math.max(1.3, duration - 2.2));
        noteGain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(noteGain);

        if (this.ctx.createStereoPanner) {
          const panner = this.ctx.createStereoPanner();
          panner.pan.setValueAtTime(pan, t0);
          noteGain.connect(panner);
          panner.connect(this.dryGain);
          panner.connect(this.reverbNode);
        } else {
          noteGain.connect(this.dryGain);
          noteGain.connect(this.reverbNode);
        }

        osc1.start(t0);
        osc2.start(t0);
        osc1.stop(t0 + duration);
        osc2.stop(t0 + duration);
      } catch (e) {
        console.warn('Pad voice error:', e);
      }
    }

    playPadSparkle(freq, time, duration, velocity = 0.5, pan = 0) {
      if (!this.ctx) return;
      try {
        const t0 = Math.max(time, this.ctx.currentTime);
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t0);

        const peakGain = Math.min(0.09, velocity * 0.08);
        gain.gain.setValueAtTime(0.0001, t0);
        gain.gain.exponentialRampToValueAtTime(peakGain, t0 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.00005, t0 + duration);

        osc.connect(gain);

        if (this.ctx.createStereoPanner) {
          const panner = this.ctx.createStereoPanner();
          panner.pan.setValueAtTime(pan, t0);
          gain.connect(panner);
          panner.connect(this.reverbNode); // Enviado mayoritariamente a la reverberacion
        } else {
          gain.connect(this.reverbNode);
        }

        osc.start(t0);
        osc.stop(t0 + duration);
      } catch (e) {
        console.warn('Pad sparkle error:', e);
      }
    }

    // Despachador de notas segun instrumento
    scheduleEvent(event, triggerTime) {
      const freq = event.freq;
      const dur = event.dur;
      const vel = event.vel || 0.6;
      const pan = event.pan || 0;

      switch (event.type) {
        case 'piano_bass':
        case 'piano_arp':
        case 'piano_lead':
          this.playPianoNote(freq, triggerTime, dur, vel, pan);
          break;
        case 'box_bass':
        case 'box_chime':
        case 'box_melody':
          this.playMusicBoxNote(freq, triggerTime, dur, vel, pan);
          break;
        case 'pad_voice':
          this.playPadVoice(freq, triggerTime, dur, vel, pan);
          break;
        case 'pad_sparkle':
          this.playPadSparkle(freq, triggerTime, dur, vel, pan);
          break;
        default:
          this.playPianoNote(freq, triggerTime, dur, vel, pan);
      }
    }

    // --- Sequencer & Lookahead Scheduler ---

    schedulerTick() {
      if (!this.isPlaying || !this.ctx) return;

      const track = this.tracks[this.currentTrackIndex];
      if (!track) return;

      const currentTime = this.ctx.currentTime;
      const lookaheadLimit = currentTime + this.scheduleAheadTime;

      while (this.nextEventRealTime < lookaheadLimit) {
        const events = track.events;
        const currentEvent = events[this.nextEventIndex];

        if (currentEvent) {
          this.scheduleEvent(currentEvent, this.nextEventRealTime);
        }

        this.nextEventIndex++;

        if (this.nextEventIndex >= events.length) {
          // Bucle continuo suave
          this.nextEventIndex = 0;
          this.loopStartTime = this.loopStartTime + track.duration;
        }

        const nextEv = events[this.nextEventIndex];
        if (nextEv) {
          this.nextEventRealTime = this.loopStartTime + nextEv.time;
        } else {
          break;
        }
      }
    }

    // --- Controles del Reproductor (Play, Pause, Siguiente, Seleccionar) ---

    play() {
      this.init();
      if (this.isPlaying) return;

      this.isPlaying = true;
      const track = this.tracks[this.currentTrackIndex];
      this.loopStartTime = this.ctx.currentTime + 0.05;
      this.nextEventIndex = 0;
      this.nextEventRealTime = this.loopStartTime + (track.events[0] ? track.events[0].time : 0);

      if (this.schedulerTimer) clearInterval(this.schedulerTimer);
      this.schedulerTick();
      this.schedulerTimer = setInterval(() => this.schedulerTick(), this.checkInterval);

      this.emitStateChange();
    }

    pause() {
      this.isPlaying = false;
      if (this.schedulerTimer) {
        clearInterval(this.schedulerTimer);
        this.schedulerTimer = null;
      }
      this.emitStateChange();
    }

    toggle() {
      if (this.isPlaying) {
        this.pause();
        return false;
      } else {
        this.play();
        return true;
      }
    }

    selectTrack(index) {
      if (index < 0 || index >= this.tracks.length) return;
      const wasPlaying = this.isPlaying;
      if (wasPlaying) {
        this.pause();
      }

      this.currentTrackIndex = index;
      this.emitTrackChange();

      if (wasPlaying) {
        this.play();
      }
    }

    nextTrack() {
      const nextIdx = (this.currentTrackIndex + 1) % this.tracks.length;
      this.selectTrack(nextIdx);
      return this.getCurrentTrack();
    }

    prevTrack() {
      const prevIdx = (this.currentTrackIndex - 1 + this.tracks.length) % this.tracks.length;
      this.selectTrack(prevIdx);
      return this.getCurrentTrack();
    }

    getCurrentTrack() {
      return this.tracks[this.currentTrackIndex];
    }

    getTrackList() {
      return this.tracks.map((t, idx) => ({
        index: idx,
        id: t.id,
        title: t.title,
        subtitle: t.subtitle,
        icon: t.icon,
        duration: t.duration
      }));
    }

    // Eventos y listeners
    onTrackChange(cb) {
      if (typeof cb === 'function') this.listeners.trackChange.push(cb);
    }

    onStateChange(cb) {
      if (typeof cb === 'function') this.listeners.stateChange.push(cb);
    }

    emitTrackChange() {
      const track = this.getCurrentTrack();
      this.listeners.trackChange.forEach(cb => {
        try { cb(track, this.currentTrackIndex); } catch (e) { console.error(e); }
      });
    }

    emitStateChange() {
      this.listeners.stateChange.forEach(cb => {
        try { cb(this.isPlaying); } catch (e) { console.error(e); }
      });
    }

    // --- Retrocompatibilidad con la app existente ---

    startMelody() {
      this.play();
    }

    stopMelody() {
      this.pause();
    }

    playChord(frequencies, duration = 2.4, gainVal = 0.045) {
      this.init();
      if (!this.ctx || !Array.isArray(frequencies)) return;

      frequencies.forEach((freq, idx) => {
        setTimeout(() => {
          if (!this.ctx) return;
          // Toca usando el sintetizador de piano calido
          this.playPianoNote(freq, this.ctx.currentTime, duration, 0.65, (idx - (frequencies.length / 2)) * 0.15);
        }, idx * 22);
      });
    }

    playChime(index = 0) {
      this.init();
      const note = this.scale[index % this.scale.length];
      this.playMusicBoxNote(note, this.ctx.currentTime, 2.0, 0.75, 0.1);
      this.playMusicBoxNote(note * 2, this.ctx.currentTime + 0.04, 1.4, 0.45, -0.1);
    }

    playHug() {
      this.init();
      const t = this.ctx.currentTime;
      // Dueto dulce para el abrazo
      this.playPianoNote(440.00, t, 1.8, 0.85, -0.15);
      this.playPianoNote(659.25, t + 0.12, 2.2, 0.85, 0.15);
    }
  }

  // Exportar en window
  root.SoundEngine = SoundEngine;
  root.soundEngine = new SoundEngine();

})(typeof window !== 'undefined' ? window : global);
