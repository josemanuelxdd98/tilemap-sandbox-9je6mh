/* ==========================================================================
   SPRITES: personajes (Ana, Mani, Rolly), objetos y partículas.
   Todo se dibuja con código (rectángulos de 1 píxel) en lienzos pequeños que
   se guardan en memoria y luego se amplían sin suavizado.
   ========================================================================== */
(function (App) {
  'use strict';

  // Paleta cálida basada en el morado (su color favorito)
  const PAL = {
    ciruela: '#2a1238', ciruela2: '#3d1d52', uva: '#5b2a86', morado: '#8e4fc7', violeta: '#a66bd6',
    lavanda: '#c9a3ee', orquidea: '#e3b4f0', rosa: '#ff8fb1', rosaFuerte: '#ff5d8a', coral: '#ff6f7d',
    durazno: '#ffc29a', crema: '#fff1e0', oro: '#ffd36e', ambar: '#ffae42', naranja: '#ff8a3d',
    blanco: '#ffffff', tinta: '#1c0f2b'
  };
  App.PAL = PAL;

  function lienzo(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    return [c, x];
  }
  App.lienzo = lienzo;

  // Agrega un contorno de 1 px alrededor de lo opaco (devuelve un lienzo 2 px más grande)
  function contorno(src, color) {
    const w = src.width, h = src.height;
    const d = src.getContext('2d').getImageData(0, 0, w, h).data;
    const o = lienzo(w + 2, h + 2), c = o[0], x = o[1];
    const op = function (px, py) { return px >= 0 && py >= 0 && px < w && py < h && d[(py * w + px) * 4 + 3] > 8; };
    x.fillStyle = color;
    for (let y = -1; y <= h; y++) {
      for (let xx = -1; xx <= w; xx++) {
        if (!op(xx, y) && (op(xx - 1, y) || op(xx + 1, y) || op(xx, y - 1) || op(xx, y + 1))) x.fillRect(xx + 1, y + 1, 1, 1);
      }
    }
    x.drawImage(src, 1, 1);
    return c;
  }
  App.contorno = contorno;

  // Construye un sprite a partir de filas de texto + paleta de letras
  function desdeFilas(filas, paleta) {
    const h = filas.length, w = filas[0].length;
    const o = lienzo(w, h), c = o[0], x = o[1];
    for (let y = 0; y < h; y++) {
      for (let xx = 0; xx < w; xx++) {
        const ch = filas[y][xx];
        if (ch !== '.' && ch !== ' ' && paleta[ch]) { x.fillStyle = paleta[ch]; x.fillRect(xx, y, 1, 1); }
      }
    }
    return c;
  }
  App.desdeFilas = desdeFilas;

  /* ------------------------------------------------------------------
     POSES  (dx, dy) de piernas y brazos. A = lado de atrás, F = de frente
     ------------------------------------------------------------------ */
  const POSES = {
    idle0:  { by: 0, pelo: 0,  piA: [0, 0],  piF: [0, 0],   brA: [0, 0],   brF: [0, 0] },
    idle1:  { by: 1, pelo: 0,  piA: [0, 0],  piF: [0, 0],   brA: [0, 0],   brF: [0, 0] },
    corre0: { by: 0, pelo: -1, piA: [-2, 0], piF: [2, 0],   brA: [1, -1],  brF: [-1, 0] },
    corre1: { by: 1, pelo: 0,  piA: [0, 0],  piF: [0, -2],  brA: [0, 0],   brF: [0, 0] },
    corre2: { by: 0, pelo: -1, piA: [2, 0],  piF: [-2, 0],  brA: [-1, 0],  brF: [1, -1] },
    corre3: { by: 1, pelo: 0,  piA: [0, -2], piF: [0, 0],   brA: [0, 0],   brF: [0, 0] },
    salto:  { by: 0, pelo: 1,  piA: [-1, -2], piF: [2, -3], brA: [-1, -3], brF: [1, -4] },
    caida:  { by: 0, pelo: 1,  piA: [-1, 0], piF: [1, -1],  brA: [-1, -2], brF: [1, -2] },
    feliz:  { by: 0, pelo: 1,  piA: [-1, -1], piF: [1, -2], brA: [-1, -5], brF: [1, -5] }
  };

  function pintor(x) {
    return function (col, px, py, w, h) { x.fillStyle = col; x.fillRect(px, py, w || 1, h || 1); };
  }

  // Piernas + zapatos (compartido). ancho = 2 (Ana) o 3 (Mani)
  function piernas(P, c, p, izq, der, ancho) {
    const li = p.piA, ld = p.piF;
    // pierna de atrás
    P(c.pantalon, izq + li[0], 20 + li[1], ancho, 3);
    P(c.pantalon, der + ld[0], 20 + ld[1], ancho, 3);
    // zapatos (punta hacia la derecha)
    P(c.zapato, izq + li[0] - 1, 22 + li[1], ancho + 2, 2);
    P(c.suela, izq + li[0] - 1, 23 + li[1], ancho + 2, 1);
    P(c.zapato, der + ld[0] - 1, 22 + ld[1], ancho + 2, 2);
    P(c.suela, der + ld[0] - 1, 23 + ld[1], ancho + 2, 1);
  }

  /* ---------------- ANA: cabello largo-medio, sudadera morada ---------------- */
  function dibujarAna(x, c, p) {
    const P = pintor(x), by = p.by, pe = p.pelo;
    const largo = c.largoPelo === 'corto' ? 0 : 1;
    // mechones laterales (detrás del cuerpo)
    P(c.pelo, 2, 6 + by, 2, 5);
    P(c.pelo, 12, 6 + by, 2, 5);
    if (largo) {
      P(c.pelo, 2 + pe, 11 + by, 2, 4);
      P(c.pelo, 12 + (pe > 0 ? 0 : 0), 11 + by, 2, 3);
      P(c.peloLuz, 2 + pe, 12 + by, 1, 2);
    }
    // piernas
    piernas(P, c, p, 6, 9, 2);
    // torso (sudadera)
    P(c.ropa, 4, 13 + by, 8, 1);
    P(c.ropa, 5, 14 + by, 6, 5);
    P(c.ropaLuz, 5, 13 + by, 6, 1);
    P(c.ropaOsc, 5, 19 + by, 6, 1);
    // corazoncito en la sudadera
    P(PAL.rosa, 6, 15 + by); P(PAL.rosa, 8, 15 + by);
    P(PAL.rosa, 6, 16 + by, 3, 1); P(PAL.rosa, 7, 17 + by);
    // brazos
    P(c.ropaOsc, 3 + p.brA[0], 14 + by + p.brA[1], 2, 4);
    P(c.piel, 3 + p.brA[0], 18 + by + p.brA[1], 2, 1);
    P(c.ropa, 11 + p.brF[0], 14 + by + p.brF[1], 2, 4);
    P(c.piel, 11 + p.brF[0], 18 + by + p.brF[1], 2, 1);
    // cuello y cara
    P(c.pielSom, 7, 12 + by, 2, 1);
    P(c.piel, 4, 6 + by, 8, 5);
    P(c.piel, 5, 11 + by, 6, 1);
    // pelo superior y flequillo
    P(c.pelo, 5, 1 + by, 6, 1);
    P(c.pelo, 4, 2 + by, 8, 1);
    P(c.pelo, 3, 3 + by, 10, 1);
    P(c.pelo, 2, 4 + by, 12, 2);
    P(c.pelo, 4, 6 + by, 2, 1);
    P(c.pelo, 10, 6 + by, 2, 1);
    P(c.peloLuz, 6, 2 + by, 3, 1);
    P(c.peloLuz, 4, 3 + by, 1, 1);
    // rostro
    P(c.ojo, 7, 7 + by, 1, 2);
    P(c.ojo, 10, 7 + by, 1, 2);
    P(PAL.blanco, 7, 7 + by);
    P(PAL.blanco, 10, 7 + by);
    P(c.rubor, 5, 9 + by);
    P(c.rubor, 11, 9 + by);
    P(c.boca, 8, 10 + by, 2, 1);
    if (c.lentes) {
      const f = '#7a5326', v = '#eef4fc';       // armazón fino de bronce + cristales claros
      P(v, 6, 7 + by, 1, 2); P(v, 9, 7 + by, 1, 2);
      P(f, 6, 6 + by, 2, 1); P(f, 9, 6 + by, 2, 1);
      P(f, 5, 7 + by, 1, 2); P(f, 8, 7 + by, 1, 2); P(f, 11, 7 + by, 1, 2);
      P(f, 6, 9 + by, 2, 1); P(f, 9, 9 + by, 2, 1);
    }
  }

  /* ---------------- MANI: pelo corto, lentes redondos, barba, camisa azul ---------------- */
  // Cabeza de Mani como dibujo de texto (más fácil de ajustar a ojo)
  // H pelo · h brillo · S piel · F armazón · L cristal · E pupila · B barba · M boca · W dientes
  const CABEZA_MANI = [
    '......HHH.......',
    '.....HHhHHH.....',
    '....HHHHHHHH....',
    '...HHHHHHHHHH...',
    '...HHHHHHHHHH...',
    '...HSSSSSSSSH...',
    '...HSFFSSFFSH...',
    '...HFLEFFLEFH...',
    '...HFLEFFLEFH...',
    '...HSFFSSFFSH...',
    '...BBBBBBBBBB...',
    '....BBMWWMBB....',
    '.....BBBBBB.....'
  ];

  // La misma cabeza SIN barba: la mandíbula se queda dentro del ancho de la cara
  // (columnas 4-11) y las orejas asoman a los lados.
  const CABEZA_MANI_LIMPIA = [
    '......HHH.......',
    '.....HHhHHH.....',
    '....HHHHHHHH....',
    '...HHHHHHHHHH...',
    '...HHHHHHHHHH...',
    '...HSSSSSSSSH...',
    '...HSFFSSFFSH...',
    '...HFLEFFLEFH...',
    '...SFLEFFLEFS...',
    '...SSFFSSFFSS...',
    '....SSSSSSSS....',
    '....SSMWWMSS....',
    '.....SSSSSS.....'
  ];

  function dibujarMani(x, c, p) {
    const P = pintor(x), by = p.by;
    piernas(P, c, p, 5, 8, 3);
    // torso (camisa)
    P(c.ropa, 4, 13 + by, 8, 6);
    P(c.ropaLuz, 6, 13 + by, 4, 1);
    P(c.ropaOsc, 8, 14 + by, 1, 5);
    P(c.ropaOsc, 4, 18 + by, 8, 1);
    P(c.ropaOsc, 4, 19 + by, 8, 1);
    // brazos
    P(c.ropaOsc, 2 + p.brA[0], 14 + by + p.brA[1], 2, 5);
    P(c.piel, 2 + p.brA[0], 19 + by + p.brA[1], 2, 1);
    P(c.ropa, 12 + p.brF[0], 14 + by + p.brF[1], 2, 5);
    P(c.piel, 12 + p.brF[0], 19 + by + p.brF[1], 2, 1);
    // cabeza
    const col = {
      H: c.pelo, h: c.peloLuz, S: c.piel,
      F: c.lentes ? '#2a2230' : c.piel,
      L: c.lentes ? '#e2ecf9' : c.piel,
      E: c.ojo,
      B: c.barba ? c.barbaCol : c.piel,
      M: c.boca, W: '#fff5ee'
    };
    const cabeza = c.barba ? CABEZA_MANI : CABEZA_MANI_LIMPIA;
    for (let y = 0; y < cabeza.length; y++) {
      const fila = cabeza[y];
      for (let xx = 0; xx < fila.length; xx++) {
        const k = fila[xx];
        if (k !== '.') P(col[k], xx, y + by);
      }
    }
    // sombra bajo la barbilla: separa la cabeza de la camisa
    P(c.pielSom, 7, 13 + by, 2, 1);
  }

  function generarPersona(fn, cfg, nombres) {
    const out = {};
    Object.keys(nombres).forEach(function (clave) {
      out[clave] = nombres[clave].map(function (pose) {
        const o = lienzo(16, 24);
        fn(o[1], cfg, POSES[pose]);
        return contorno(o[0], PAL.tinta);
      });
    });
    return out;
  }

  /* ---------------- ROLLY (perrito) ---------------- */
  function dibujarRolly(x, c, wag, sentado) {
    const P = pintor(x);
    const t = wag ? 1 : 0;
    // cola
    P(c.pelaje, 1, 3 + t, 2, 3 - t);
    P(c.pelaje, 2, 5, 2, 2);
    // cuerpo
    P(c.pelaje, 3, 5, 9, 5);
    P(c.pelajeLuz, 4, 5, 6, 1);
    P(c.blanco, 8, 8, 3, 2);
    // patas
    P(c.pelaje, 3, 10, 2, 2); P(c.pelaje, 6, 10, 2, 2); P(c.pelaje, 9, 10, 2, 2); P(c.pelaje, 12, 10, 2, 2);
    P(c.pelajeOsc, 3, 11, 2, 1); P(c.pelajeOsc, 6, 11, 2, 1); P(c.pelajeOsc, 9, 11, 2, 1); P(c.pelajeOsc, 12, 11, 2, 1);
    // cabeza
    P(c.pelaje, 10, 1, 5, 6);
    P(c.pelajeLuz, 11, 1, 3, 1);
    P(c.blanco, 12, 4, 3, 3);
    // oreja caída
    P(c.pelajeOsc, 9, 1, 2, 4);
    // ojo y nariz
    P(PAL.tinta, 12, 3);
    P(PAL.tinta, 15, 4, 1, 2);
    // collar morado
    P(PAL.morado, 9, 6, 3, 1);
    P(PAL.oro, 10, 7);
  }

  /* ---------------- LOBO (lobita) aullando ---------------- */
  function lobo(color) {
    // Silueta de lobita sentada, aullándole a la luna (mira hacia la derecha)
    const f = [
      '..........##.',
      '.........###.',
      '........####.',
      '.......##.##.',
      '......#####..',
      '......####...',
      '.....#####...',
      '.....#####...',
      '....######...',
      '....######...',
      '...#######...',
      '..########...',
      '.#########...',
      '##.#######...',
      '#..###.###...'
    ];
    return desdeFilas(f, { '#': color });
  }

  /* ---------------- OBJETOS ---------------- */
  function corazonGrande(colorRelleno, colorLuz) {
    const f = [
      '.###.###.',
      '#########',
      '#########',
      '#########',
      '.#######.',
      '..#####..',
      '...###...',
      '....#....'
    ];
    const c = desdeFilas(f, { '#': colorRelleno });
    const x = c.getContext('2d');
    x.fillStyle = colorLuz;
    x.fillRect(1, 1, 2, 1); x.fillRect(1, 2, 1, 1);
    return contorno(c, '#8c1f45');
  }

  function corazonMini(color) {
    const f = ['.#.#.', '#####', '#####', '.###.', '..#..'];
    return desdeFilas(f, { '#': color });
  }

  function corazon7(color) {
    const f = ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'];
    return desdeFilas(f, { '#': color });
  }

  function platano() {
    const f = [
      'bb.......bb',
      'bYY.....YYb',
      '.bYY...YYYb',
      '.yYYYYYYYYo',
      '..yYYYYYYo.',
      '...oYYYYo..',
      '.....oo....'
    ];
    return contorno(desdeFilas(f, { y: '#fff3a0', Y: '#ffd23f', o: '#e0a21a', b: '#6b4423' }), '#7a4a12');
  }

  function nota() {
    const f = [
      '..#####',
      '..#...#',
      '..#...#',
      '..#....',
      '..#....',
      '.##....',
      '###....',
      '.##....'
    ];
    return contorno(desdeFilas(f, { '#': '#ffe27a' }), '#8a5a00');
  }

  function chispa(color) {
    return desdeFilas(['..#..', '..#..', '#####', '..#..', '..#..'], { '#': color });
  }

  function sobre() {
    const f = [
      '..................',
      '.eeeeeeeeeeeeeeee.',
      '.eppppppppppppppe.',
      '.epepppppppppppee.',
      '.eppepppppppppepe.',
      '.epppeppppppppppe.',
      '.eppppeppRRpppepe.',
      '.epppppeRRRRepppe.',
      '.eppppppeRRRRppee.',
      '.epppppppeRRepppe.',
      '.eppppppppeeppppe.',
      '.eppppppppppppppe.',
      '.eeeeeeeeeeeeeeee.',
      '..................'
    ];
    return desdeFilas(f, { e: '#8e3b5a', p: '#ffe9d2', R: '#ff5d7e' });
  }

  /* Iconos 12x12 de cada recuerdo (para el camino del nivel final) */
  function iconos() {
    const P = { k: '#2a1238', w: '#ffffff', c: '#fff1e0', r: '#ff5d7e', R: '#c43a5a', o: '#ffae42', y: '#ffd36e',
      v: '#8e4fc7', V: '#5b2a86', b: '#5b8fd9', g: '#6fb04f', G: '#3f7a3a', n: '#8a5a3a', N: '#5a3a28', t: '#e0a458', s: '#cfd8e8', p: '#ff9ab8' };
    const L = [
      // 0: escuelita con bandera
      ['.........gw.', '.........kkk', '....kkkk.k..', '..kkRRRRkk..', '.kRRRRRRRRk.', 'kkkkkkkkkkkk', '.kcccccccck.', '.kcbbckbbck.', '.kcbbckbbck.', '.kccccvvcck.', '.kccccvvcck.', '.kkkkkkkkkk.'],
      // 1: taza de café
      ['...r..r.....', '..r..r......', '............', '.kkkkkkkk...', '.kcccccckk..', '.kcnnnnckk..', '.kcnnnnck.k.', '.kcnnnnck.k.', '..kcccckkk..', '...kkkkkk...', '..kkkkkkkk..', '............'],
      // 2: pastel con una vela
      ['.....o......', '.....y......', '.....k......', '..kkkkkkkk..', '.kppppppppk.', '.kwwwwwwwwk.', '.kccccccccck', '.kcrcrcrcrck', '.kccccccccck', '.kkkkkkkkkk.', '............', '............'],
      // 3: luna y estrella
      ['....kkkk....', '...kyyykk...', '..kyyykkk...', '.kyyyk......', '.kyyyk......', '.kyyyk......', '.kyyyk...y..', '..kyyykkk...', '...kyyykk...', '....kkkk....', '............', '............'],
      // 4: globo de corazón
      ['..kkk.kkk...', '.krrrkrrrk..', '.krwrrrrrk..', '.krrrrrrrk..', '..krrrrrk...', '...krrrk....', '....krk.....', '.....k......', '.....k......', '....k.......', '.....k......', '............'],
      // 5: maleta
      ['....kkkk....', '....k..k....', '.kkkkkkkkkk.', '.kooooooook.', '.koyooooyok.', '.kooooooook.', '.kkkkkkkkkk.', '.kooooooook.', '.kooooooook.', '.kkkkkkkkkk.', '..k......k..', '............'],
      // 6: globo morado
      ['...kkkkkk...', '..kvvvvvvk..', '.kvwvvvvvvk.', '.kvwvvvvvvk.', '.kvvvvvvvvk.', '..kvvvvvvk..', '...kvvvvk...', '....kkkk....', '.....k......', '....k.......', '.....k......', '............'],
      // 7: pastel de chocolate con crema
      ['............', '....nnnn....', '..kknNNNnkk.', '.kwNwNNwNwk.', '.kwwwwwwwwk.', '.knnnnnnnnk.', '.knNnNnNnNk.', '.knnnnnnnnk.', '.knnnnnnnnk.', '.kkkkkkkkkk.', '............', '............']
    ];
    return L.map(function (filas) { return desdeFilas(filas, P); });
  }

  /* ------------------------------------------------------------------ */
  const Sprites = {
    ANCLA: { x: 9, y: 25 },      // pie del personaje dentro del lienzo con contorno
    PERSONA_W: 18, PERSONA_H: 26,

    iniciar: function () {
      const D = window.DATOS.personajes;
      const e = D.ella, m = D.el;
      const cfgAna = {
        pelo: e.pelo, peloLuz: '#4a3b60', piel: e.piel, pielSom: '#c88a64',
        ropa: e.ropa, ropaLuz: '#c8a2f2', ropaOsc: '#7646ab',
        pantalon: '#5b80c4', zapato: '#fbf4ff', suela: '#8d7eb0',
        ojo: '#2a1a30', rubor: '#f58a98', boca: '#a4414e',
        largoPelo: e.largoPelo, lentes: !!e.lentes
      };
      const cfgMani = {
        pelo: m.pelo, peloLuz: '#40364a', piel: m.piel, pielSom: '#bd8458', barbaCol: '#2b201c',
        ropa: m.ropa, ropaLuz: '#a9c4e8', ropaOsc: '#355d92',
        pantalon: '#3f4666', zapato: '#fbf4ff', suela: '#8d7eb0',
        ojo: '#1c0f2b', boca: '#d98a86', lentes: !!m.lentes, barba: !!m.barba
      };
      const nombres = {
        idle: ['idle0', 'idle1'], correr: ['corre0', 'corre1', 'corre2', 'corre3'],
        salto: ['salto'], caida: ['caida'], feliz: ['feliz']
      };
      this.ana = generarPersona(dibujarAna, cfgAna, nombres);
      this.mani = generarPersona(dibujarMani, cfgMani, nombres);

      // Rolly (pelaje dorado por defecto)
      const cr = { pelaje: '#e7b66b', pelajeLuz: '#f4d08e', pelajeOsc: '#a8662a', blanco: '#fff1e0' };
      this.rolly = [0, 1].map(function (w) {
        const o = lienzo(16, 12);
        dibujarRolly(o[1], cr, w, false);
        return contorno(o[0], PAL.tinta);
      });

      this.corazon = [corazonGrande('#ff5d7e', '#ffc2d0'), corazonGrande('#ff7a94', '#ffd5de')];
      this.platano = platano();
      this.nota = nota();
      this.sobre = contorno(sobre(), PAL.tinta);
      this.iconos = iconos().map(function (c) { return c; });
      this.loboOscuro = lobo('#1a1030');
      this.loboRim = lobo('#9a8ce0');
      this._mini = {};
      this._chispa = {};
      this._c7 = {};
    },

    corazonMini: function (color) { return this._mini[color] || (this._mini[color] = corazonMini(color)); },
    corazon7: function (color) { return this._c7[color] || (this._c7[color] = corazon7(color)); },
    chispa: function (color) { return this._chispa[color] || (this._chispa[color] = chispa(color)); },

    // Dibuja un sprite de personaje con el pie en (x,y); flip = mirar a la izquierda
    persona: function (ctx, spr, x, y, flip) {
      const A = Sprites.ANCLA;
      x = Math.round(x); y = Math.round(y);
      if (flip) {
        ctx.save(); ctx.translate(x, 0); ctx.scale(-1, 1);
        ctx.drawImage(spr, -A.x, y - A.y);
        ctx.restore();
      } else {
        ctx.drawImage(spr, x - A.x, y - A.y);
      }
    }
  };

  App.Sprites = Sprites;
})(window.App = window.App || {});
