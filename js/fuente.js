/* ==========================================================================
   FUENTE PIXEL 5x7 (propia, sin archivos externos)
   Soporta minúsculas, mayúsculas, números, acentos, ñ, ¡ ¿ y algunos símbolos.
   Los textos se dibujan en un lienzo pequeño (con caché) y se amplían sin
   suavizado para que se vean nítidos.
   ========================================================================== */
(function (App) {
  'use strict';

  // Cada glifo: filas separadas por "/", 5 columnas. Filas 0-6 = mayúsculas;
  // las minúsculas ocupan 2-6 y las colas (g j p q y) bajan a las filas 7-8.
  const DEF = {
    A: '.###./#...#/#...#/#####/#...#/#...#/#...#',
    B: '####./#...#/#...#/####./#...#/#...#/####.',
    C: '.###./#...#/#..../#..../#..../#...#/.###.',
    D: '####./#...#/#...#/#...#/#...#/#...#/####.',
    E: '#####/#..../#..../####./#..../#..../#####',
    F: '#####/#..../#..../####./#..../#..../#....',
    G: '.###./#...#/#..../#.###/#...#/#...#/.###.',
    H: '#...#/#...#/#...#/#####/#...#/#...#/#...#',
    I: '.###./..#../..#../..#../..#../..#../.###.',
    J: '..###/...#./...#./...#./...#./#..#./.##..',
    K: '#...#/#..#./#.#../##.../#.#../#..#./#...#',
    L: '#..../#..../#..../#..../#..../#..../#####',
    M: '#...#/##.##/#.#.#/#.#.#/#...#/#...#/#...#',
    N: '#...#/##..#/#.#.#/#..##/#...#/#...#/#...#',
    O: '.###./#...#/#...#/#...#/#...#/#...#/.###.',
    P: '####./#...#/#...#/####./#..../#..../#....',
    Q: '.###./#...#/#...#/#...#/#.#.#/#..#./.##.#',
    R: '####./#...#/#...#/####./#.#../#..#./#...#',
    S: '.####/#..../#..../.###./....#/....#/####.',
    T: '#####/..#../..#../..#../..#../..#../..#..',
    U: '#...#/#...#/#...#/#...#/#...#/#...#/.###.',
    V: '#...#/#...#/#...#/#...#/#...#/.#.#./..#..',
    W: '#...#/#...#/#...#/#.#.#/#.#.#/##.##/#...#',
    X: '#...#/#...#/.#.#./..#../.#.#./#...#/#...#',
    Y: '#...#/#...#/.#.#./..#../..#../..#../..#..',
    Z: '#####/....#/...#./..#../.#.../#..../#####',

    0: '.###./#...#/#..##/#.#.#/##..#/#...#/.###.',
    1: '..#../.##../..#../..#../..#../..#../.###.',
    2: '.###./#...#/....#/...#./..#../.#.../#####',
    3: '#####/...#./..#../...#./....#/#...#/.###.',
    4: '...#./..##./.#.#./#..#./#####/...#./...#.',
    5: '#####/#..../####./....#/....#/#...#/.###.',
    6: '..##./.#.../#..../####./#...#/#...#/.###.',
    7: '#####/....#/...#./..#../.#.../.#.../.#...',
    8: '.###./#...#/#...#/.###./#...#/#...#/.###.',
    9: '.###./#...#/#...#/.####/....#/...#./.##..',

    a: '...../...../.###./....#/.####/#...#/.####',
    b: '#..../#..../####./#...#/#...#/#...#/####.',
    c: '...../...../.###./#..../#..../#...#/.###.',
    d: '....#/....#/.####/#...#/#...#/#...#/.####',
    e: '...../...../.###./#...#/#####/#..../.###.',
    f: '..##./.#..#/.#.../###../.#.../.#.../.#...',
    g: '...../...../.####/#...#/#...#/#...#/.####/....#/.###.',
    h: '#..../#..../####./#...#/#...#/#...#/#...#',
    i: '..#../...../.##../..#../..#../..#../.###.',
    j: '...#./...../..##./...#./...#./...#./...#./#..#./.##..',
    k: '#..../#..../#..#./#.#../##.../#.#../#..#.',
    l: '.##../..#../..#../..#../..#../..#../.###.',
    m: '...../...../##.#./#.#.#/#.#.#/#.#.#/#.#.#',
    n: '...../...../####./#...#/#...#/#...#/#...#',
    o: '...../...../.###./#...#/#...#/#...#/.###.',
    p: '...../...../####./#...#/#...#/#...#/####./#..../#....',
    q: '...../...../.####/#...#/#...#/#...#/.####/....#/....#',
    r: '...../...../#.##./##..#/#..../#..../#....',
    s: '...../...../.####/#..../.###./....#/####.',
    t: '.#.../.#.../###../.#.../.#.../.#..#/..##.',
    u: '...../...../#...#/#...#/#...#/#..##/.##.#',
    v: '...../...../#...#/#...#/#...#/.#.#./..#..',
    w: '...../...../#...#/#...#/#.#.#/#.#.#/.#.#.',
    x: '...../...../#...#/.#.#./..#../.#.#./#...#',
    y: '...../...../#...#/#...#/#...#/.####/....#/....#/.###.',
    z: '...../...../#####/...#./..#../.#.../#####',
    'ı': '...../...../.##../..#../..#../..#../.###.',   // i sin punto (para í)

    '.': '...../...../...../...../...../...../..#..',
    ',': '...../...../...../...../...../...../..#../.#...',
    '!': '..#../..#../..#../..#../..#../...../..#..',
    '?': '.###./#...#/....#/...#./..#../...../..#..',
    ':': '...../...../..#../...../...../..#../.....',
    ';': '...../...../..#../...../...../..#../..#../.#...',
    '-': '...../...../...../.###./...../...../.....',
    "'": '..#../..#../...../...../...../...../.....',
    '"': '.#.#./.#.#./...../...../...../...../.....',
    '+': '...../..#../..#../#####/..#../..#../.....',
    '/': '....#/....#/...#./..#../.#.../#..../#....',
    '(': '...#./..#../.#.../.#.../.#.../..#../...#.',
    ')': '.#.../..#../...#./...#./...#./..#../.#...',
    '¡': '..#../...../..#../..#../..#../..#../..#..',  // ¡
    '¿': '..#../...../..#../.#.../#..../#...#/.###.',  // ¿
    '♥': '...../.#.#./#####/#####/.###./..#../.....',  // ♥
    '♪': '..###/..#.#/..#../..#../.##../###../.##..',  // ♪
    '→': '...../..#../...#./#####/...#./..#../.....'   // →
  };

  // Acentos: marca [x,y] relativa a la celda de 5 columnas (y<0 = sobre las mayúsculas)
  const ACENTO = {
    agudo:   { min: [[3, 0], [2, 1]],  may: [[3, -2], [2, -1]] },
    dieresis:{ min: [[1, 0], [3, 0]],  may: [[1, -2], [3, -2]] },
    tilde:   { min: [[1, 0], [2, 0], [4, 0], [0, 1], [2, 1], [3, 1]],
               may: [[1, -2], [2, -2], [4, -2], [0, -1], [2, -1], [3, -1]] }
  };
  const COMPUESTOS = {
    'á': ['a', 'agudo'], 'é': ['e', 'agudo'], 'í': ['ı', 'agudo'], 'ó': ['o', 'agudo'], 'ú': ['u', 'agudo'],
    'ü': ['u', 'dieresis'], 'ñ': ['n', 'tilde'],
    'Á': ['A', 'agudo'], 'É': ['E', 'agudo'], 'Í': ['I', 'agudo'], 'Ó': ['O', 'agudo'], 'Ú': ['U', 'agudo'],
    'Ü': ['U', 'dieresis'], 'Ñ': ['N', 'tilde']
  };

  const glifos = {};   // car -> { px: [[x,y]], ancho }

  function pixelesDe(def) {
    const px = [];
    def.split('/').forEach(function (fila, y) {
      for (let x = 0; x < fila.length; x++) if (fila[x] === '#') px.push([x, y]);
    });
    return px;
  }
  function cerrar(px) {
    let min = 99, max = -99;
    px.forEach(function (p) { if (p[0] < min) min = p[0]; if (p[0] > max) max = p[0]; });
    if (!px.length) return { px: [], ancho: 3 };
    return { px: px.map(function (p) { return [p[0] - min, p[1]]; }), ancho: max - min + 1 };
  }
  Object.keys(DEF).forEach(function (k) { glifos[k] = cerrar(pixelesDe(DEF[k])); });
  Object.keys(COMPUESTOS).forEach(function (k) {
    const base = COMPUESTOS[k][0], tipo = COMPUESTOS[k][1];
    const mayus = k !== k.toLowerCase();
    const crudo = pixelesDe(DEF[base]).concat(ACENTO[tipo][mayus ? 'may' : 'min']);
    glifos[k] = cerrar(crudo);
  });
  glifos[' '] = { px: [], ancho: 3 };

  function glifo(c) { return glifos[c] || glifos['?']; }

  // Ancho en píxeles base (sin escala)
  function medirBase(texto) {
    let w = 0;
    for (const c of texto) w += glifo(c).ancho + 1;
    return Math.max(0, w - 1);
  }

  const ALTO_LIENZO = 12;   // filas -2 .. 9
  const ORIGEN_Y = 2;       // fila 0 del glifo dentro del lienzo
  const cache = new Map();

  function renderizar(texto, color, borde, sombra) {
    const clave = texto + '\u0001' + color + '\u0001' + (borde || '') + '\u0001' + (sombra || '');
    let r = cache.get(clave);
    if (r) return r;
    if (cache.size > 500) cache.clear();
    const w = medirBase(texto);
    const pad = borde ? 1 : 0;
    const sh = sombra ? 1 : 0;
    const c = document.createElement('canvas');
    c.width = w + pad * 2 + sh;
    c.height = ALTO_LIENZO + pad * 2 + sh;
    const x = c.getContext('2d');
    function pasada(col, dx, dy) {
      x.fillStyle = col;
      let cx = 0;
      for (const ch of texto) {
        const g = glifo(ch);
        for (let i = 0; i < g.px.length; i++) {
          x.fillRect(cx + g.px[i][0] + pad + dx, g.px[i][1] + ORIGEN_Y + pad + dy, 1, 1);
        }
        cx += g.ancho + 1;
      }
    }
    if (sombra) {
      if (borde) { [[1, 1], [0, 1], [1, 0]].forEach(function (d) { pasada(sombra, d[0] + 0, d[1] + 0); }); }
      pasada(sombra, 1, 1);
    }
    if (borde) {
      [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (d) { pasada(borde, d[0], d[1]); });
    }
    pasada(color, 0, 0);
    r = { c: c, ox: pad, oy: ORIGEN_Y + pad, w: w };
    cache.set(clave, r);
    return r;
  }

  const Fuente = {
    ALTO: 7,
    medir: function (texto, escala) { return medirBase(texto) * (escala || 1); },

    /* Dibuja texto. (x,y) = esquina superior izquierda de las mayúsculas.
       opciones: { escala, color, borde, sombra, alinear: 'izq'|'centro'|'der', alfa } */
    dibujar: function (ctx, texto, x, y, o) {
      o = o || {};
      const esc = o.escala || 1;
      const r = renderizar(String(texto), o.color || '#fff', o.borde, o.sombra);
      let px = x;
      if (o.alinear === 'centro') px = x - (r.w * esc) / 2;
      else if (o.alinear === 'der') px = x - r.w * esc;
      px = Math.round(px); y = Math.round(y);
      if (o.alfa != null) ctx.globalAlpha = o.alfa;
      ctx.drawImage(r.c, px - r.ox * esc, y - r.oy * esc, r.c.width * esc, r.c.height * esc);
      if (o.alfa != null) ctx.globalAlpha = 1;
      return r.w * esc;
    },

    // Parte un texto en líneas que quepan en anchoMax (píxeles, con escala)
    lineas: function (texto, anchoMax, escala) {
      const esc = escala || 1;
      const palabras = String(texto).split(/\s+/);
      const out = []; let actual = '';
      palabras.forEach(function (p) {
        const prueba = actual ? actual + ' ' + p : p;
        if (medirBase(prueba) * esc <= anchoMax || !actual) actual = prueba;
        else { out.push(actual); actual = p; }
      });
      if (actual) out.push(actual);
      return out;
    },

    // Dibuja un párrafo; devuelve el alto usado
    parrafo: function (ctx, texto, x, y, anchoMax, o) {
      o = o || {};
      const esc = o.escala || 1;
      const inter = (o.interlineado || 12) * esc;
      const ls = Fuente.lineas(texto, anchoMax, esc);
      ls.forEach(function (l, i) {
        const opt = Object.assign({}, o);
        Fuente.dibujar(ctx, l, x, y + i * inter, opt);
      });
      return ls.length * inter;
    }
  };

  App.Fuente = Fuente;
})(window.App = window.App || {});
