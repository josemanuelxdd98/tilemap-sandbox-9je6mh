/* ==========================================================================
   AUDIO
   · Efectos de sonido sintetizados con WebAudio (no hay archivos de audio).
   · Música de fondo opcional: si existe "cancion.mp3" junto a index.html se
     reproduce en bucle (después del primer toque, como exigen los celulares).
   · Botón de silencio (guarda la preferencia en el navegador).
   ========================================================================== */
(function (App) {
  'use strict';

  let ctx = null, maestro = null;

  function guardar(v) { try { localStorage.setItem('nap_sonido', v ? '1' : '0'); } catch (e) {} }
  function leer() { try { return localStorage.getItem('nap_sonido') !== '0'; } catch (e) { return true; } }

  // tono simple con envolvente; f2 = frecuencia final (barrido)
  function tono(f, dur, tipo, vol, f2, retraso) {
    if (!ctx || !A.activo) return;
    const t = ctx.currentTime + (retraso || 0);
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = tipo || 'square';
    o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.15, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(maestro);
    o.start(t); o.stop(t + dur + 0.03);
  }

  const PENTA = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.5];

  const A = {
    activo: true,
    musica: null,
    musicaError: false,

    init: function () {
      this.activo = leer();
      const a = new Audio();
      a.loop = true;
      a.preload = 'auto';
      a.volume = 0.5;
      a.addEventListener('error', function () { A.musicaError = true; });
      a.src = 'cancion.mp3';
      this.musica = a;
      document.addEventListener('visibilitychange', function () {
        if (!A.musica) return;
        if (document.hidden) A.musica.pause(); else A._tocarMusica();
      });
    },

    // Llamar dentro de un gesto del usuario (clic en "Jugar")
    desbloquear: function () {
      if (!ctx) {
        const C = window.AudioContext || window.webkitAudioContext;
        if (C) {
          try {
            ctx = new C();
            maestro = ctx.createGain();
            maestro.gain.value = 0.55;
            maestro.connect(ctx.destination);
          } catch (e) { ctx = null; }
        }
      }
      if (ctx && ctx.state === 'suspended') ctx.resume();
      this._iniciado = true;
      this._tocarMusica();
    },

    _tocarMusica: function () {
      if (!this._iniciado || !this.musica || this.musicaError) return;
      if (!this.activo) { this.musica.pause(); return; }
      const p = this.musica.play();
      if (p && p.catch) p.catch(function () {});
    },

    alternar: function () {
      this.activo = !this.activo;
      guardar(this.activo);
      if (this.activo) this._tocarMusica(); else if (this.musica) this.musica.pause();
      return this.activo;
    },

    /* ---- efectos ---- */
    salto: function () { tono(300, 0.16, 'square', 0.09, 620); },
    aterrizar: function () { tono(140, 0.05, 'triangle', 0.08, 90); },
    corazon: function (combo) {
      const n = Math.min(PENTA.length - 1, combo || 0);
      tono(PENTA[n], 0.11, 'square', 0.08);
      tono(PENTA[n] * 2, 0.12, 'triangle', 0.07, null, 0.05);
    },
    platano: function () {
      [0, 2, 4, 5, 7].forEach(function (i, k) { tono(PENTA[i] * 1.0, 0.12, 'square', 0.08, null, k * 0.07); });
    },
    nota: function () {
      [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5].forEach(function (f, k) { tono(f, 0.2, 'triangle', 0.1, null, k * 0.11); });
    },
    guau: function () { tono(260, 0.09, 'square', 0.1, 180); tono(300, 0.1, 'square', 0.1, 190, 0.13); },
    auu: function () { tono(260, 0.9, 'sine', 0.12, 640); tono(640, 0.7, 'sine', 0.08, 420, 0.8); },
    caida: function () { tono(360, 0.4, 'sawtooth', 0.07, 70); },
    meta: function () {
      [523.25, 659.25, 783.99, 1046.5].forEach(function (f, k) { tono(f, 0.22, 'square', 0.09, null, k * 0.12); });
      tono(1318.5, 0.5, 'triangle', 0.12, null, 0.5);
    },
    tarjeta: function () {
      [392, 523.25, 659.25].forEach(function (f, k) { tono(f, 0.28, 'triangle', 0.1, null, k * 0.1); });
    },
    tecla: function () { tono(1100 + Math.random() * 300, 0.025, 'square', 0.025); },
    abrir: function () { tono(400, 0.35, 'triangle', 0.1, 900); },
    destello: function () {
      for (let i = 0; i < 6; i++) tono(PENTA[(i * 3) % 8] * 2, 0.16, 'triangle', 0.06, null, i * 0.08);
    },
    clic: function () { tono(660, 0.06, 'square', 0.06, 880); }
  };

  App.Audio = A;
})(window.App = window.App || {});
