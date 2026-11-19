/* ==========================================================================
   MOTOR: física de plataformas, cámara, recolección, personajes, partículas,
   HUD y la cinemática del encuentro final.
   Muy fácil por diseño: salto generoso, "coyote time", buffer de salto, imán de
   corazones, sin enemigos, y si cae reaparece al inicio del nivel.
   ========================================================================== */
(function (App) {
  'use strict';
  const TAM = 16, ALTO_MUNDO = 176;
  const A = App.Arte, Sp = App.Sprites, F = App.Fuente, Es = App.Escenarios, Au = App.Audio, En = App.Entrada, Ni = App.Niveles, PAL = App.PAL;
  const R = A.R;

  const FIS = {
    velMax: 92, aceSuelo: 780, aceAire: 560, friccion: 880, grav: 980, caidaMax: 340,
    salto: 345, corte: 0.45, coyote: 0.11, buffer: 0.13
  };

  const cacheEsc = {};
  const silueta = new Map();
  function siluetaDe(c, col) {
    let s = silueta.get(c);
    if (!s) {
      const o = App.lienzo(c.width, c.height);
      o[1].drawImage(c, 0, 0);
      o[1].globalCompositeOperation = 'source-in';
      o[1].fillStyle = col; o[1].fillRect(0, 0, c.width, c.height);
      s = o[0]; silueta.set(c, s);
    }
    return s;
  }
  function rnd(a, b) { return a + Math.random() * (b - a); }

  const M = {
    W: 400, H: 176,
    nivel: null, esc: null, j: null, cam: 0, t: 0,
    parts: [], burbujas: [], toasts: [],
    estado: 'jugando', intro: null, fade: null,
    cuenta: 0, combo: 0, ultimoCorazon: -9, caidas: 0, platanoTomado: false, notaTomada: false,
    meta: null, fin: null,
    alTerminar: null, alSobre: null, alPlatano: null, alRecuerdo: null,

    redimensionar: function (W, H) { this.W = W; this.H = H; },

    /* ------------------------- carga de nivel ------------------------- */
    cargarNivel: function (idx) {
      const nv = Ni.crear(idx);
      this.nivel = nv; this.idx = idx;
      if (!cacheEsc[nv.tema]) cacheEsc[nv.tema] = Es.crear(nv.tema);
      this.esc = cacheEsc[nv.tema];
      this.esc.amb.listo = false;
      this.j = {
        x: nv.inicio.x - 5, y: nv.inicio.y - 20, w: 10, h: 20, vx: 0, vy: 0, suelo: true,
        dir: 1, coyote: 0, buffer: 0, cortable: false, animT: 0, alfa: 1, vyAnt: 0
      };
      this.cam = Math.max(0, this.j.x - this.W * 0.4);
      this.t = 0; this.parts = []; this.burbujas = []; this.toasts = [];
      this.cuenta = 0; this.combo = 0; this.caidas = 0; this.platanoTomado = false; this.notaTomada = false;
      this.estado = 'jugando'; this.meta = null; this.fin = null;
      this.intro = { t: 0, ttl: 3.6 };
      this.recuerdosTomados = 0;
      this.nivel.npcs.forEach(function (n) { n.cool = 0; n.mira = 1; n.dir = 1; n.t = 0; });
      this.fadeEntrar(0.6);
    },

    stats: function () {
      return { idx: this.idx, corazones: this.cuenta, total: this.nivel.corazones.length, platano: this.platanoTomado, caidas: this.caidas };
    },

    /* ------------------------- fundidos ------------------------- */
    fadeEntrar: function (seg) { this.fade = { a: 1, dir: -1, vel: 1 / seg, fin: null }; },
    fadeSalir: function (seg, fin) { this.fade = { a: 0, dir: 1, vel: 1 / seg, fin: fin }; },

    /* ------------------------- utilidades de mundo ------------------------- */
    tile: function (tx, ty) {
      const nv = this.nivel;
      if (tx < 0 || tx >= nv.ancho) return 2;       // paredes laterales
      if (ty < 0 || ty >= nv.alto) return 0;
      return nv.g[ty * nv.ancho + tx];
    },
    solido: function (k) { return k === 1 || k === 2 || k === 3; },

    burbuja: function (texto, x, y, ttl) { this.burbujas.push({ texto: texto, x: x, y: y, t: 0, ttl: ttl || 2.2 }); },
    toast: function (texto, ttl, color) { this.toasts.push({ texto: texto, t: 0, ttl: ttl || 2.6, color: color || '#ffd36e' }); },

    lluviaCorazones: function (x, y, n, extra) {
      const cols = ['#ff5d8a', '#ff8fb1', '#ffc2d0', '#e3b4f0', '#ffd36e'];
      for (let i = 0; i < n; i++) {
        this.parts.push({
          tipo: 'corazon', x: x + rnd(-8, 8), y: y + rnd(-6, 6), vx: rnd(-40, 40), vy: -rnd(30, 90), g: 60,
          t: 0, ttl: rnd(0.9, 1.7) + (extra || 0), col: cols[Math.floor(Math.random() * cols.length)], tam: Math.random() < 0.35 ? 'g' : 'm'
        });
      }
    },
    chispas: function (x, y, n, col, vel) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * 6.283, v = rnd(20, vel || 60);
        this.parts.push({ tipo: 'chispa', x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 10, g: 70, t: 0, ttl: rnd(0.3, 0.7), col: col || '#ffd36e' });
      }
    },
    polvo: function (x, y, n) {
      for (let i = 0; i < n; i++) this.parts.push({ tipo: 'polvo', x: x + rnd(-4, 4), y: y, vx: rnd(-18, 18), vy: -rnd(6, 20), g: 0, t: 0, ttl: rnd(0.25, 0.45), col: '#fff1e0' });
    },
    salpicadura: function (x, y) {
      for (let i = 0; i < 12; i++) this.parts.push({ tipo: 'chispa', x: x, y: y, vx: rnd(-45, 45), vy: -rnd(60, 140), g: 420, t: 0, ttl: rnd(0.4, 0.8), col: i % 2 ? '#a8e4f4' : '#ffffff' });
    },

    /* ------------------------- actualización ------------------------- */
    actualizar: function (dt) {
      if (!this.nivel) return;
      dt = Math.min(dt, 0.05);
      this.t += dt;
      if (this.intro) { this.intro.t += dt; if (this.intro.t > this.intro.ttl) this.intro = null; }

      // fundido
      if (this.fade) {
        this.fade.a += this.fade.dir * this.fade.vel * dt;
        if (this.fade.dir > 0 && this.fade.a >= 1) { this.fade.a = 1; const f = this.fade.fin; this.fade.fin = null; if (f) f(); }
        else if (this.fade.dir < 0 && this.fade.a <= 0) { this.fade = null; }
      }

      const saltoPres = En.leerSalto();
      let ctrl = { dir: 0, salto: false, saltoPres: false, vmax: FIS.velMax };
      if (this.estado === 'jugando') {
        ctrl.dir = (En.der ? 1 : 0) - (En.izq ? 1 : 0);
        ctrl.salto = En.salto; ctrl.saltoPres = saltoPres;
      } else if (this.estado === 'meta') {
        ctrl = this.controlMeta(dt);
      } else if (this.estado === 'final') {
        ctrl = this.controlFinal(dt);
      } else {
        ctrl.dir = 0;
      }
      if (this.estado !== 'reaparece') this.actualizarJugador(dt, ctrl);

      this.actualizarMundo(dt);
      this.actualizarCamara(dt);
      Es.actualizarAmbiente(this.esc, dt, this.W, this.H, this.t);

      // partículas
      for (let i = this.parts.length - 1; i >= 0; i--) {
        const p = this.parts[i];
        p.vy += (p.g || 0) * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.t += dt;
        if (p.t >= p.ttl) this.parts.splice(i, 1);
      }
      for (let i = this.burbujas.length - 1; i >= 0; i--) { this.burbujas[i].t += dt; if (this.burbujas[i].t > this.burbujas[i].ttl) this.burbujas.splice(i, 1); }
      for (let i = this.toasts.length - 1; i >= 0; i--) { this.toasts[i].t += dt; if (this.toasts[i].t > this.toasts[i].ttl) this.toasts.splice(i, 1); }
    },

    actualizarJugador: function (dt, c) {
      const j = this.j, nv = this.nivel;
      // --- horizontal ---
      const acc = j.suelo ? FIS.aceSuelo : FIS.aceAire;
      if (c.dir !== 0) {
        const giro = (j.vx * c.dir < 0) ? 2.2 : 1;
        j.vx += c.dir * acc * giro * dt;
        if (j.vx > c.vmax) j.vx = c.vmax; if (j.vx < -c.vmax) j.vx = -c.vmax;
        j.dir = c.dir;
      } else {
        const f = (j.suelo ? FIS.friccion : 260) * dt;
        if (Math.abs(j.vx) <= f) j.vx = 0; else j.vx -= Math.sign(j.vx) * f;
      }
      // --- salto (coyote + buffer + salto variable) ---
      if (c.saltoPres) j.buffer = FIS.buffer; else j.buffer -= dt;
      if (j.suelo) j.coyote = FIS.coyote; else j.coyote -= dt;
      if (j.buffer > 0 && j.coyote > 0) {
        j.vy = -FIS.salto; j.buffer = 0; j.coyote = 0; j.suelo = false; j.cortable = true;
        Au.salto(); this.polvo(j.x + j.w / 2, j.y + j.h, 4);
      }
      if (!c.salto && j.vy < 0 && j.cortable) { j.vy *= FIS.corte; j.cortable = false; }
      if (j.vy >= 0) j.cortable = false;
      j.vyAnt = j.vy;
      j.vy += FIS.grav * dt;
      if (j.vy > FIS.caidaMax) j.vy = FIS.caidaMax;

      // --- mover X ---
      const antSuelo = j.suelo;
      j.x += j.vx * dt;
      let top = Math.floor(j.y / TAM), bot = Math.floor((j.y + j.h - 0.01) / TAM);
      if (j.vx > 0) {
        const tx = Math.floor((j.x + j.w) / TAM);
        for (let ty = top; ty <= bot; ty++) if (this.solido(this.tile(tx, ty))) { j.x = tx * TAM - j.w; j.vx = 0; break; }
      } else if (j.vx < 0) {
        const tx = Math.floor(j.x / TAM);
        for (let ty = top; ty <= bot; ty++) if (this.solido(this.tile(tx, ty))) { j.x = (tx + 1) * TAM; j.vx = 0; break; }
      }
      // --- mover Y ---
      const prevBottom = j.y + j.h;
      j.y += j.vy * dt;
      j.suelo = false;
      const izq = Math.floor(j.x / TAM), der = Math.floor((j.x + j.w - 0.01) / TAM);
      if (j.vy >= 0) {
        const by = Math.floor((j.y + j.h) / TAM);
        for (let tx = izq; tx <= der; tx++) {
          const k = this.tile(tx, by);
          if (this.solido(k) || (k === 4 && prevBottom <= by * TAM + 0.5)) {
            j.y = by * TAM - j.h;
            if (!antSuelo && j.vyAnt > 120) { Au.aterrizar(); this.polvo(j.x + j.w / 2, j.y + j.h, 3); }
            j.vy = 0; j.suelo = true; break;
          }
        }
      } else {
        const ty = Math.floor(j.y / TAM);
        for (let tx = izq; tx <= der; tx++) if (this.solido(this.tile(tx, ty))) { j.y = (ty + 1) * TAM; j.vy = 0; break; }
      }
      // animación
      if (j.suelo && Math.abs(j.vx) > 8) j.animT += dt * (0.6 + Math.abs(j.vx) / FIS.velMax);
      else if (j.suelo) j.animT += dt * 0.5;

      // --- agua / caída ---
      const fosoAgua = this.esc.foso && this.esc.foso.tipo === 'agua';
      if (!this.j.splash && fosoAgua && j.y + j.h > ALTO_MUNDO - 20 && j.vy > 0) {
        j.splash = true; this.salpicadura(j.x + j.w / 2, ALTO_MUNDO - 22);
      }
      if (j.y > ALTO_MUNDO + 36 && this.estado !== 'reaparece') this.caer();
    },

    caer: function () {
      this.estado = 'reaparece';
      this.caidas++;
      Au.caida();
      this.toast('¡Casi! Inténtalo otra vez', 1.6, '#fff1e0');
      const self = this;
      this.fadeSalir(0.35, function () {
        const nv = self.nivel, j = self.j;
        j.x = nv.inicio.x - 5; j.y = nv.inicio.y - j.h; j.vx = 0; j.vy = 0; j.suelo = true; j.splash = false; j.alfa = 1; j.dir = 1;
        self.cam = Math.max(0, j.x - self.W * 0.4);
        self.estado = 'jugando';
        self.fadeEntrar(0.35);
      });
    },

    actualizarCamara: function (dt) {
      const nv = this.nivel, j = this.j;
      let obj;
      if (this.estado === 'final' && this.fin) {
        obj = (this.fin.cx || (j.x + j.w / 2)) - this.W / 2;
      } else {
        obj = j.x + j.w / 2 - this.W * 0.42 + j.dir * 16;
      }
      const max = Math.max(0, nv.ancho * TAM - this.W);
      this.cam += (obj - this.cam) * Math.min(1, dt * (this.estado === 'final' ? 2.2 : 6));
      if (this.cam < 0) this.cam = 0; if (this.cam > max) this.cam = max;
    },

    /* ------------------------- mundo: objetos, NPC, metas ------------------------- */
    actualizarMundo: function (dt) {
      const nv = this.nivel, j = this.j;
      const px = j.x + j.w / 2, py = j.y + j.h / 2;
      const activo = this.estado === 'jugando';

      // corazones (con imán)
      if (activo) {
        for (let i = 0; i < nv.corazones.length; i++) {
          const c = nv.corazones[i];
          if (c.tomado) continue;
          const dx = px - c.x, dy = py - c.y, d = Math.sqrt(dx * dx + dy * dy);
          if (d < 30) { const k = Math.min(1, dt * 9); c.x += dx * k; c.y += dy * k; }
          if (d < 11) {
            c.tomado = true; this.cuenta++;
            this.combo = (this.t - this.ultimoCorazon < 1.3) ? this.combo + 1 : 0;
            this.ultimoCorazon = this.t;
            Au.corazon(this.combo);
            this.chispas(c.x, c.y, 5, '#ffc2d0', 50);
            this.hudPulso = 0.25;
          }
        }
        // plátano dorado
        if (nv.platano && !nv.platano.tomado) {
          const p = nv.platano;
          if (Math.abs(px - p.x) < 14 && Math.abs(py - p.y) < 16) {
            p.tomado = true; this.platanoTomado = true;
            Au.platano(); this.chispas(p.x, p.y, 16, '#ffd23f', 90); this.lluviaCorazones(p.x, p.y, 6);
            this.toast('¡Plátano dorado!', 3, '#ffd23f');
            if (this.alPlatano) this.alPlatano(this.idx);
          }
        }
        // nota musical (guiño a la canción)
        if (nv.nota && !nv.nota.tomado) {
          const p = nv.nota;
          if (Math.abs(px - p.x) < 14 && Math.abs(py - p.y) < 16) {
            p.tomado = true; this.notaTomada = true;
            Au.nota(); this.chispas(p.x, p.y, 14, '#ffe27a', 80);
            const c = window.DATOS.detalles.cancion;
            this.toast('♪ ' + c.titulo + ' — ' + c.artista + ' ♪', 3.6, '#ffe27a');
            for (let i = 0; i < 6; i++) this.parts.push({ tipo: 'nota', x: p.x + rnd(-6, 6), y: p.y, vx: rnd(-18, 18), vy: -rnd(26, 50), g: 0, t: 0, ttl: 1.8, col: '#ffe27a' });
          }
        }
        // recuerdos (nivel final)
        nv.recuerdos.forEach(function (r) {
          if (r.tomado) return;
          if (Math.abs(px - r.x) < 14 && Math.abs(py - r.y) < 16) {
            r.tomado = true; this.recuerdosTomados++;
            Au.platano(); this.chispas(r.x, r.y, 14, '#ffffff', 80); this.lluviaCorazones(r.x, r.y, 8);
            const rc = window.DATOS.recuerdos[r.i];
            this.toast(rc.titulo, 3.2, '#ffffff');
          }
        }, this);
      }

      // NPC: Rolly, lobita
      nv.npcs.forEach(function (n) {
        n.t += dt; if (n.cool > 0) n.cool -= dt;
        const dx = px - n.x;
        if (n.tipo === 'rolly') {
          n.mira = dx >= 0 ? 1 : -1;
          if (activo && Math.abs(dx) < 26 && Math.abs(py - (n.y - 8)) < 30 && n.cool <= 0) {
            n.cool = 4; Au.guau(); this.burbuja('¡Guau!', n.x, n.y - 16, 1.6); this.lluviaCorazones(n.x, n.y - 14, 7);
            this.rollyHecho = true;
          }
        } else if (n.tipo === 'lobo') {
          if (activo && Math.abs(dx) < 70 && n.cool <= 0) {
            n.cool = 9; Au.auu(); this.burbuja('Auuu… ♥', n.x, n.y - 12, 2.4);
            for (let i = 0; i < 3; i++) this.parts.push({ tipo: 'nota', x: n.x + 6, y: n.y - 6, vx: rnd(-8, 12), vy: -rnd(16, 30), g: 0, t: 0, ttl: 1.6, col: '#fff4d0' });
          }
        }
      }, this);

      // meta
      if (activo && !this.meta) {
        const m = nv.meta;
        if (m.tipo === 'mani') {
          const mani = nv.npcs.find(function (n) { return n.tipo === 'mani'; });
          if (mani && px > mani.x - 120) this.iniciarFinal(mani);
        } else {
          const zona = m.estilo === 'entrar' ? 14 : 38;
          if (px > m.x - zona && px < m.x + zona && j.suelo) this.iniciarMeta();
        }
      }
      if (this.hudPulso > 0) this.hudPulso -= dt;
    },

    /* ----- meta normal: caminar hacia la puerta/mesa y celebrar ----- */
    iniciarMeta: function () {
      const m = this.nivel.meta;
      this.estado = 'meta';
      this.meta = { t: 0, fase: 0, estilo: m.estilo };
      En.reiniciar();
      Au.meta();
      this.lluviaCorazones(m.x, m.y - 30, 26, 0.6);
      this.chispas(m.x, m.y - 24, 22, '#fff1b8', 100);
    },
    controlMeta: function (dt) {
      const m = this.nivel.meta, j = this.j, mt = this.meta;
      mt.t += dt;
      const objetivo = m.estilo === 'entrar' ? m.x : m.x - 18;
      const jx = j.x + j.w / 2, d = objetivo - jx;
      const c = { dir: 0, salto: false, saltoPres: false, vmax: 50 };
      if (mt.fase === 0) {
        if (Math.abs(d) > 2) c.dir = d > 0 ? 1 : -1; else { mt.fase = 1; mt.t = 0; j.vx = 0; j.dir = (m.x >= jx) ? 1 : -1; }
      }
      if (mt.fase === 1) {
        if (m.estilo === 'entrar') {
          j.alfa = Math.max(0, 1 - mt.t / 0.55);
          if (mt.t > 0.9 && !mt.listo) { mt.listo = true; this.terminarNivel(); }
        } else {
          if (j.suelo && mt.t > 0.1 && mt.saltos !== 2) { j.vy = -170; j.suelo = false; mt.saltos = (mt.saltos || 0) + 1; this.lluviaCorazones(jx, j.y, 3); }
          if (mt.t > 1.3 && !mt.listo) { mt.listo = true; this.terminarNivel(); }
        }
      }
      return c;
    },
    terminarNivel: function () {
      const self = this;
      this.fadeSalir(0.45, function () { if (self.alTerminar) self.alTerminar(self.stats()); });
    },

    /* ----- final: ella se encuentra con Mani ----- */
    iniciarFinal: function (mani) {
      this.estado = 'final';
      En.reiniciar();
      this.fin = { fase: 0, t: 0, mani: mani, cx: null, sobre: 0 };
      mani.dir = 1; mani.mira = 1;
    },
    controlFinal: function (dt) {
      const f = this.fin, j = this.j, mani = f.mani;
      f.t += dt;
      const jx = j.x + j.w / 2, dist = mani.x - jx;
      const c = { dir: 0, salto: false, saltoPres: false, vmax: 54 };
      if (f.fase === 0) {                           // ella camina hacia él
        if (dist > 30) c.dir = 1; else { f.fase = 1; f.t = 0; j.vx = 0; j.dir = 1; }
        if (dist < 80 && !f.giro) {                 // él se da la vuelta
          f.giro = true; mani.dir = -1; mani.mira = -1;
          Au.nota(); this.burbuja('!', mani.x, mani.y - 28, 1.2);
        }
        f.cx = (jx + mani.x) / 2;
      } else if (f.fase === 1) {                    // saludo
        f.cx = (jx + mani.x) / 2;
        if (f.t > 0.7 && !f.hola) { f.hola = true; this.burbuja('¡Hola, ' + window.DATOS.detalles.apodoElla + '!', mani.x, mani.y - 28, 2.6); }
        if (f.t > 0.4 && !f.salto1 && j.suelo) { f.salto1 = true; j.vy = -190; j.suelo = false; }
        if (f.t > 2.4) { f.fase = 2; f.t = 0; Au.destello(); this.lluviaCorazones(f.cx, mani.y - 10, 50, 1.2); }
      } else if (f.fase === 2) {                    // lluvia de corazones + corazón gigante
        f.cx = (jx + mani.x) / 2;
        if (j.suelo && Math.random() < 0.05) { j.vy = -150; j.suelo = false; }
        if (Math.random() < 0.55) {
          const cols = ['#ff5d8a', '#ff8fb1', '#ffc2d0', '#e3b4f0', '#ffd36e', '#ffffff'];
          this.parts.push({
            tipo: 'corazon', x: f.cx + rnd(-90, 90), y: mani.y + rnd(-4, 12), vx: rnd(-12, 12), vy: -rnd(30, 80), g: -4,
            t: 0, ttl: rnd(2, 3.4), col: cols[Math.floor(Math.random() * cols.length)], tam: Math.random() < 0.3 ? 'g' : (Math.random() < 0.5 ? 'm' : 's')
          });
        }
        if (Math.random() < 0.02) Au.destello();
        if (f.t > 5.2) { f.fase = 3; f.t = 0; }
      } else if (f.fase === 3) {                    // aparece el sobre y se desbloquea la carta
        f.cx = (jx + mani.x) / 2;
        f.sobre = Math.min(1, f.t / 1.1);
        if (Math.random() < 0.3) {
          this.parts.push({
            tipo: 'corazon', x: f.cx + rnd(-110, 110), y: mani.y + rnd(0, 10), vx: rnd(-10, 10), vy: -rnd(30, 70), g: -4,
            t: 0, ttl: rnd(2, 3), col: ['#ff5d8a', '#ff8fb1', '#ffc2d0'][Math.floor(Math.random() * 3)], tam: 'm'
          });
        }
        if (f.t > 1.4 && !f.listo) { f.listo = true; Au.abrir(); if (this.alSobre) this.alSobre(); }
      }
      return c;
    },

    /* ------------------------------------------------------------------
       DIBUJO
       ------------------------------------------------------------------ */
    dibujar: function (ctx) {
      if (!this.nivel) return;
      const nv = this.nivel, esc = this.esc, W = this.W, H = this.H, t = this.t;
      const camX = Math.round(this.cam), oy = H - ALTO_MUNDO;
      ctx.imageSmoothingEnabled = false;
      Es.dibujarFondo(esc, ctx, camX, W, H, t);
      Es.dibujarFoso(esc, ctx, camX, W, H, t);

      ctx.save();
      ctx.translate(-camX, oy);
      // decorado de atrás
      this.dibujarDecos(ctx, 'atras', camX);
      // tiles
      this.dibujarTiles(ctx, camX);
      // objetos recolectables
      this.dibujarItems(ctx, camX);
      // personajes
      this.dibujarNPCs(ctx, camX);
      this.dibujarJugador(ctx);
      // decorado de frente
      this.dibujarDecos(ctx, 'frente', camX);
      // partículas del mundo
      this.dibujarParts(ctx);
      // cinemática final
      if (this.estado === 'final' && this.fin) this.dibujarFinalMundo(ctx);
      this.dibujarBurbujas(ctx, camX, oy);
      ctx.restore();

      Es.dibujarAmbiente(esc, ctx, W, H, t);
      if (this.estado === 'final' && this.fin) this.dibujarFinalPantalla(ctx);
      this.dibujarHUD(ctx);

      if (this.fade) {
        ctx.globalAlpha = Math.max(0, Math.min(1, this.fade.a));
        ctx.fillStyle = '#1a0a26'; ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
      }
    },

    dibujarDecos: function (ctx, capa, camX) {
      const decos = this.nivel.decos, W = this.W, t = this.t;
      for (let i = 0; i < decos.length; i++) {
        const d = decos[i];
        if (d.capa !== capa) continue;
        const p = d.prop, w = p.w, x0 = Math.round(d.x - w / 2);
        if (x0 + w < camX - 4 || x0 > camX + W + 4) continue;
        const fr = p.fps ? p.frames[Math.floor(t * p.fps + d.fase) % p.frames.length] : p.frames[0];
        const dy = d.flota ? Math.round(Math.sin(t * 1.5 + d.fase) * d.flota) : 0;
        ctx.drawImage(fr, x0, Math.round(d.y - p.h + dy));
      }
    },

    dibujarTiles: function (ctx, camX) {
      const nv = this.nivel, at = this.esc.atlas, W = this.W;
      const c0 = Math.max(0, Math.floor(camX / TAM)), c1 = Math.min(nv.ancho - 1, Math.floor((camX + W) / TAM));
      const self = this;
      function sol(tx, ty) { const k = self.tile(tx, ty); return k === 1 || k === 2 || k === 3; }
      for (let ty = 0; ty < nv.alto; ty++) {
        for (let tx = c0; tx <= c1; tx++) {
          const k = nv.g[ty * nv.ancho + tx];
          if (!k) continue;
          if (k === 4) {
            const v = (self.tile(tx - 1, ty) === 4 ? 0 : 1) | (self.tile(tx + 1, ty) === 4 ? 0 : 2);
            ctx.drawImage(at.plat[v], tx * TAM, ty * TAM);
          } else {
            const v = (!sol(tx - 1, ty) && tx > 0 ? 1 : 0) | (!sol(tx + 1, ty) && tx < nv.ancho - 1 ? 2 : 0);
            if (k === 1) ctx.drawImage(at.top[v], tx * TAM, ty * TAM);
            else if (k === 2) ctx.drawImage(at.cuerpo[v], tx * TAM, ty * TAM);
            else ctx.drawImage(at.bloque, tx * TAM, ty * TAM);
          }
        }
      }
    },

    dibujarItems: function (ctx, camX) {
      const nv = this.nivel, t = this.t, W = this.W;
      for (let i = 0; i < nv.corazones.length; i++) {
        const c = nv.corazones[i];
        if (c.tomado || c.x < camX - 12 || c.x > camX + W + 12) continue;
        const spr = Sp.corazon[Math.floor(t * 2.5 + i * 0.37) % 2];
        const by = Math.round(Math.sin(t * 3.2 + i * 0.8) * 1.5);
        ctx.drawImage(spr, Math.round(c.x - spr.width / 2), Math.round(c.y - spr.height / 2) + by);
      }
      function especial(p, spr, glow) {
        if (!p || p.tomado || p.x < camX - 20 || p.x > camX + W + 20) return;
        const by = Math.round(Math.sin(t * 2.6 + p.x) * 2);
        ctx.globalAlpha = 0.22 + 0.1 * Math.sin(t * 5); A.circ(ctx, glow, Math.round(p.x), Math.round(p.y) + by, 11); ctx.globalAlpha = 1;
        ctx.drawImage(spr, Math.round(p.x - spr.width / 2), Math.round(p.y - spr.height / 2) + by);
        if (Math.floor(t * 3 + p.x) % 4 === 0) R(ctx, '#ffffff', Math.round(p.x) + 6, Math.round(p.y) - 7 + by, 1, 1);
      }
      especial(nv.platano, Sp.platano, '#fff3b0');
      especial(nv.nota, Sp.nota, '#fff3b0');
      nv.recuerdos.forEach(function (r) { especial(r, Sp.iconos[r.i], '#ffffff'); });
    },

    dibujarNPCs: function (ctx, camX) {
      const nv = this.nivel, t = this.t, W = this.W;
      nv.npcs.forEach(function (n) {
        if (n.x < camX - 40 || n.x > camX + W + 40) return;
        if (n.tipo === 'rolly') {
          const spr = Sp.rolly[Math.floor(n.t * 5) % 2];
          const x = Math.round(n.x), y = Math.round(n.y);
          if (n.mira < 0) { ctx.save(); ctx.translate(x, 0); ctx.scale(-1, 1); ctx.drawImage(spr, -spr.width / 2, y - spr.height + 1); ctx.restore(); }
          else ctx.drawImage(spr, x - spr.width / 2, y - spr.height + 1);
        } else if (n.tipo === 'mani') {
          const fin = this.fin;
          let spr = Sp.mani.idle[Math.floor(t * 2) % 2], y = n.y;
          if (fin && (fin.fase === 1 || fin.fase === 2) ) {
            const hop = Math.max(0, Math.sin(fin.t * 7 + 1.2)) * (fin.fase === 2 ? 5 : 3);
            if (hop > 0.5) { spr = Sp.mani.feliz[0]; y -= Math.round(hop); }
          }
          Sp.persona(ctx, spr, n.x, y, n.dir < 0);
        }
      }, this);
    },

    dibujarJugador: function (ctx) {
      const j = this.j;
      if (j.alfa <= 0.01) return;
      let spr;
      const fin = this.fin;
      if (!j.suelo) spr = j.vy < 0 ? Sp.ana.salto[0] : Sp.ana.caida[0];
      else if (this.estado === 'meta' && this.meta && this.meta.fase === 1 && this.meta.estilo !== 'entrar') spr = Sp.ana.feliz[0];
      else if (Math.abs(j.vx) > 8) spr = Sp.ana.correr[Math.floor(j.animT * 9) % 4];
      else spr = Sp.ana.idle[Math.floor(j.animT * 2) % 2];
      if (this.estado === 'final' && fin && fin.fase >= 1 && !j.suelo) spr = Sp.ana.feliz[0];
      const fx = j.x + j.w / 2, fy = j.y + j.h;
      // sombra
      const esc = this.esc;
      if (j.suelo && esc.sombraLarga) {
        // sombra larga de atardecer (como en la foto del cumpleaños)
        const s = siluetaDe(spr, '#2a1a30');
        ctx.save();
        ctx.translate(Math.round(fx), Math.round(fy));
        ctx.transform(1, 0, 2.0, -0.18, 0, 0);
        ctx.globalAlpha = 0.3;
        ctx.drawImage(s, -Sp.ANCLA.x, -Sp.ANCLA.y);
        ctx.restore();
        ctx.globalAlpha = 1;
      } else if (j.suelo) {
        ctx.fillStyle = esc.sombra; ctx.fillRect(Math.round(fx) - 5, Math.round(fy), 10, 1);
      }
      if (j.alfa < 1) ctx.globalAlpha = j.alfa;
      Sp.persona(ctx, spr, fx, fy, j.dir < 0);
      ctx.globalAlpha = 1;
    },

    dibujarParts: function (ctx) {
      for (let i = 0; i < this.parts.length; i++) {
        const p = this.parts[i], x = Math.round(p.x), y = Math.round(p.y);
        const a = p.t > p.ttl - 0.35 ? Math.max(0, (p.ttl - p.t) / 0.35) : 1;
        ctx.globalAlpha = a;
        switch (p.tipo) {
          case 'corazon': {
            const spr = p.tam === 'g' ? Sp.corazon[0] : p.tam === 's' ? Sp.corazonMini(p.col) : Sp.corazon7(p.col);
            ctx.drawImage(spr, x - (spr.width >> 1), y - (spr.height >> 1));
            break;
          }
          case 'chispa': R(ctx, p.col, x, y, 2, 2); break;
          case 'polvo': R(ctx, p.col, x, y, 2, 2); break;
          case 'nota': F.dibujar(ctx, '♪', x, y, { color: p.col, borde: '#3a2a52' }); break;
          default: break;
        }
        ctx.globalAlpha = 1;
      }
    },

    // Globo de diálogo (también lo usa la pantalla de inicio)
    burbujaUna: function (ctx, b) {
      const tw = F.medir(b.texto), w = tw + 10, h = 13;
      const aparece = Math.min(1, b.t / 0.12), sale = b.ttl - b.t < 0.25 ? (b.ttl - b.t) / 0.25 : 1;
      if (aparece < 1 || sale < 1) ctx.globalAlpha = Math.min(aparece, sale);
      const x = Math.round(b.x - w / 2), y = Math.round(b.y - h - 6 - Math.sin(b.t * 5) * 1);
      const dark = '#2a1238', cream = '#fff8ee';
      R(ctx, dark, x + 1, y, w - 2, h); R(ctx, dark, x, y + 1, w, h - 2);
      R(ctx, cream, x + 2, y + 1, w - 4, h - 2); R(ctx, cream, x + 1, y + 2, w - 2, h - 4);
      const cx = Math.round(b.x);
      R(ctx, dark, cx - 2, y + h, 5, 1); R(ctx, dark, cx - 1, y + h + 1, 3, 1); R(ctx, dark, cx, y + h + 2, 1, 1);
      R(ctx, cream, cx - 1, y + h - 1, 3, 1); R(ctx, cream, cx, y + h, 1, 1);
      F.dibujar(ctx, b.texto, x + 5, y + 3, { color: dark });
      ctx.globalAlpha = 1;
    },
    dibujarBurbujas: function (ctx) {
      for (let i = 0; i < this.burbujas.length; i++) this.burbujaUna(ctx, this.burbujas[i]);
    },

    /* ---- cinemática final (mundo) ---- */
    dibujarFinalMundo: function (ctx) {
      const f = this.fin, mani = f.mani;
      if (f.fase >= 2) {
        const cx = f.cx, cy = mani.y - 78, p = 1 + Math.sin(this.t * 5) * 0.08;
        // crece en la fase 2 y se desvanece cuando aparece el sobre (fase 3)
        const esc = Math.min(1, f.fase === 2 ? f.t / 1.2 : 1) * (f.fase === 3 ? Math.max(0, 1 - f.t / 0.9) : 1);
        if (esc <= 0.02) return;
        const spr = Sp.corazon[0], s = 6 * esc * p;
        ctx.globalAlpha = 0.16 * esc; A.circ(ctx, '#ff8fb1', Math.round(cx), Math.round(cy), Math.round(36 * esc)); ctx.globalAlpha = 1;
        ctx.drawImage(spr, Math.round(cx - spr.width * s / 2), Math.round(cy - spr.height * s / 2), Math.round(spr.width * s), Math.round(spr.height * s));
      }
    },
    /* ---- cinemática final (pantalla) ---- */
    dibujarFinalPantalla: function (ctx) {
      const f = this.fin, W = this.W, H = this.H;
      if (f.fase >= 2) {
        ctx.globalAlpha = 0.1 + 0.05 * Math.sin(this.t * 4); ctx.fillStyle = '#ff8fb1'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
        const a = Math.min(1, (f.fase === 2 ? f.t : 3) / 0.8);
        const D = window.DATOS.final;
        const y = 22 + Math.round(Math.sin(this.t * 3) * 1.5);
        F.dibujar(ctx, D.titulo, W / 2, y, { escala: 2, color: '#fff1e0', borde: '#5b2a86', sombra: '#2a1238', alinear: 'centro', alfa: a });
        if (f.fase === 3 && f.sobre > 0) {
          const e = f.sobre, ease = 1 - Math.pow(1 - e, 3), bounce = Math.sin(this.t * 4) * 1.5 * e;
          const spr = Sp.sobre, s = 2;
          const ex = Math.round(W / 2 - spr.width * s / 2), ey = Math.round(-30 + (H * 0.42 + 30) * ease + bounce);
          ctx.globalAlpha = 0.3 * e; A.circ(ctx, '#ffd36e', Math.round(W / 2), ey + spr.height, Math.round(46 * e)); ctx.globalAlpha = 1;
          ctx.drawImage(spr, ex, ey, spr.width * s, spr.height * s);
          if (f.t > 0.8) F.dibujar(ctx, 'Se desbloqueó la carta final', W / 2, ey + spr.height * s + 8, { color: '#ffd36e', borde: '#2a1238', alinear: 'centro', alfa: Math.min(1, (f.t - 0.8) / 0.5) });
        }
      }
    },

    /* ---- HUD ---- */
    dibujarHUD: function (ctx) {
      const nv = this.nivel, W = this.W, H = this.H;
      const esFinal = nv.meta.tipo === 'mani';
      // contador de corazones
      const pulso = this.hudPulso > 0 ? 1 : 0;
      const sg = this.seguro || { izq: 0, arr: 0 }, hx = 5 + sg.izq, hy = 5 + sg.arr;
      ctx.drawImage(Sp.corazon[0], hx, hy - pulso);
      F.dibujar(ctx, this.cuenta + '/' + nv.corazones.length, hx + 14, hy + 1, { color: '#fff1e0', borde: '#2a1238' });
      if (this.platanoTomado) ctx.drawImage(Sp.platano, hx, hy + 14);
      if (esFinal) { F.dibujar(ctx, this.recuerdosTomados + '/8', hx + 14, hy + 16, { color: '#ffffff', borde: '#2a1238' }); }
      // barra de progreso (arriba al centro)
      if (this.estado === 'jugando' || this.estado === 'meta') {
        const bw = 60, bx = Math.round(W / 2 - bw / 2), by = 5;
        const prog = Math.max(0, Math.min(1, (this.j.x) / (nv.meta.x - 20)));
        ctx.globalAlpha = 0.6; R(ctx, '#2a1238', bx - 1, by - 1, bw + 2, 5); ctx.globalAlpha = 1;
        R(ctx, '#5b2a86', bx, by, bw, 3);
        R(ctx, '#ff8fb1', bx, by, Math.round(bw * prog), 3);
        ctx.drawImage(Sp.corazonMini('#ffffff'), bx + Math.round(bw * prog) - 2, by - 1);
      }
      // banner de nivel
      if (this.intro) {
        const it = this.intro, D = window.DATOS;
        const rec = D.recuerdos[this.idx];
        const l1 = esFinal ? 'NIVEL FINAL' : 'NIVEL ' + (this.idx + 1);
        const l2 = rec ? rec.titulo : D.final.subtitulo;
        const l3 = rec ? rec.lugar : D.titulo;
        const w = Math.max(F.medir(l2), F.medir(l3), F.medir(l1)) + 18, h = 36;
        const slide = it.t < 0.35 ? (1 - it.t / 0.35) : (it.ttl - it.t < 0.4 ? 1 - (it.ttl - it.t) / 0.4 : 0);
        const x = Math.round(W / 2 - w / 2), y = Math.round(16 - slide * 50);
        ctx.globalAlpha = 0.8; R(ctx, '#2a1238', x + 1, y, w - 2, h); R(ctx, '#2a1238', x, y + 1, w, h - 2); ctx.globalAlpha = 1;
        R(ctx, '#ffd36e', x + 1, y, w - 2, 1); R(ctx, '#ffd36e', x + 1, y + h - 1, w - 2, 1);
        F.dibujar(ctx, l1, W / 2, y + 4, { color: '#ffd36e', alinear: 'centro' });
        F.dibujar(ctx, l2, W / 2, y + 15, { color: '#fff1e0', alinear: 'centro' });
        F.dibujar(ctx, l3, W / 2, y + 26, { color: '#e3b4f0', alinear: 'centro' });
      }
      // avisos
      const ts = this.toasts;
      for (let i = 0; i < ts.length; i++) {
        const tt = ts[i], w = F.medir(tt.texto) + 14, h = 15;
        const a = tt.t < 0.2 ? tt.t / 0.2 : (tt.ttl - tt.t < 0.35 ? (tt.ttl - tt.t) / 0.35 : 1);
        const x = Math.round(W / 2 - w / 2), y = Math.max(40, H - ALTO_MUNDO + 62) + i * 18;
        ctx.globalAlpha = 0.85 * a; R(ctx, '#2a1238', x + 1, y, w - 2, h); R(ctx, '#2a1238', x, y + 1, w, h - 2);
        ctx.globalAlpha = a; R(ctx, tt.color, x + 1, y, w - 2, 1); R(ctx, tt.color, x + 1, y + h - 1, w - 2, 1);
        F.dibujar(ctx, tt.texto, W / 2, y + 4, { color: tt.color, alinear: 'centro' });
        ctx.globalAlpha = 1;
      }
    }
  };

  App.Motor = M;
})(window.App = window.App || {});
