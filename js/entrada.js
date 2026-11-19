/* ==========================================================================
   ENTRADA: teclado (flechas / A D / espacio) + botones táctiles multitouch.
   El pad izquierdo detecta deslizar el dedo de ◀ a ▶ sin levantarlo; el botón
   de salto es independiente para poder usar los dos pulgares a la vez.
   ========================================================================== */
(function (App) {
  'use strict';

  const E = {
    izq: false, der: false, salto: false,
    activa: false,            // sólo captura teclas del juego cuando está jugando
    tactil: false,            // se vuelve true al detectar un toque
    _tec: { izq: false, der: false, salto: false },
    _tou: { mov: null, salto: false },
    _pulso: false,

    // true una sola vez por cada pulsación de salto
    leerSalto: function () { const v = this._pulso; this._pulso = false; return v; },

    reiniciar: function () {
      this._tec.izq = this._tec.der = this._tec.salto = false;
      this._tou.mov = null; this._tou.salto = false;
      this._pulso = false;
      this._combinar();
      document.querySelectorAll('#controles .activo').forEach(function (n) { n.classList.remove('activo'); });
    },

    _combinar: function () {
      this.izq = this._tec.izq || this._tou.mov === 'izq';
      this.der = this._tec.der || this._tou.mov === 'der';
      this.salto = this._tec.salto || this._tou.salto;
    },

    init: function () {
      const self = this;
      const mapa = {
        ArrowLeft: 'izq', KeyA: 'izq', ArrowRight: 'der', KeyD: 'der',
        ArrowUp: 'salto', KeyW: 'salto', Space: 'salto', KeyZ: 'salto'
      };
      window.addEventListener('keydown', function (e) {
        const k = mapa[e.code];
        if (!k) return;
        if (!self.activa) return;
        e.preventDefault();
        if (k === 'salto' && !self._tec.salto) self._pulso = true;
        self._tec[k] = true; self._combinar();
      });
      window.addEventListener('keyup', function (e) {
        const k = mapa[e.code];
        if (!k) return;
        self._tec[k] = false; self._combinar();
      });
      window.addEventListener('blur', function () { self.reiniciar(); });

      // ---- Táctil ----
      const pad = document.getElementById('pad-mov');
      const btnSalto = document.getElementById('btn-salto');
      const bIzq = document.getElementById('btn-izq');
      const bDer = document.getElementById('btn-der');
      if (!pad || !btnSalto) return;

      function marcar(lado) {
        self._tou.mov = lado;
        bIzq.classList.toggle('activo', lado === 'izq');
        bDer.classList.toggle('activo', lado === 'der');
        self._combinar();
      }
      let punteroMov = null;
      function ladoDe(e) {
        const r = pad.getBoundingClientRect();
        return (e.clientX - r.left) < r.width / 2 ? 'izq' : 'der';
      }
      pad.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        self.tactil = true; document.body.classList.add('tactil');
        punteroMov = e.pointerId;
        try { pad.setPointerCapture(e.pointerId); } catch (_) {}
        marcar(ladoDe(e));
      });
      pad.addEventListener('pointermove', function (e) {
        if (e.pointerId === punteroMov) marcar(ladoDe(e));
      });
      function soltarMov(e) {
        if (e.pointerId !== punteroMov) return;
        punteroMov = null; marcar(null);
      }
      pad.addEventListener('pointerup', soltarMov);
      pad.addEventListener('pointercancel', soltarMov);
      pad.addEventListener('lostpointercapture', soltarMov);

      let punteroSalto = null;
      btnSalto.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        self.tactil = true; document.body.classList.add('tactil');
        punteroSalto = e.pointerId;
        try { btnSalto.setPointerCapture(e.pointerId); } catch (_) {}
        self._tou.salto = true; self._pulso = true; self._combinar();
        btnSalto.classList.add('activo');
      });
      function soltarSalto(e) {
        if (e.pointerId !== punteroSalto) return;
        punteroSalto = null;
        self._tou.salto = false; self._combinar();
        btnSalto.classList.remove('activo');
      }
      btnSalto.addEventListener('pointerup', soltarSalto);
      btnSalto.addEventListener('pointercancel', soltarSalto);
      btnSalto.addEventListener('lostpointercapture', soltarSalto);

      // Evitar menú contextual, selección y zoom por gestos en los controles
      ['contextmenu', 'dragstart'].forEach(function (ev) {
        document.getElementById('controles').addEventListener(ev, function (e) { e.preventDefault(); });
      });
      document.addEventListener('gesturestart', function (e) { e.preventDefault(); });
    }
  };

  App.Entrada = E;
})(window.App = window.App || {});
