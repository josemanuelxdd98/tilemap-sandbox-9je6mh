/* ==========================================================================
   NIVELES: un mapa por recuerdo (8) + nivel final (9).
   Cada nivel se arma con un "constructor" (suelo, plataformas, corazones,
   decorado, metas...). Dificultad MUY fácil: huecos de 2 tiles, escalones
   de 1 tile, sin enemigos. Si cae, reaparece al inicio del nivel.
   Coordenadas en tiles de 16 px. Filas 0-10; el suelo normal empieza en la fila 9.
   ========================================================================== */
(function (App) {
  'use strict';
  const TAM = 16, FILAS = 11;
  const T_TOP = 1, T_CUERPO = 2, T_BLOQUE = 3, T_PLAT = 4;

  /* Constructor de niveles */
  function Constructor(ancho) {
    this.ancho = ancho;
    this.g = new Uint8Array(ancho * FILAS);
    this.corazones = []; this.decos = []; this.npcs = []; this.recuerdos = [];
    this.platanoPos = null; this.notaPos = null; this.inicioX = 3; this.metaDef = null;
  }
  Constructor.prototype = {
    suelo: function (x0, x1, top) {
      top = top === undefined ? 9 : top;
      for (let x = x0; x < x1; x++) {
        for (let y = 0; y < FILAS; y++) this.g[y * this.ancho + x] = 0;
        for (let y = top; y < FILAS; y++) this.g[y * this.ancho + x] = (y === top ? T_TOP : T_CUERPO);
      }
    },
    bloque: function (x, y, w, h) {
      w = w || 1; h = h || 1;
      for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) this.g[(y + j) * this.ancho + x + i] = T_BLOQUE;
    },
    plat: function (x, y, w) {
      for (let i = 0; i < w; i++) if (!this.g[y * this.ancho + x + i]) this.g[y * this.ancho + x + i] = T_PLAT;
    },
    platGlobos: function (x, y, w, colores) {
      this.plat(x, y, w);
      this.deco('globos', x + w / 2, { opts: { colores: colores, n: Math.max(2, Math.min(4, w)) }, y: y - 0.1, flota: 1.5, fase: x });
    },
    /* corazones (x,y = centro en tiles) */
    corazon: function (x, y) { this.corazones.push([x, y]); },
    hilera: function (x, y, n, paso) { paso = paso || 1; for (let i = 0; i < n; i++) this.corazon(x + i * paso, y); },
    arco: function (x, y, n, ancho, alto) {
      for (let i = 0; i < n; i++) { const t = n === 1 ? 0.5 : i / (n - 1); this.corazon(x + ancho * t, y - alto * 4 * t * (1 - t)); }
    },
    platano: function (x, y) { this.platanoPos = [x, y]; },
    nota: function (x, y) { this.notaPos = [x, y]; },
    recuerdo: function (i, x, y) { this.recuerdos.push([i, x, y]); },
    inicio: function (x) { this.inicioX = x; },

    /* altura (px) de la primera superficie sólida en una columna */
    supY: function (x) {
      const cx = Math.max(0, Math.min(this.ancho - 1, Math.floor(x)));
      for (let y = 0; y < FILAS; y++) { const t = this.g[y * this.ancho + cx]; if (t === T_TOP || t === T_BLOQUE) return y * TAM; }
      return null;
    },

    /* decorado. x en tiles (centro). o: {opts, capa:'atras'|'frente', y (fila base), dy, flota, fase} */
    deco: function (clave, x, o) {
      o = o || {};
      let y = o.y !== undefined ? o.y * TAM : this.supY(x);
      if (y === null) { return; }                    // sin suelo: no se coloca
      this.decos.push({ clave: clave, opts: o.opts || {}, x: x * TAM, y: y + (o.dy || 0), capa: o.capa || 'atras', flota: o.flota || 0, fase: o.fase || 0 });
    },
    aire: function (clave, x, y, o) { o = o || {}; o.y = y; this.deco(clave, x, o); },
    rolly: function (x) { const y = this.supY(x); if (y !== null) this.npcs.push({ tipo: 'rolly', x: x * TAM, y: y }); },
    lobo: function (x, fila) { this.npcs.push({ tipo: 'lobo', x: x * TAM, y: fila * TAM }); },
    mani: function (x) { const y = this.supY(x); if (y !== null) this.npcs.push({ tipo: 'mani', x: x * TAM, y: y }); },
    meta: function (tipo, x) { this.metaDef = { tipo: tipo, x: x }; }
  };

  /* Metas: qué se dibuja y cómo se celebra */
  const METAS = {
    escuela:  { estilo: 'entrar', decos: function (b, x) { b.deco('escuela', x); b.deco('bandera', x - 7.5); } },
    cafe:     { estilo: 'entrar', decos: function (b, x) { b.deco('cafe', x); } },
    cabana:   { estilo: 'feliz',  decos: function (b, x) { b.deco('cabana', x + 6, { opts: { navidad: true, noche: true } }); b.deco('mesaPastel', x, { opts: { tipo: 'mes', mantel: '#fff1e0', adorno: '#c43a4a' } }); b.deco('arbolNavidad', x - 6); } },
    cabanaNoche: { estilo: 'entrar', decos: function (b, x) { b.deco('fogata', x - 9); b.deco('cabana', x, { opts: { noche: true } }); } },
    palapa:   { estilo: 'feliz',  decos: function (b, x) { b.deco('palapa', x, { opts: { col: '#241a3a' } }); } },
    arco:     { estilo: 'entrar', decos: function (b, x) { b.deco('arco', x); } },
    cumple:   { estilo: 'feliz',  decos: function (b, x) { b.deco('mesaPastel', x, { opts: { tipo: 'cumple', mantel: '#fff1e0', adorno: '#8e4fc7' } }); b.deco('globos', x - 6, { opts: { colores: ['#8e4fc7', '#c9a3ee', '#ff8fb1'], n: 3 }, flota: 1.2 }); b.deco('globos', x + 6, { opts: { colores: ['#8e4fc7', '#ffd36e', '#c9a3ee'], n: 3 }, flota: 1.2, fase: 2 }); } },
    chocolate: { estilo: 'feliz', decos: function (b, x) { b.deco('mesaPastel', x, { opts: { tipo: 'chocolate', mantel: '#2f8a4a', adorno: '#fff1e0' } }); } },
    mani:     { estilo: 'mani',   decos: function () {} }
  };

  /* ====================================================================
     DEFINICIÓN DE LOS NIVELES
     ==================================================================== */
  const DEFS = [
    /* ---------- 1. La Sombra: el camino largo hasta la escuelita ---------- */
    { tema: 'sierra', ancho: 120, construir: function (b) {
      b.inicio(9);
      b.suelo(0, 20); b.suelo(22, 34); b.suelo(34, 38, 8); b.suelo(38, 50); b.suelo(52, 58);
      b.suelo(58, 63, 8); b.suelo(63, 68, 7); b.suelo(68, 73, 8); b.suelo(73, 120);
      b.plat(86, 7, 3); b.plat(90, 5, 3);
      // corazones
      b.hilera(6, 7.5, 4, 1.5); b.arco(18, 7.5, 5, 6, 1.8); b.hilera(26, 7.5, 3, 2);
      b.hilera(34.5, 6.5, 3, 1); b.hilera(42, 7.5, 3, 2); b.arco(48, 7.5, 5, 6, 1.8);
      b.corazon(59.5, 6.5); b.corazon(64.5, 5.5); b.corazon(69.5, 6.5); b.hilera(77, 7.5, 3, 2);
      b.hilera(86.5, 5.5, 3, 1); b.hilera(90.5, 3.5, 2, 1.5); b.hilera(98, 7.5, 4, 2); b.hilera(106, 7.5, 3, 2);
      b.platano(91.5, 3.4);
      // decorado
      b.deco('letrero', 15, { opts: { texto: 'LA SOMBRA' } });
      b.deco('pino', 3, { opts: { alto: 64 } }); b.deco('pino', 19, { opts: { alto: 72 } }); b.deco('pino', 29, { opts: { alto: 60 } });
      b.deco('arbolDesnudo', 31, { opts: { alto: 72 } }); b.deco('pino', 45, { opts: { alto: 64 } }); b.deco('arbolDesnudo', 40, { opts: { alto: 66, semilla: 9 } });
      b.deco('arbolDesnudo', 56, { opts: { alto: 64, semilla: 7 } }); b.deco('pino', 80, { opts: { alto: 70 } }); b.deco('pino', 94, { opts: { alto: 66 } }); b.deco('pino', 97, { opts: { alto: 60 } });
      [9, 25, 44, 54, 78, 99].forEach(function (x, i) { b.deco('arbusto', x, { opts: { w: 28, h: 16, flor: '#ffd84a' }, capa: i % 2 ? 'frente' : 'atras' }); });
      [12, 14, 60, 62].forEach(function (x) { b.deco('cerca', x, { opts: { w: 32 } }); });
      [8, 27, 47, 75, 102].forEach(function (x) { b.deco('flores', x, { opts: { colores: ['#ffd84a', '#fff1e0', '#ffd84a'], semilla: x } }); });
      [24, 54, 70].forEach(function (x) { b.deco('piedra', x, { opts: { w: 22, h: 13 } }); });
      b.deco('letrero', 76, { opts: { texto: 'ESCUELA →' } });
      b.meta('escuela', 112);
    } },

    /* ---------- 2. Coatepec: primera cita, balcones y toldos ---------- */
    { tema: 'coatepec', ancho: 112, construir: function (b) {
      b.inicio(9);
      b.suelo(0, 112);
      b.plat(14, 7, 3); b.plat(19, 6, 3); b.plat(24, 5, 3); b.plat(29, 6, 3);
      b.plat(33, 5, 2); b.plat(36, 4, 2);
      b.bloque(42, 8, 1, 1); b.bloque(43, 7, 1, 2); b.bloque(44, 6, 1, 3); b.bloque(45, 7, 1, 2); b.bloque(46, 8, 1, 1);
      b.plat(52, 7, 3); b.plat(57, 6, 3); b.plat(62, 7, 3); b.plat(67, 5, 4); b.plat(73, 7, 3); b.plat(78, 6, 3);
      // corazones
      b.hilera(6, 7.5, 4, 1.5); b.hilera(14.5, 5.5, 2, 1); b.hilera(19.5, 4.5, 2, 1); b.hilera(24.5, 3.5, 2, 1); b.hilera(29.5, 4.5, 2, 1);
      b.corazon(33.5, 3.5); b.corazon(36.5, 2.5);
      b.hilera(38, 7.5, 2, 2); b.corazon(44.5, 4.5); b.hilera(48, 7.5, 3, 1.5);
      b.hilera(52.5, 5.5, 2, 1); b.hilera(57.5, 4.5, 2, 1); b.hilera(62.5, 5.5, 2, 1); b.hilera(67.5, 3.5, 3, 1);
      b.hilera(73.5, 5.5, 2, 1); b.hilera(78.5, 4.5, 2, 1); b.hilera(84, 7.5, 4, 2); b.hilera(94, 7.5, 3, 2);
      b.platano(36.5, 2.2);
      b.nota(60, 2.8);
      // decorado
      [8, 26, 48, 72, 92].forEach(function (x) { b.deco('farol', x); });
      [12, 35, 59, 84, 98].forEach(function (x) { b.deco('maceta', x); });
      b.deco('banca', 20); b.deco('banca', 66);
      b.aire('guirnalda', 14, 3.2, { opts: { w: 96 } }); b.aire('guirnalda', 64, 3.4, { opts: { w: 112 } });
      b.aire('banderines', 40, 2.5, { opts: { w: 128, colores: ['#8e4fc7', '#ffd36e', '#ff8fb1', '#fff1e0'] } });
      b.aire('banderines', 88, 2.6, { opts: { w: 128, colores: ['#ff8fb1', '#c9a3ee', '#ffd36e', '#fff1e0'] } });
      b.deco('letrero', 88, { opts: { texto: 'CAFÉ →' } });
      [18, 56].forEach(function (x) { b.deco('flores', x, { opts: { semilla: x } }); });
      b.meta('cafe', 104);
    } },

    /* ---------- 3. La Joya: casa de los abuelos, Navidad, primer mes ---------- */
    { tema: 'joya', ancho: 112, construir: function (b) {
      b.inicio(9);
      b.suelo(0, 26); b.suelo(28, 56); b.suelo(56, 60, 8); b.suelo(60, 64, 7); b.suelo(64, 68, 8); b.suelo(68, 112);
      b.bloque(10, 8, 2, 1); b.bloque(11, 7, 1, 1);
      b.bloque(38, 8, 1, 1); b.bloque(39, 7, 1, 2);
      b.plat(16, 6, 3); b.plat(24, 7, 5); b.plat(32, 7, 3); b.plat(37, 5, 3); b.plat(44, 7, 3); b.plat(49, 5, 3);
      b.plat(74, 7, 3); b.plat(79, 5, 3); b.plat(84, 7, 3);
      // corazones
      b.hilera(5, 7.5, 3, 1.5); b.corazon(11.5, 5.5); b.hilera(16.5, 4.5, 2, 1); b.arco(21, 7.5, 5, 6, 2.5);
      b.hilera(32.5, 5.5, 2, 1); b.corazon(39.5, 5.5); b.hilera(37.5, 3.5, 2, 1);
      b.hilera(44.5, 5.5, 2, 1); b.hilera(49.5, 3.5, 3, 1); b.corazon(57.5, 6.5); b.corazon(61.5, 5.5); b.corazon(65.5, 6.5);
      b.hilera(70, 7.5, 3, 1.5); b.hilera(74.5, 5.5, 2, 1); b.hilera(79.5, 3.5, 2, 1); b.hilera(84.5, 5.5, 2, 1); b.hilera(90, 7.5, 3, 2);
      b.platano(50.5, 2);
      // decorado
      b.deco('arbolNavidad', 8); b.deco('cascanueces', 16); b.deco('cascanueces', 34);
      [6, 20, 44, 58, 88].forEach(function (x) { b.deco('nochebuena', x); });
      [2, 30, 48, 80].forEach(function (x, i) { b.deco('pino', x, { opts: { alto: 60 + i * 4, col: '#1d4a46', luz: '#2c6a5a' } }); });
      b.aire('guirnalda', 30, 3.6, { opts: { w: 112 } }); b.aire('guirnalda', 84, 3.4, { opts: { w: 112 } });
      b.deco('regalo', 52, { opts: { col: '#c43a4a' } }); b.deco('regalo', 53, { opts: { col: '#2f8a4a' } });
      b.rolly(76);
      b.meta('cabana', 98);
    } },

    /* ---------- 4. La Sombra de noche: primera noche juntos ---------- */
    { tema: 'noche', ancho: 112, construir: function (b) {
      b.inicio(9);
      b.suelo(0, 18); b.suelo(20, 34); b.suelo(36, 52); b.suelo(52, 60, 7); b.suelo(60, 64, 8); b.suelo(64, 84); b.suelo(86, 112);
      b.plat(8, 7, 3); b.plat(13, 6, 3); b.plat(22, 7, 3); b.plat(27, 5, 3); b.plat(40, 7, 3); b.plat(45, 5, 3);
      b.plat(53, 4, 3); b.plat(70, 7, 3); b.plat(75, 5, 3);
      // corazones
      b.hilera(5, 7.5, 3, 1.5); b.hilera(8.5, 5.5, 2, 1); b.hilera(13.5, 4.5, 2, 1); b.arco(16, 7.5, 5, 6, 1.8);
      b.hilera(22.5, 5.5, 2, 1); b.hilera(27.5, 3.5, 2, 1); b.hilera(30, 7.5, 2, 2);
      b.arco(33, 7.5, 5, 6, 1.8); b.hilera(40.5, 5.5, 2, 1); b.hilera(45.5, 3.5, 3, 1);
      b.hilera(53, 5.5, 3, 1.5); b.hilera(58, 6.5, 2, 2); b.hilera(65, 7.5, 3, 1.5);
      b.hilera(70.5, 5.5, 2, 1); b.hilera(75.5, 3.5, 2, 1); b.arco(82, 7.5, 5, 6, 1.8); b.hilera(90, 7.5, 3, 2);
      b.platano(54.5, 2.3);
      // decorado (colores de noche)
      const pn = { col: '#171a40', luz: '#262c60' };
      [4, 14, 30, 41, 48, 66, 78, 90, 96].forEach(function (x, i) { b.deco('pino', x, { opts: { alto: 56 + (i % 3) * 8, col: pn.col, luz: pn.luz } }); });
      [10, 24, 36, 62, 88].forEach(function (x) { b.deco('arbusto', x, { opts: { w: 26, h: 14, col: '#1d3a4a', luz: '#2f5a6a', flor: '#fff3a0' } }); });
      [18, 74].forEach(function (x) { b.deco('piedra', x, { opts: { w: 22, h: 13, col: '#3a3460', som: '#262048', luz: '#5a5088' } }); });
      b.deco('rocaLobo', 56, { dy: 0 });
      b.lobo(56, 5.3);
      b.meta('cabanaNoche', 104);
    } },

    /* ---------- 5. Acajete: primer San Valentín al atardecer ---------- */
    { tema: 'acajete', ancho: 112, construir: function (b) {
      b.inicio(9);
      b.suelo(0, 14); b.suelo(14, 20, 8); b.suelo(20, 26, 7); b.suelo(26, 32, 8); b.suelo(32, 36);
      b.suelo(38, 50); b.suelo(50, 56, 8); b.suelo(56, 62, 7); b.suelo(62, 112, 8);
      b.bloque(5, 8, 1, 1); b.bloque(6, 7, 1, 2);
      b.plat(33, 6, 3); b.plat(41, 7, 3); b.plat(46, 5, 3); b.plat(66, 6, 3); b.plat(71, 4, 3);
      // corazones (San Valentín: ¡muchos!)
      b.corazon(6.5, 5.5); b.hilera(10, 7.5, 3, 1.5); b.corazon(16.5, 6.5); b.corazon(22.5, 5.5); b.corazon(28.5, 6.5);
      b.arco(31, 6.5, 5, 7, 2.5); b.hilera(33.5, 4.5, 2, 1);
      b.hilera(41.5, 5.5, 2, 1); b.hilera(46.5, 3.5, 3, 1); b.hilera(52, 6.5, 3, 1.5); b.hilera(57, 5.5, 3, 1.5);
      b.hilera(64, 6.5, 2, 1.5); b.hilera(66.5, 4.5, 2, 1); b.hilera(71.5, 2.5, 2, 1);
      b.hilera(76, 6.5, 3, 2); b.hilera(86, 6.5, 3, 2); b.hilera(94, 6.5, 3, 2);
      b.platano(72.5, 1.9);
      b.nota(48, 1.8);
      // decorado
      [12, 18, 29, 53].forEach(function (x) { b.deco('poste', x, { opts: { col: '#241a3a', luz: '#c0687a' } }); });
      [16, 44, 80].forEach(function (x) { b.deco('cerca', x, { opts: { w: 32, poste: '#241a3a', alambre: '#6a4a7a' } }); });
      b.deco('torre', 40, { opts: { col: '#241a3a' } });
      b.aire('globoCorazon', 18, 6.2, { flota: 2.5 }); b.aire('globoCorazon', 24, 4.8, { flota: 2.5, fase: 1.5, opts: { col: '#ff8fb1' } });
      b.aire('globoCorazon', 58, 5.2, { flota: 2.5, fase: 3 }); b.aire('globoCorazon', 84, 4.6, { flota: 2.5, fase: 2, opts: { col: '#ff8fb1' } });
      b.rolly(78);
      b.meta('palapa', 102);
    } },

    /* ---------- 6. Puebla: el primer gran viaje ---------- */
    { tema: 'puebla', ancho: 116, construir: function (b) {
      b.inicio(10);
      b.suelo(0, 38); b.suelo(40, 70); b.suelo(70, 74, 8); b.suelo(74, 116);
      b.bloque(18, 8, 1, 1); b.bloque(19, 7, 1, 2); b.bloque(20, 8, 1, 1);
      b.bloque(52, 8, 2, 1); b.bloque(53, 7, 1, 1);
      b.plat(26, 7, 3); b.plat(31, 5, 3); b.plat(38, 7, 3); b.plat(44, 6, 3); b.plat(48, 4, 3); b.plat(60, 7, 3); b.plat(65, 5, 3);
      b.plat(80, 7, 3); b.plat(85, 5, 3); b.plat(90, 7, 3);
      // corazones
      b.hilera(14, 7.5, 3, 1.5); b.corazon(19.5, 5.5); b.hilera(26.5, 5.5, 2, 1); b.hilera(31.5, 3.5, 2, 1); b.arco(35, 7.5, 5, 6, 2.5);
      b.hilera(44.5, 4.5, 2, 1); b.hilera(48.5, 2.5, 3, 1); b.hilera(52.5, 5.5, 2, 1); b.hilera(60.5, 5.5, 2, 1); b.hilera(65.5, 3.5, 3, 1);
      b.corazon(71.5, 6.5); b.hilera(76, 7.5, 3, 1.5); b.hilera(80.5, 5.5, 2, 1); b.hilera(85.5, 3.5, 2, 1); b.hilera(90.5, 5.5, 2, 1); b.hilera(96, 7.5, 3, 2);
      b.platano(49.5, 1.7);
      // decorado
      b.deco('autobus', 6);
      [14, 40, 80, 100].forEach(function (x) { b.deco('farol', x); });
      [22, 50, 70, 92].forEach(function (x) { b.deco('maceta', x, { opts: { flores: ['#ff8fb1', '#ffd36e', '#b87ad0'] } }); });
      b.deco('letrero', 24, { opts: { texto: 'PUEBLA' } });
      [36, 66, 90].forEach(function (x) { b.deco('arbolRedondo', x, { opts: { alto: 70, col: '#a56ad0', luz: '#d29af0', tronco: '#6b4a30' } }); });
      b.aire('banderines', 30, 2.6, { opts: { w: 128, colores: ['#2f5fb5', '#f4f0e6', '#f2c230', '#ff8fb1'] } });
      b.aire('banderines', 84, 2.6, { opts: { w: 128, colores: ['#f2c230', '#2f5fb5', '#f4f0e6', '#b87ad0'] } });
      b.deco('banca', 58);
      b.meta('arco', 108);
    } },

    /* ---------- 7. La Joya otra vez: el cumpleaños de Ana ---------- */
    { tema: 'cumple', ancho: 116, construir: function (b) {
      b.inicio(9);
      b.suelo(0, 30); b.suelo(32, 56); b.suelo(56, 60, 8); b.suelo(60, 66); b.suelo(68, 116);
      b.bloque(12, 8, 1, 1); b.bloque(13, 8, 1, 1); b.bloque(13, 7, 1, 1);
      b.platGlobos(18, 7, 3, ['#8e4fc7', '#c9a3ee', '#ff8fb1']); b.platGlobos(23, 5, 3, ['#8e4fc7', '#ffd36e', '#c9a3ee']);
      b.platGlobos(29, 7, 4, ['#ff8fb1', '#8e4fc7', '#c9a3ee']);
      b.platGlobos(38, 7, 3, ['#8e4fc7', '#c9a3ee']); b.platGlobos(43, 5, 3, ['#ffd36e', '#8e4fc7', '#ff8fb1']);
      b.platGlobos(62, 7, 4, ['#8e4fc7', '#c9a3ee', '#ffd36e']);
      b.platGlobos(74, 7, 3, ['#8e4fc7', '#ff8fb1']); b.platGlobos(79, 5, 3, ['#c9a3ee', '#8e4fc7', '#ffd36e']); b.platGlobos(84, 7, 3, ['#8e4fc7', '#c9a3ee', '#ff8fb1']);
      // corazones
      b.hilera(5, 7.5, 3, 1.5); b.corazon(12.5, 5.5); b.hilera(18.5, 5.5, 2, 1); b.hilera(23.5, 3.5, 2, 1); b.hilera(29.5, 5.5, 3, 1);
      b.hilera(38.5, 5.5, 2, 1); b.hilera(43.5, 3.5, 2, 1); b.hilera(48, 7.5, 3, 2);
      b.corazon(57.5, 6.5); b.hilera(62.5, 5.5, 3, 1); b.arco(65, 7.5, 4, 4, 2);
      b.hilera(70, 7.5, 2, 2); b.hilera(74.5, 5.5, 2, 1); b.hilera(79.5, 3.5, 2, 1); b.hilera(84.5, 5.5, 2, 1); b.hilera(92, 7.5, 3, 2);
      b.platano(80.5, 1.9);
      // decorado
      b.aire('pancarta', 8, 4.4, { opts: { texto: '¡FELIZ CUMPLE!', col: '#8e4fc7' } });
      b.aire('banderines', 20, 2.4, { opts: { w: 128, colores: ['#8e4fc7', '#c9a3ee', '#ff8fb1', '#ffd36e'] } });
      b.aire('banderines', 56, 2.4, { opts: { w: 128, colores: ['#c9a3ee', '#8e4fc7', '#ffd36e', '#ff8fb1'] } });
      b.aire('banderines', 92, 2.4, { opts: { w: 128, colores: ['#ff8fb1', '#8e4fc7', '#ffd36e', '#c9a3ee'] } });
      [8, 10, 48, 50].forEach(function (x) { b.deco('cerca', x, { opts: { w: 32, tipo: 'madera', poste: '#6b4a30', luz: '#a8724a' } }); });
      b.deco('cabra', 40); b.deco('cabra', 54);
      [16, 34, 46, 70, 96].forEach(function (x) { b.deco('arbusto', x, { opts: { w: 26, h: 15, flor: '#ffe27a' } }); });
      [26, 58, 76].forEach(function (x) { b.deco('flores', x, { opts: { colores: ['#ffe27a', '#c9a3ee', '#ff8fb1'], semilla: x } }); });
      b.deco('regalo', 36, { opts: { col: '#c9a3ee' } }); b.deco('regalo', 37, { opts: { col: '#ff8fb1' } });
      b.rolly(88);
      b.meta('cumple', 108);
    } },

    /* ---------- 8. Emiliano Zapata: el cumpleaños de Mani ---------- */
    { tema: 'zapata', ancho: 112, construir: function (b) {
      b.inicio(9);
      b.suelo(0, 112);
      b.bloque(12, 8, 1, 1); b.bloque(13, 7, 1, 2); b.bloque(14, 8, 1, 1);
      b.bloque(46, 8, 1, 1); b.bloque(47, 7, 1, 2); b.bloque(48, 6, 1, 3); b.bloque(49, 7, 1, 2); b.bloque(50, 8, 1, 1);
      b.plat(18, 7, 3); b.plat(23, 6, 3); b.plat(28, 5, 3); b.plat(33, 7, 3); b.plat(38, 6, 3);
      b.plat(55, 7, 3); b.plat(60, 5, 3); b.plat(65, 7, 3); b.plat(70, 5, 3); b.plat(76, 7, 3);
      // corazones
      b.hilera(5, 7.5, 3, 1.5); b.corazon(13.5, 5.5); b.hilera(18.5, 5.5, 2, 1); b.hilera(23.5, 4.5, 2, 1); b.hilera(28.5, 3.5, 2, 1);
      b.hilera(33.5, 5.5, 2, 1); b.hilera(38.5, 4.5, 2, 1); b.hilera(42, 7.5, 2, 2); b.corazon(48.5, 4.5);
      b.hilera(55.5, 5.5, 2, 1); b.hilera(60.5, 3.5, 2, 1); b.hilera(65.5, 5.5, 2, 1); b.hilera(70.5, 3.5, 2, 1); b.hilera(76.5, 5.5, 2, 1);
      b.hilera(82, 7.5, 3, 2); b.hilera(92, 7.5, 3, 2);
      b.platano(29.5, 2.2);
      // decorado (interior)
      b.aire('pancarta', 9, 4.4, { opts: { texto: '¡FELIZ CUMPLE!', col: '#2f8a4a' } });
      b.aire('ventana', 24, 8.2, { capa: 'atras' }); b.aire('ventana', 58, 8.2); b.aire('ventana', 90, 8.2);
      b.aire('cuadro', 38, 6.8); b.aire('cuadro', 72, 6.8);
      b.aire('globos', 44, 8.6, { opts: { colores: ['#fff1e0', '#2f8a4a', '#d4283a'], n: 3 }, flota: 1.2, fase: 3 });
      b.aire('globos', 98, 8.6, { opts: { colores: ['#d4283a', '#fff1e0', '#2f8a4a'], n: 3 }, flota: 1.2, fase: 5 });
      b.aire('banderines', 16, 2.6, { opts: { w: 128, estilo: 'picado', colores: ['#2f8a4a', '#fff1e0', '#d4283a'] } });
      b.aire('banderines', 52, 2.6, { opts: { w: 128, estilo: 'picado', colores: ['#d4283a', '#2f8a4a', '#fff1e0'] } });
      b.aire('banderines', 88, 2.6, { opts: { w: 128, estilo: 'picado', colores: ['#fff1e0', '#d4283a', '#2f8a4a'] } });
      b.deco('globos', 8, { opts: { colores: ['#2f8a4a', '#fff1e0', '#d4283a'], n: 3 }, flota: 1.2 });
      b.deco('globos', 64, { opts: { colores: ['#d4283a', '#2f8a4a', '#fff1e0'], n: 3 }, flota: 1.2, fase: 1 });
      b.deco('silla', 30); b.deco('silla', 31.2); b.deco('silla', 80); b.deco('balon', 26); b.deco('balon', 86);
      b.rolly(70);
      b.meta('chocolate', 104);
    } },

    /* ---------- 9. Final: el reencuentro ---------- */
    { tema: 'final', ancho: 120, construir: function (b) {
      b.inicio(9);
      b.suelo(0, 120);
      b.bloque(30, 8, 1, 1); b.bloque(31, 7, 1, 2); b.bloque(32, 8, 1, 1);
      b.bloque(70, 8, 1, 1); b.bloque(71, 7, 1, 2); b.bloque(72, 8, 1, 1);
      b.plat(18, 7, 3); b.plat(23, 6, 3); b.plat(44, 7, 3); b.plat(49, 6, 3); b.plat(54, 5, 3); b.plat(76, 7, 3); b.plat(81, 6, 3); b.plat(86, 5, 3);
      // camino de recuerdos: 8 íconos en orden
      [[0, 10, 7.3], [1, 20, 5.4], [2, 31.5, 5.6], [3, 48, 6.8], [4, 55, 3.8], [5, 65, 7.3], [6, 78, 5.8], [7, 88, 3.8]].forEach(function (r) { b.recuerdo(r[0], r[1], r[2]); });
      b.hilera(5, 7.5, 3, 1.5); b.hilera(15, 7.5, 2, 2); b.hilera(18.5, 5.5, 2, 1); b.hilera(23.5, 4.5, 2, 1); b.hilera(36, 7.5, 3, 2);
      b.hilera(44.5, 5.5, 2, 1); b.hilera(49.5, 4.5, 2, 1); b.hilera(60, 7.5, 3, 2); b.hilera(70.5, 5.5, 2, 1);
      b.hilera(76.5, 5.5, 2, 1); b.hilera(81.5, 4.5, 2, 1); b.hilera(92, 7.5, 3, 1.5); b.hilera(98, 7.5, 4, 2);
      b.nota(62, 6);
      // decorado
      b.aire('guirnalda', 24, 3.4, { opts: { w: 128 } }); b.aire('guirnalda', 64, 3.4, { opts: { w: 128 } }); b.aire('guirnalda', 100, 3.4, { opts: { w: 128 } });
      for (let x = 6; x < 100; x += 8) b.deco('flores', x, { opts: { colores: ['#ff8fb1', '#ffd36e', '#c9a3ee', '#fff1e0'], semilla: x } });
      b.deco('banca', 52); b.deco('banca', 38);
      b.deco('arbolGrande', 116);
      b.rolly(106);
      b.mani(111);
      b.meta('mani', 111);
    } }
  ];

  /* ====================================================================
     COMPILAR un nivel a su forma final (px) y VERIFICAR que se puede pasar
     ==================================================================== */
  function crear(idx) {
    const def = DEFS[idx], b = new Constructor(def.ancho);
    def.construir(b);
    const mt = METAS[b.metaDef.tipo];
    mt.decos(b, b.metaDef.x);
    const P = App.Props;
    const ancho = def.ancho;
    const supInicio = b.supY(b.inicioX);
    const nv = {
      idx: idx, tema: def.tema, ancho: ancho, alto: FILAS, g: b.g,
      corazones: b.corazones.map(function (c, i) { return { x: c[0] * TAM, y: c[1] * TAM, tomado: false, id: i }; }),
      platano: b.platanoPos ? { x: b.platanoPos[0] * TAM, y: b.platanoPos[1] * TAM, tomado: false } : null,
      nota: b.notaPos ? { x: b.notaPos[0] * TAM, y: b.notaPos[1] * TAM, tomado: false } : null,
      recuerdos: b.recuerdos.map(function (r) { return { i: r[0], x: r[1] * TAM, y: r[2] * TAM, tomado: false }; }),
      decos: b.decos.map(function (d) {
        const prop = P.crear(d.clave, d.opts);
        return { prop: prop, x: d.x, y: d.y, capa: d.capa, flota: d.flota, fase: d.fase };
      }),
      npcs: b.npcs,
      inicio: { x: b.inicioX * TAM, y: supInicio },
      meta: { tipo: b.metaDef.tipo, estilo: mt.estilo, x: b.metaDef.x * TAM, y: b.supY(b.metaDef.x) }
    };
    nv.decos.sort(function (a, c) { return a.x - c.x; });
    return nv;
  }

  /* ----- verificador: ¿se puede llegar a la meta y a los corazones? ----- */
  function verificar(idx) {
    const nv = crear(idx), W = nv.ancho, g = nv.g, problemas = [];
    function t(x, y) { return (x < 0 || x >= W || y < 0 || y >= FILAS) ? 0 : g[y * W + x]; }
    // superficies por columna: tile sólido/plataforma con aire encima
    const segs = [];
    for (let y = 0; y < FILAS; y++) {
      let ini = -1;
      for (let x = 0; x <= W; x++) {
        const hay = x < W && t(x, y) !== 0 && t(x, y - 1) === 0;
        if (hay && ini < 0) ini = x;
        if (!hay && ini >= 0) { segs.push({ row: y, x0: ini, x1: x - 1 }); ini = -1; }
      }
    }
    function maxHueco(dy) { // dy>0: destino más alto (tiles)
      if (dy <= 1) return 3; if (dy === 2) return 2; if (dy === 3) return 1; return -1;
    }
    function ok(a, b) {
      const gap = Math.max(0, b.x0 - a.x1 - 1, a.x0 - b.x1 - 1);
      const dy = a.row - b.row;
      if (dy > 3) return false;
      return gap <= maxHueco(dy);
    }
    const ini = segs.find(function (s) { const x = Math.floor(nv.inicio.x / TAM); return x >= s.x0 && x <= s.x1 && s.row * TAM === nv.inicio.y; });
    if (!ini) { problemas.push('sin superficie bajo el inicio'); return { idx: idx, problemas: problemas }; }
    const vis = new Set([ini]), cola = [ini];
    while (cola.length) {
      const a = cola.shift();
      segs.forEach(function (b) { if (!vis.has(b) && ok(a, b)) { vis.add(b); cola.push(b); } });
    }
    const mx = Math.floor(nv.meta.x / TAM);
    const alcanzaMeta = Array.from(vis).some(function (s) { return mx >= s.x0 && mx <= s.x1 && s.row * TAM === nv.meta.y; });
    if (!alcanzaMeta) problemas.push('la meta no es alcanzable');
    // corazones y extras
    function alcanzable(px, py) {
      const hx = px / TAM, hy = py / TAM;
      return Array.from(vis).some(function (s) { return hx >= s.x0 - 2 && hx <= s.x1 + 3 && (s.row - hy) >= 0.4 && (s.row - hy) <= 3.4; });
    }
    nv.corazones.forEach(function (c) { if (!alcanzable(c.x, c.y)) problemas.push('corazón inalcanzable en (' + (c.x / TAM).toFixed(1) + ',' + (c.y / TAM).toFixed(1) + ')'); });
    if (nv.platano && !alcanzable(nv.platano.x, nv.platano.y)) problemas.push('plátano inalcanzable');
    if (nv.nota && !alcanzable(nv.nota.x, nv.nota.y)) problemas.push('nota inalcanzable');
    nv.recuerdos.forEach(function (r) { if (!alcanzable(r.x, r.y)) problemas.push('recuerdo ' + r.i + ' inalcanzable'); });
    // corazones dentro de tiles sólidos
    nv.corazones.forEach(function (c) { if (t(Math.floor(c.x / TAM), Math.floor(c.y / TAM)) === T_TOP || t(Math.floor(c.x / TAM), Math.floor(c.y / TAM)) === T_CUERPO || t(Math.floor(c.x / TAM), Math.floor(c.y / TAM)) === T_BLOQUE) problemas.push('corazón dentro de un tile en (' + (c.x / TAM).toFixed(1) + ',' + (c.y / TAM).toFixed(1) + ')'); });
    return { idx: idx, problemas: problemas, corazones: nv.corazones.length, segmentos: segs.length };
  }

  App.Niveles = {
    TAM: TAM, FILAS: FILAS, T_TOP: T_TOP, T_CUERPO: T_CUERPO, T_BLOQUE: T_BLOQUE, T_PLAT: T_PLAT,
    total: DEFS.length, crear: crear, verificar: verificar, tema: function (i) { return DEFS[i].tema; }
  };
})(window.App = window.App || {});
