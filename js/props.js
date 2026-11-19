/* ==========================================================================
   PROPS: objetos de decorado y metas de cada nivel (dibujados con código).
   Cada fábrica devuelve { frames:[lienzos], fps } y se ancla abajo-centro.
   ========================================================================== */
(function (App) {
  'use strict';
  const A = App.Arte, F = App.Fuente, PAL = App.PAL;
  const nuevo = A.nuevo, R = A.R, circ = A.circ, elip = A.elip, tri = A.tri, linea = A.linea, mez = A.mezclar, hash = A.hash;

  function est(c) { return { frames: [c], fps: 0 }; }
  function anim(frames, fps) { return { frames: frames, fps: fps }; }

  // curva de cuerda (catenaria simple) para guirnaldas y banderines
  function cuerda(x, col, w, sag, y0, cb) {
    for (let i = 0; i < w; i++) {
      const t = (i / (w - 1)) * 2 - 1;
      const y = Math.round(y0 + sag * (1 - t * t));
      R(x, col, i, y, 1, 1);
      if (cb) cb(i, y);
    }
  }
  function yDeCuerda(i, w, sag, y0) { const t = (i / (w - 1)) * 2 - 1; return Math.round(y0 + sag * (1 - t * t)); }

  function llama(x, cx, y, f) {
    const dy = f ? 1 : 0;
    R(x, '#ff8a3d', cx, y + 1 - dy, 1, 2 + dy);
    R(x, '#ffd36e', cx, y - dy, 1, 2 + dy);
  }

  const P = {
    /* ------------------ vegetación ------------------ */
    pino: function (o) { return est(A.pino(o.alto || 48, o.col || '#2f6b44', o.luz || '#4f8f5a', o.tronco)); },
    arbolRedondo: function (o) { return est(A.arbolRedondo(o.alto || 48, o.col || '#3f8a4a', o.luz || '#66b060', o.tronco)); },
    arbolDesnudo: function (o) { return est(A.arbolDesnudo(o.alto || 48, o.col || '#4a3a38', o.semilla || 3)); },
    palmera: function (o) { return est(A.palmera(o.alto || 56, o.col || '#2f7a3a', o.luz || '#56a850')); },
    arbusto: function (o) { return est(A.arbusto(o.w || 24, o.h || 14, o.col || '#3f8a4a', o.luz || '#66b060', o.flor)); },
    flores: function (o) {
      const c = nuevo(18, 9), r = A.prng(o.semilla || 4), cols = o.colores || ['#ff8fb1', '#ffd36e', '#fff1e0'];
      for (let i = 0; i < 6; i++) {
        const px = 1 + Math.floor(r() * 15), alt = 3 + Math.floor(r() * 4);
        R(c.x, o.tallo || '#3f7a3a', px, 9 - alt, 1, alt);
        R(c.x, cols[Math.floor(r() * cols.length)], px - 1, 9 - alt - 1, 3, 2);
        R(c.x, '#ffd36e', px, 9 - alt - 1, 1, 1);
      }
      return est(c.c);
    },
    piedra: function (o) {
      const w = o.w || 20, h = o.h || 12, c = nuevo(w, h);
      elip(c.x, o.som || '#6a6275', Math.round(w / 2), h - Math.round(h / 2), Math.round(w / 2), Math.round(h / 2));
      elip(c.x, o.col || '#8c849a', Math.round(w / 2) - 1, h - Math.round(h / 2) - 1, Math.round(w / 2) - 2, Math.round(h / 2) - 1);
      R(c.x, o.luz || '#aaa3b8', 4, 2, 4, 1);
      c.x.clearRect(0, h - 1, w, 1);
      return est(c.c);
    },
    cerca: function (o) {
      const w = o.w || 32, h = 20, c = nuevo(w, h);
      const poste = o.poste || '#5a3a28', alambre = o.alambre || '#c9c2d6';
      if (o.tipo === 'madera') {
        R(c.x, poste, 1, 2, 3, 18); R(c.x, poste, w - 4, 2, 3, 18);
        R(c.x, o.luz || '#8a5a3a', 0, 5, w, 3); R(c.x, o.luz || '#8a5a3a', 0, 11, w, 3);
        R(c.x, poste, 0, 7, w, 1); R(c.x, poste, 0, 13, w, 1);
      } else {
        R(c.x, poste, 1, 2, 3, 18); R(c.x, poste, w - 4, 2, 3, 18);
        for (let i = 0; i < 3; i++) {
          const y = 5 + i * 5;
          cuerda(c.x, alambre, w - 4, 1, y, null);
        }
        for (let k = 8; k < w - 6; k += 8) { R(c.x, alambre, k, 4, 1, 1); R(c.x, alambre, k, 10, 1, 1); R(c.x, alambre, k, 15, 1, 1); }
      }
      return est(c.c);
    },
    poste: function (o) {
      const c = nuevo(5, 18);
      R(c.x, o.col || '#2a1f3d', 1, 1, 3, 17); R(c.x, o.col || '#2a1f3d', 0, 0, 5, 2);
      if (o.luz) R(c.x, o.luz, 1, 1, 1, 16);
      return est(c.c);
    },
    letrero: function (o) {
      const texto = o.texto || '', tw = F.medir(texto), w = Math.max(24, tw + 10), c = nuevo(w, 24);
      R(c.x, '#4a2f1f', 0, 0, w, 14);
      R(c.x, '#8a5a3a', 1, 1, w - 2, 12);
      R(c.x, '#a8724a', 1, 1, w - 2, 1);
      R(c.x, '#6b4a30', 1, 12, w - 2, 1);
      F.dibujar(c.x, texto, Math.round((w - tw) / 2), 3, { color: '#fff1e0', sombra: '#3a2418' });
      R(c.x, '#4a2f1f', Math.floor(w / 2) - 1, 14, 3, 10);
      R(c.x, '#6b4a30', Math.floor(w / 2), 14, 1, 10);
      return est(c.c);
    },
    farol: function (o) {
      const mk = function (f) {
        const c = nuevo(18, 50);
        R(c.x, '#2a1f30', 8, 12, 2, 38); R(c.x, '#2a1f30', 6, 46, 6, 4); R(c.x, '#2a1f30', 7, 40, 4, 2);
        R(c.x, '#2a1f30', 5, 4, 8, 2); R(c.x, '#2a1f30', 5, 12, 8, 2); R(c.x, '#2a1f30', 4, 5, 1, 8); R(c.x, '#2a1f30', 13, 5, 1, 8);
        R(c.x, f ? '#fff0b0' : '#ffe27a', 5, 6, 8, 6);
        R(c.x, '#ffffff', 7, 7, 2, 3);
        c.x.globalAlpha = f ? 0.25 : 0.18;
        circ(c.x, '#ffd36e', 9, 9, 8);
        c.x.globalAlpha = 1;
        return c.c;
      };
      return anim([mk(0), mk(1)], 2);
    },
    maceta: function (o) {
      const c = nuevo(16, 14);
      R(c.x, '#c4684a', 3, 7, 10, 7); R(c.x, '#e08a68', 3, 7, 10, 2); R(c.x, '#8a3a2a', 4, 13, 8, 1);
      R(c.x, '#3f7a3a', 4, 3, 8, 5); circ(c.x, '#56a850', 5, 5, 2); circ(c.x, '#56a850', 10, 5, 2);
      [[4, 2], [8, 1], [11, 3]].forEach(function (p, i) { R(c.x, (o.flores || ['#ff6f7d', '#ffd36e', '#ff8fb1'])[i % 3], p[0], p[1], 2, 2); });
      return est(c.c);
    },
    banca: function () {
      const c = nuevo(30, 16);
      R(c.x, '#5a3a28', 2, 6, 3, 10); R(c.x, '#5a3a28', 25, 6, 3, 10);
      R(c.x, '#8a5a3a', 0, 5, 30, 3); R(c.x, '#a8724a', 0, 5, 30, 1);
      R(c.x, '#8a5a3a', 1, 0, 28, 2); R(c.x, '#8a5a3a', 1, 3, 28, 1);
      R(c.x, '#5a3a28', 2, 0, 2, 6); R(c.x, '#5a3a28', 26, 0, 2, 6);
      return est(c.c);
    },

    /* ------------------ fiesta ------------------ */
    globos: function (o) {
      const cols = o.colores || ['#8e4fc7', '#c9a3ee', '#ff8fb1'], n = o.n || 3, w = 12 * n + 4, c = nuevo(w, 50);
      const cx0 = Math.round(w / 2);
      for (let i = 0; i < n; i++) {
        const bx = 8 + i * 11 + (i % 2) * 2, by = 10 + (i % 2) * 6, col = cols[i % cols.length];
        linea(c.x, '#d9cfe8', bx, by + 9, cx0, 49);
        elip(c.x, mez(col, '#2a1238', 0.18), bx, by, 6, 8);
        elip(c.x, col, bx - 1, by - 1, 5, 7);
        R(c.x, '#ffffff', bx - 3, by - 5, 2, 3);
        R(c.x, mez(col, '#2a1238', 0.3), bx - 1, by + 8, 3, 2);
      }
      return est(c.c);
    },
    globoCorazon: function (o) {
      const col = o.col || '#ff5d7e', c = nuevo(18, 34);
      const f = ['.####..####.', '############', '############', '############', '.##########.', '..########..', '...######...', '....####....', '.....##.....'];
      f.forEach(function (fila, y) { for (let x = 0; x < fila.length; x++) if (fila[x] === '#') R(c.x, y < 3 ? mez(col, '#ffffff', 0.15) : col, 3 + x, 1 + y, 1, 1); });
      R(c.x, '#ffd0dc', 5, 3, 2, 2);
      R(c.x, mez(col, '#2a1238', 0.3), 8, 10, 3, 1);
      linea(c.x, '#d9cfe8', 9, 11, 8, 33);
      return est(c.c);
    },
    banderines: function (o) {
      const w = o.w || 64, c = nuevo(w, 18), cols = o.colores || ['#8e4fc7', '#ff8fb1', '#ffd36e', '#c9a3ee'];
      const picado = o.estilo === 'picado';
      cuerda(c.x, '#5a4a60', w, 5, 1, null);
      for (let i = 3; i < w - 5; i += picado ? 8 : 6) {
        const y = yDeCuerda(i, w, 5, 1) + 1, col = cols[Math.floor(i / (picado ? 8 : 6)) % cols.length];
        if (picado) {
          R(c.x, col, i - 2, y, 7, 8);
          for (let k = 0; k < 3; k++) { c.x.clearRect(i - 1 + k * 2, y + 2, 1, 1); c.x.clearRect(i - 1 + k * 2, y + 5, 1, 1); }
          for (let k = 0; k < 4; k++) c.x.clearRect(i - 2 + k * 2, y + 7, 1, 1);
          c.x.clearRect(i + 1, y + 3, 1, 2);
        } else {
          tri(c.x, col, i, y, 6, 6);
          R(c.x, mez(col, '#ffffff', 0.3), i - 2, y, 2, 1);
        }
      }
      return est(c.c);
    },
    guirnalda: function (o) {
      const w = o.w || 64, cols = o.colores || ['#ffd36e', '#ff8fb1', '#ffe9a8', '#c9a3ee'];
      const mk = function (f) {
        const c = nuevo(w, 16);
        cuerda(c.x, '#3a2a48', w, 5, 1, null);
        for (let i = 4; i < w - 3; i += 8) {
          const y = yDeCuerda(i, w, 5, 1) + 1, k = Math.floor(i / 8), col = cols[k % cols.length];
          const on = ((k + f) % 2) === 0;
          R(c.x, '#3a2a48', i, y, 1, 1);
          R(c.x, on ? col : mez(col, '#2a1238', 0.5), i - 1, y + 1, 3, 3);
          if (on) { c.x.globalAlpha = 0.3; circ(c.x, col, i, y + 2, 4); c.x.globalAlpha = 1; R(c.x, '#ffffff', i, y + 1, 1, 1); }
        }
        return c.c;
      };
      return anim([mk(0), mk(1)], 1.6);
    },
    mesaPastel: function (o) {
      const tipo = o.tipo || 'mes';
      const mk = function (f) {
        const c = nuevo(64, 44), x = c.x;
        const mantel = o.mantel || '#fff1e0', mantelSom = mez(mantel, '#2a1238', 0.25), mantelOs = mez(mantel, '#2a1238', 0.45);
        // mesa
        R(x, '#5a3a28', 6, 32, 4, 12); R(x, '#5a3a28', 54, 32, 4, 12);
        R(x, mantel, 2, 28, 60, 12); R(x, mantelSom, 2, 36, 60, 4);
        for (let i = 2; i < 62; i += 4) { R(x, mantelSom, i, 40, 2, 1); R(x, mantelOs, i, 39, 1, 1); }
        R(x, '#ffffff', 2, 28, 60, 1);
        // adorno del mantel
        for (let i = 6; i < 60; i += 8) R(x, o.adorno || '#c9a3ee', i, 33, 2, 2);
        if (tipo === 'mes') {
          // pastel pequeño con una vela
          R(x, '#e8e0f0', 22, 26, 20, 3); R(x, '#cfc4de', 22, 28, 20, 1);
          R(x, '#fff1e0', 25, 14, 14, 12); R(x, '#ffd0dc', 25, 14, 14, 4);
          for (let i = 25; i < 39; i += 3) R(x, '#ffd0dc', i, 18, 2, 2);
          R(x, '#c9a3ee', 25, 22, 14, 2);
          R(x, '#ff5d7e', 31, 6, 2, 8); R(x, '#fff', 31, 8, 2, 1);
          llama(x, 32, 3, f);
          // listón de "1"
          R(x, '#8e4fc7', 30, 19, 1, 4); R(x, '#8e4fc7', 29, 20, 1, 1);
        } else if (tipo === 'cumple') {
          // pastel morado de dos pisos con tres velas
          R(x, '#e8e0f0', 14, 26, 36, 3); R(x, '#cfc4de', 14, 28, 36, 1);
          R(x, '#b58be0', 18, 18, 28, 8); R(x, '#d9bff2', 18, 18, 28, 3);
          for (let i = 18; i < 46; i += 4) R(x, '#d9bff2', i, 21, 2, 2);
          R(x, '#8e4fc7', 18, 24, 28, 2);
          R(x, '#9c6ad0', 23, 10, 18, 8); R(x, '#e4cdf7', 23, 10, 18, 3);
          for (let i = 23; i < 41; i += 3) R(x, '#e4cdf7', i, 13, 2, 2);
          R(x, '#ff8fb1', 27, 15, 2, 2); R(x, '#ffd36e', 33, 16, 2, 2); R(x, '#ff8fb1', 38, 15, 2, 2);
          [27, 32, 37].forEach(function (cx, i) { R(x, ['#ff5d7e', '#ffd36e', '#7fd0ff'][i], cx, 4, 2, 6); llama(x, cx, 1 + (i % 2) * 0, f); });
        } else {
          // pastel de chocolate con crema + flan + refresco (cumpleaños de Mani)
          R(x, '#2a2230', 4, 26, 30, 3);
          R(x, '#fff1e0', 6, 14, 26, 12);
          R(x, '#5a3a28', 6, 14, 26, 4);
          for (let i = 8; i < 30; i += 4) { R(x, '#fff1e0', i, 12, 3, 3); R(x, '#3a2418', i + 1, 13, 1, 1); }
          for (let i = 7; i < 31; i += 3) R(x, '#fff1e0', i, 19, 2, 2);
          R(x, '#3a2418', 10, 15, 3, 1); R(x, '#3a2418', 18, 16, 4, 1); R(x, '#3a2418', 25, 15, 3, 1);
          R(x, '#ffd36e', 18, 7, 2, 5); llama(x, 19, 4, f);
          // flan
          R(x, '#2a2230', 36, 28, 24, 2);
          R(x, '#c9803a', 38, 20, 20, 8); R(x, '#e8a24a', 38, 20, 20, 3); R(x, '#a8602a', 38, 26, 20, 2);
          R(x, '#f4c070', 42, 22, 6, 2);
          // refresco naranja
          R(x, '#ff8a3d', 56, 12, 6, 16); R(x, '#fff1e0', 56, 17, 6, 5); R(x, '#2a7a3a', 56, 10, 6, 3); R(x, '#ff8a3d', 58, 7, 2, 4);
        }
        return c.c;
      };
      return anim([mk(0), mk(1)], 3);
    },
    regalo: function (o) {
      const c = nuevo(16, 16), x = c.x, col = o.col || '#8e4fc7';
      R(x, mez(col, '#2a1238', 0.35), 0, 0, 16, 16); R(x, col, 1, 1, 14, 14); R(x, mez(col, '#ffffff', 0.25), 1, 1, 14, 2);
      R(x, '#ffd36e', 7, 0, 2, 16); R(x, '#ffd36e', 0, 7, 16, 2);
      R(x, '#ffd36e', 4, 0, 3, 2); R(x, '#ffd36e', 9, 0, 3, 2);
      return est(c.c);
    },
    cabra: function () {
      const mk = function (f) {
        const c = nuevo(20, 16), x = c.x;
        R(x, '#e9dcc0', 3, 5, 11, 6); R(x, '#fff1e0', 3, 5, 11, 2);
        R(x, '#d9c8a4', 3, 9, 11, 2);
        R(x, '#e9dcc0', 4, 11, 2, 4); R(x, '#e9dcc0', 11, 11, 2, 4);
        R(x, '#7a6a58', 4, 14, 2, 1); R(x, '#7a6a58', 11, 14, 2, 1);
        R(x, '#e9dcc0', 14, 2 + f * 3, 4, 5); R(x, '#fff1e0', 15, 3 + f * 3, 3, 2);
        R(x, '#7a6a58', 14, 0 + f * 3, 1, 3); R(x, '#7a6a58', 17, 0 + f * 3, 1, 3);
        R(x, '#2a1f30', 17, 4 + f * 3, 1, 1);
        R(x, '#e9dcc0', 1, 5, 2, 2);
        R(x, '#e9dcc0', 14, 7 + f * 2, 2, 2);
        return c.c;
      };
      return anim([mk(0), mk(1)], 0.8);
    },
    cascanueces: function () {
      const c = nuevo(12, 34), x = c.x;
      R(x, '#2a1f30', 3, 0, 6, 9); R(x, '#ffd36e', 3, 8, 6, 1); R(x, '#ff5d7e', 5, 1, 2, 3);
      R(x, '#e8b48a', 3, 9, 6, 6); R(x, '#2a1f30', 4, 11, 1, 1); R(x, '#2a1f30', 7, 11, 1, 1);
      R(x, '#fff1e0', 3, 13, 6, 3);
      R(x, '#c43a4a', 1, 16, 10, 12); R(x, '#8a2030', 1, 25, 10, 3);
      R(x, '#ffd36e', 5, 17, 2, 1); R(x, '#ffd36e', 5, 20, 2, 1); R(x, '#ffd36e', 5, 23, 2, 1);
      R(x, '#ffd36e', 1, 16, 10, 1);
      R(x, '#2a1f30', 2, 28, 3, 6); R(x, '#2a1f30', 7, 28, 3, 6);
      R(x, '#c43a4a', 0, 17, 1, 8); R(x, '#c43a4a', 11, 17, 1, 8);
      return est(c.c);
    },
    arbolNavidad: function () {
      const mk = function (f) {
        const c = nuevo(30, 48), x = c.x;
        R(x, '#5a3a28', 13, 40, 4, 8);
        [[8, 8, 14], [18, 14, 18], [28, 20, 22]].forEach(function (t, i) { tri(x, i % 2 ? '#2f7a44' : '#3f8a54', 15, t[0], t[2], t[1] + 4); });
        // estrella
        R(x, f ? '#fff3a0' : '#ffd36e', 14, 1, 2, 2); R(x, f ? '#fff3a0' : '#ffd36e', 13, 2, 4, 1); R(x, f ? '#fff3a0' : '#ffd36e', 14, 0, 2, 4);
        // luces y bolas
        const cs = ['#ff5d7e', '#ffd36e', '#c9a3ee', '#7fd0ff'];
        [[15, 12], [10, 20], [20, 22], [13, 28], [8, 34], [22, 34], [17, 36], [12, 18], [18, 16]].forEach(function (p, i) {
          const on = (i + f) % 2 === 0;
          R(x, on ? cs[i % 4] : mez(cs[i % 4], '#2a1238', 0.45), p[0], p[1], 2, 2);
          if (on) R(x, '#fff', p[0], p[1], 1, 1);
        });
        return c.c;
      };
      return anim([mk(0), mk(1)], 1.5);
    },
    nochebuena: function () {
      const c = nuevo(16, 14), x = c.x;
      R(x, '#c4684a', 5, 9, 6, 5); R(x, '#e08a68', 5, 9, 6, 1);
      circ(x, '#2f7a44', 4, 7, 3); circ(x, '#2f7a44', 12, 7, 3); circ(x, '#3f8a54', 8, 6, 3);
      circ(x, '#d4283a', 5, 4, 3); circ(x, '#d4283a', 11, 4, 3); circ(x, '#e84a5a', 8, 3, 3);
      R(x, '#ffd36e', 7, 3, 2, 2);
      return est(c.c);
    },
    fogata: function () {
      const mk = function (f) {
        const c = nuevo(18, 20), x = c.x;
        c.x.globalAlpha = 0.18; circ(x, '#ff8a3d', 9, 12, 9); c.x.globalAlpha = 1;
        R(x, '#5a3a28', 2, 16, 14, 3); R(x, '#3a2418', 4, 14, 10, 2);
        const h = f === 0 ? 10 : f === 1 ? 12 : 9;
        tri(x, '#ff8a3d', 9, 15 - h, 9, h); tri(x, '#ffd36e', 9, 16 - h + 3, 5, h - 3); R(x, '#fff3a0', 8, 12, 2, 3);
        if (f === 1) R(x, '#ffd36e', 5, 5, 1, 1);
        if (f === 2) R(x, '#ff8a3d', 13, 4, 1, 1);
        return c.c;
      };
      return anim([mk(0), mk(1), mk(2)], 6);
    },

    /* ------------------ edificios / metas ------------------ */
    bandera: function () {
      const mk = function (f) {
        const c = nuevo(30, 52), x = c.x;
        R(x, '#c9c2d6', 2, 2, 2, 50); circ(x, '#ffd36e', 3, 2, 2);
        for (let i = 0; i < 20; i++) {
          const dy = Math.round(Math.sin((i + f * 3) / 3) * 1.5);
          R(x, '#2f8a4a', 4 + i, 4 + dy, 1, 13 * 1);
          if (i >= 7) R(x, '#fff1e0', 4 + i, 4 + dy, 1, 13);
          if (i >= 13) R(x, '#d4283a', 4 + i, 4 + dy, 1, 13);
          if (i >= 7 && i < 13) { if (i > 8 && i < 12) R(x, '#8a6a3a', 4 + i, 8 + dy, 1, 4); }
          R(x, 'rgba(0,0,0,0.12)', 4 + i, 14 + dy, 1, 3);
        }
        return c.c;
      };
      return anim([mk(0), mk(1), mk(2)], 4);
    },
    escuela: function () {
      const mk = function (f) {
        const c = nuevo(92, 60), x = c.x;
        // techo
        R(x, '#8a3a4a', 0, 8, 92, 6); R(x, '#a84a5a', 0, 8, 92, 2); R(x, '#5a2430', 0, 14, 92, 1);
        for (let i = 0; i < 92; i += 4) R(x, '#6a2c38', i, 10, 1, 4);
        // muros
        R(x, '#f4e6cc', 2, 15, 88, 40); R(x, '#d9c7a4', 2, 52, 88, 8); R(x, '#c9b690', 2, 55, 88, 5);
        R(x, '#8cb8e0', 2, 46, 88, 6); R(x, '#6a98c4', 2, 51, 88, 1);
        R(x, '#fffaf0', 2, 15, 88, 1); R(x, '#e2d0aa', 88, 15, 2, 40);
        // ventanas
        [8, 26, 56, 74].forEach(function (vx) {
          R(x, '#fffaf0', vx - 1, 21, 14, 18); R(x, '#4f6ea3', vx, 22, 12, 16); R(x, '#8cb8e0', vx, 22, 12, 4);
          R(x, '#fffaf0', vx + 5, 22, 2, 16); R(x, '#fffaf0', vx, 29, 12, 1);
        });
        // puerta morada con letrero
        R(x, '#3a2a40', 38, 28, 16, 27); R(x, '#8e4fc7', 40, 30, 12, 25); R(x, '#a66bd6', 40, 30, 12, 3);
        R(x, '#5b2a86', 45, 30, 2, 25); R(x, '#ffd36e', 49, 43, 2, 2);
        R(x, '#c9b690', 36, 55, 20, 3);
        const tw = F.medir('ESCUELA');
        R(x, '#4a2f1f', 46 - Math.round(tw / 2) - 3, 16, tw + 6, 10);
        F.dibujar(x, 'ESCUELA', 46 - Math.round(tw / 2), 18, { color: '#fff1e0' });
        // campana
        R(x, '#ffd36e', 44, 4, 4, 4); R(x, '#e0a21a', 44, 7, 4, 1); R(x, '#3a2a40', 45, 2, 2, 2);
        // dibujos infantiles en la pared
        R(x, '#ff8fb1', 17 + f, 41, 3, 3); R(x, '#ffd36e', 66, 41, 3, 3); R(x, '#8e4fc7', 81 - f, 42, 2, 2);
        return c.c;
      };
      return anim([mk(0), mk(1)], 1);
    },
    cafe: function () {
      const mk = function (f) {
        const c = nuevo(100, 68), x = c.x;
        // fachada
        R(x, '#e8a458', 6, 10, 88, 54); R(x, '#c98040', 6, 58, 88, 6); R(x, '#f4c080', 6, 10, 88, 2); R(x, '#d08a48', 90, 10, 4, 54);
        // techo
        R(x, '#c4684a', 2, 4, 96, 6); R(x, '#e08a68', 2, 4, 96, 2); R(x, '#8a3a2a', 2, 10, 96, 1);
        // letrero
        const tw = F.medir('CAFÉ') * 2;
        R(x, '#2a1a2e', 50 - Math.round(tw / 2) - 4, 13, tw + 8, 18);
        R(x, '#4a2f4e', 50 - Math.round(tw / 2) - 3, 14, tw + 6, 16);
        F.dibujar(x, 'CAFÉ', 50 - Math.round(tw / 2), 19, { color: '#ffd36e', escala: 2, sombra: '#7a4a12' });
        // toldo morado y crema
        for (let i = 0; i < 80; i += 8) {
          R(x, (i / 8) % 2 ? '#fff1e0' : '#8e4fc7', 10 + i, 33, 8, 7);
          R(x, (i / 8) % 2 ? '#fff1e0' : '#8e4fc7', 11 + i, 40, 6, 1);
          R(x, '#5b2a86', 10 + i, 39, 8, 1);
        }
        // ventanas y puerta
        R(x, '#fff1e0', 12, 44, 22, 18); R(x, '#33466e', 13, 45, 20, 16); R(x, '#4f6ea3', 13, 45, 20, 5);
        R(x, '#fff1e0', 66, 44, 22, 18); R(x, '#33466e', 67, 45, 20, 16); R(x, '#4f6ea3', 67, 45, 20, 5);
        R(x, '#3a2a40', 40, 42, 20, 26); R(x, '#6b4a30', 42, 44, 16, 24); R(x, '#8a5a3a', 42, 44, 7, 24); R(x, '#ffd36e', 55, 56, 2, 2);
        // tazas en la ventana
        R(x, '#fff1e0', 20, 54, 7, 5); R(x, '#8a5a3a', 21, 54, 5, 1); R(x, '#fff1e0', 27, 55, 2, 2);
        R(x, f ? '#ffb3c4' : '#ff8fb1', 22, 50 - f, 1, 2); R(x, f ? '#ffb3c4' : '#ff8fb1', 24, 49 + f, 1, 2);
        R(x, '#fff1e0', 74, 54, 7, 5); R(x, '#8a5a3a', 75, 54, 5, 1);
        // macetas
        R(x, '#c4684a', 8, 60, 6, 4); R(x, '#3f7a3a', 8, 57, 6, 3); R(x, '#ff6f7d', 10, 56, 2, 2);
        R(x, '#c4684a', 86, 60, 6, 4); R(x, '#3f7a3a', 86, 57, 6, 3); R(x, '#ffd36e', 88, 56, 2, 2);
        return c.c;
      };
      return anim([mk(0), mk(1)], 1);
    },
    cabana: function (o) {
      const noche = !!o.noche, nav = !!o.navidad;
      const mk = function (f) {
        const c = nuevo(104, 76), x = c.x;
        // troncos
        for (let y = 28; y < 72; y += 5) {
          R(x, (y / 5) % 2 ? '#a8724a' : '#8a5a3a', 8, y, 88, 4);
          R(x, '#c28a5a', 8, y, 88, 1); R(x, '#5a3a28', 8, y + 4, 88, 1);
          circ(x, '#c28a5a', 8, y + 2, 2); circ(x, '#c28a5a', 95, y + 2, 2);
          R(x, '#6b4a30', 8, y + 2, 1, 1); R(x, '#6b4a30', 95, y + 2, 1, 1);
        }
        R(x, '#4a2f1f', 8, 72, 88, 4);
        // techo a dos aguas
        for (let i = 0; i < 26; i++) {
          const w = 104 - i * 2;
          R(x, i % 4 < 2 ? '#7a3a2f' : '#8a463a', i, 28 - i, w, 1);
        }
        R(x, '#4a1f1a', 0, 28, 104, 3);
        R(x, '#a8584a', 12, 22, 80, 1);
        // chimenea
        R(x, '#7a6a68', 76, 2, 10, 14); R(x, '#5a4a48', 76, 2, 10, 2);
        // frente: puerta y ventanas
        R(x, '#3a2418', 44, 42, 16, 30); R(x, '#6b4a30', 46, 44, 12, 28); R(x, '#8a5a3a', 46, 44, 5, 28); R(x, '#ffd36e', 55, 58, 2, 2);
        const luz = noche ? (f ? '#ffe9a0' : '#ffd36e') : '#9cc4ec';
        R(x, '#3a2418', 14, 42, 22, 18); R(x, luz, 16, 44, 18, 14); R(x, '#3a2418', 24, 44, 2, 14); R(x, '#3a2418', 16, 50, 18, 2);
        R(x, '#3a2418', 68, 42, 22, 18); R(x, luz, 70, 44, 18, 14); R(x, '#3a2418', 78, 44, 2, 14); R(x, '#3a2418', 70, 50, 18, 2);
        if (noche) {
          x.globalAlpha = 0.22; circ(x, '#ffd36e', 25, 51, 14); circ(x, '#ffd36e', 79, 51, 14); x.globalAlpha = 1;
        }
        // macetas / pasto
        if (nav) {
          // guirnalda sobre el alero y moño
          cuerda(x, '#2f7a44', 100, 4, 29, null);
          for (let i = 6; i < 98; i += 7) { R(x, '#2f7a44', i, 29 + yDeCuerda(i, 100, 4, 0), 3, 2); }
          for (let i = 10; i < 96; i += 14) {
            const y = 29 + yDeCuerda(i, 100, 4, 0) + 2;
            R(x, '#d4283a', i, y, 3, 3); R(x, '#ffd36e', i + 1, y + 1, 1, 1);
          }
          for (let i = 4; i < 98; i += 9) {
            const k = Math.floor(i / 9), on = (k + f) % 2 === 0, col = ['#ffd36e', '#ff8fb1', '#7fd0ff'][k % 3];
            R(x, on ? col : mez(col, '#2a1238', 0.5), i, 29 + yDeCuerda(i, 100, 4, 0) + 4, 2, 2);
            if (on) { x.globalAlpha = 0.3; circ(x, col, i + 1, 29 + yDeCuerda(i, 100, 4, 0) + 5, 3); x.globalAlpha = 1; }
          }
          // corona en la puerta
          circ(x, '#2f7a44', 52, 50, 5); circ(x, '#6b4a30', 52, 50, 2);
          R(x, '#d4283a', 50, 54, 5, 2); R(x, '#d4283a', 52, 55, 1, 3);
        }
        return c.c;
      };
      return anim([mk(0), mk(1)], 1.4);
    },
    palapa: function (o) {
      const mk = function (f) {
        const c = nuevo(84, 62), x = c.x, sil = o.col || '#2a1f3d';
        // postes y techo inclinado
        R(x, sil, 8, 20, 3, 42); R(x, sil, 72, 14, 3, 48); R(x, sil, 40, 17, 3, 45);
        for (let i = 0; i < 84; i++) {
          const y = Math.round(18 - i * 0.12);
          R(x, sil, i, y, 1, 5);
        }
        for (let i = 0; i < 84; i += 3) R(x, sil, i, Math.round(23 - i * 0.12), 1, 3);
        // luz cálida
        x.globalAlpha = 0.25; circ(x, '#ffb36b', 42, 36, 18); x.globalAlpha = 1;
        // faroles
        R(x, '#ffd36e', 20, 28, 3, 4); R(x, '#ffd36e', 60, 26, 3, 4);
        R(x, sil, 21, 24, 1, 4); R(x, sil, 61, 22, 1, 4);
        // manta y velas
        R(x, '#ff8fb1', 24, 56, 36, 6); R(x, '#ffc2d0', 24, 56, 36, 1); R(x, '#e86f98', 24, 60, 36, 2);
        for (let i = 26; i < 58; i += 6) R(x, '#fff1e0', i, 58, 2, 2);
        R(x, '#fff1e0', 38, 50, 3, 7); llama(x, 39, 47, f); R(x, '#fff1e0', 47, 52, 3, 5); llama(x, 48, 49, 1 - f);
        // corazones colgando
        for (let i = 0; i < 4; i++) {
          const hx = 14 + i * 18, hy = 28 + (i % 2) * 3;
          R(x, '#ff5d7e', hx, hy, 2, 2); R(x, '#ff5d7e', hx + 3, hy, 2, 2); R(x, '#ff5d7e', hx, hy + 1, 5, 2); R(x, '#ff5d7e', hx + 1, hy + 3, 3, 1); R(x, '#ff5d7e', hx + 2, hy + 4, 1, 1);
        }
        return c.c;
      };
      return anim([mk(0), mk(1)], 3);
    },
    torre: function (o) {
      const c = nuevo(34, 76), x = c.x, col = o.col || '#2a1f3d';
      linea(x, col, 6, 75, 15, 8); linea(x, col, 28, 75, 19, 8);
      linea(x, col, 7, 75, 16, 8); linea(x, col, 27, 75, 18, 8);
      for (let y = 20; y < 76; y += 10) {
        const t = (y - 8) / 67, xl = Math.round(15 - 9 * t), xr = Math.round(19 + 9 * t);
        linea(x, col, xl, y, xr, y); linea(x, col, xl, y, xr, y + 10); linea(x, col, xr, y, xl, y + 10);
      }
      R(x, col, 4, 14, 26, 1); R(x, col, 8, 26, 18, 1); R(x, col, 16, 2, 2, 8);
      [4, 12, 22, 29].forEach(function (px) { R(x, col, px, 15, 1, 3); });
      return est(c.c);
    },
    arco: function () {
      const mk = function (f) {
        const c = nuevo(76, 76), x = c.x;
        // pilares con azulejos
        [4, 56].forEach(function (px) {
          R(x, '#c46b4c', px, 22, 16, 54); R(x, '#a8503a', px + 12, 22, 4, 54);
          for (let y = 26; y < 72; y += 8) {
            R(x, '#f4f0e6', px + 2, y, 8, 8); R(x, '#2f5fb5', px + 3, y + 1, 6, 6); R(x, '#f4f0e6', px + 5, y + 2, 2, 4); R(x, '#f4f0e6', px + 4, y + 3, 4, 2);
            R(x, '#f2c230', px + 5, y + 3, 2, 2);
          }
        });
        // arco
        elip(x, '#2f5fb5', 38, 30, 34, 26); x.clearRect(0, 31, 76, 50);
        elip(x, '#f4f0e6', 38, 30, 30, 22); x.clearRect(0, 31, 76, 50);
        R(x, '#f4f0e6', 8, 22, 60, 3);
        // el hueco muestra un atardecer (de morado a durazno): invita a entrar
        for (let yy = 10; yy < 76; yy++) {
          const hw = yy < 32 ? Math.round(24 * Math.sqrt(Math.max(0, 1 - Math.pow((yy - 32) / 22, 2)))) : 24;
          const col = mez('#4a2a7a', f ? '#ffc79a' : '#ffb089', (yy - 10) / 66);
          R(x, col, 38 - hw, yy, hw * 2, 1);
        }
        R(x, '#ffe9b0', 30, 52, 1, 1); R(x, '#ffe9b0', 46, 44, 1, 1); R(x, '#ffffff', 38, 36, 1, 1); R(x, '#ffe9b0', 24, 40, 1, 1);
        elip(x, '#ffd36e', 38, 66, 6, 4); x.clearRect(30, 68, 16, 8);
        for (let i = 4; i < 72; i += 6) { R(x, '#2f5fb5', i, 8 + Math.abs(Math.round(Math.sin(i / 8) * 2)), 3, 3); }
        // corazón arriba
        const hy = 2 + f;
        R(x, '#ff5d7e', 33, hy, 3, 3); R(x, '#ff5d7e', 39, hy, 3, 3); R(x, '#ff5d7e', 33, hy + 2, 9, 3); R(x, '#ff5d7e', 35, hy + 5, 5, 2); R(x, '#ff5d7e', 37, hy + 7, 1, 1);
        R(x, '#ffd0dc', 34, hy + 1, 1, 1);
        return c.c;
      };
      return anim([mk(0), mk(1)], 2);
    },
    autobus: function () {
      const c = nuevo(104, 46), x = c.x;
      // carrocería amarilla abierta
      R(x, '#f2c230', 4, 20, 96, 16); R(x, '#ffe27a', 4, 20, 96, 2); R(x, '#c9981a', 4, 34, 96, 2);
      R(x, '#f2c230', 0, 26, 8, 8); R(x, '#f2c230', 96, 22, 8, 12);
      // pasamanos de madera y asientos
      R(x, '#8a5a3a', 8, 8, 4, 12); R(x, '#8a5a3a', 90, 8, 4, 12);
      R(x, '#a8724a', 6, 6, 92, 3);
      for (let i = 14; i < 84; i += 18) { R(x, '#8a5a3a', i, 12, 14, 4); R(x, '#a8724a', i, 12, 14, 1); R(x, '#6b4a30', i + 2, 16, 2, 4); }
      // toldo/rayas
      for (let i = 0; i < 92; i += 8) R(x, (i / 8) % 2 ? '#fff1e0' : '#8e4fc7', 6 + i, 2, 8, 4);
      // ventana frontal
      R(x, '#9cc4ec', 86, 22, 10, 7); R(x, '#d4e8f8', 87, 23, 3, 2);
      // ruedas
      [[22, 40], [78, 40]].forEach(function (p) { circ(x, '#2a1f30', p[0], p[1] - 1, 6); circ(x, '#8d7eb0', p[0], p[1] - 1, 3); circ(x, '#2a1f30', p[0], p[1] - 1, 1); });
      R(x, '#ffe27a', 98, 28, 4, 3);
      return est(c.c);
    },
    cuadro: function () {
      const c = nuevo(32, 38), x = c.x;
      R(x, '#4a2f1f', 0, 0, 32, 38); R(x, '#8a5a3a', 2, 2, 28, 34); R(x, '#d9c8a4', 4, 4, 24, 30);
      R(x, '#7fc4d8', 5, 5, 22, 28);
      // alcatraces
      for (let i = 0; i < 6; i++) {
        const px = 8 + (i % 3) * 6 + (i > 2 ? 3 : 0), py = 7 + Math.floor(i / 3) * 6;
        R(x, '#fffaf0', px, py, 4, 5); R(x, '#e9e2d6', px, py + 4, 4, 1); R(x, '#ffd36e', px + 1, py + 2, 1, 2);
        R(x, '#4f9a5a', px + 1, py + 5, 1, 4);
      }
      R(x, '#c43a4a', 10, 22, 12, 4); R(x, '#2a1f30', 11, 26, 10, 6); R(x, '#ffd36e', 13, 23, 6, 1);
      return est(c.c);
    },
    ventana: function () {
      const c = nuevo(38, 50), x = c.x;
      R(x, '#fff1e0', 0, 0, 38, 50); R(x, '#d9c7a4', 0, 48, 38, 2);
      const cielo = [['#8a5a96', 0], ['#c06f8f', 10], ['#f0906f', 20], ['#ffb765', 30], ['#ffd98a', 38]];
      cielo.forEach(function (s, i) { R(x, s[0], 3, 3 + s[1], 32, (cielo[i + 1] ? cielo[i + 1][1] : 44) - s[1]); });
      // palmera en silueta
      R(x, '#2a1f3d', 26, 24, 2, 22); [-6, -3, 0, 3, 6].forEach(function (d) { R(x, '#2a1f3d', 26 + d, 22 + Math.abs(d) / 2, 3, 1); });
      R(x, '#2a1f3d', 3, 40, 32, 6);
      R(x, '#fff1e0', 18, 3, 2, 42); R(x, '#fff1e0', 3, 22, 32, 2);
      R(x, '#8e4fc7', 1, 0, 4, 48); R(x, '#8e4fc7', 33, 0, 4, 48);
      R(x, '#a66bd6', 1, 0, 1, 48);
      return est(c.c);
    },
    refresco: function () {
      const c = nuevo(8, 18), x = c.x;
      R(x, '#ff8a3d', 1, 5, 6, 12); R(x, '#fff1e0', 1, 9, 6, 4); R(x, '#2a7a3a', 1, 7, 6, 1); R(x, '#ff8a3d', 3, 1, 2, 5); R(x, '#ffd36e', 3, 0, 2, 1);
      R(x, '#ffb36b', 1, 5, 1, 4);
      return est(c.c);
    },
    balon: function () {
      const c = nuevo(12, 12), x = c.x;
      circ(x, '#2a1f30', 6, 6, 5); circ(x, '#fffaf0', 6, 6, 4);
      R(x, '#2a1f30', 5, 4, 3, 3); R(x, '#2a1f30', 2, 3, 2, 1); R(x, '#2a1f30', 9, 4, 1, 2); R(x, '#2a1f30', 3, 8, 2, 1); R(x, '#2a1f30', 8, 8, 2, 1);
      return est(c.c);
    },
    silla: function () {
      const c = nuevo(16, 30), x = c.x;
      R(x, '#4a2f1f', 2, 0, 3, 30); R(x, '#4a2f1f', 11, 0, 3, 30);
      R(x, '#6b4a30', 4, 2, 7, 3); R(x, '#6b4a30', 4, 8, 7, 3); R(x, '#6b4a30', 4, 14, 7, 3);
      R(x, '#8a5a3a', 1, 18, 14, 3); R(x, '#a8724a', 1, 18, 14, 1);
      return est(c.c);
    },
    rocaLobo: function () {
      // lobita aullándole a la luna, sobre una roca (el lobo se dibuja al doble de tamaño)
      const c = nuevo(60, 58), x = c.x;
      elip(x, '#352c66', 30, 49, 28, 9); elip(x, '#4a4088', 28, 47, 24, 7); elip(x, '#6a5eb0', 24, 44, 13, 2);
      x.clearRect(0, 56, 60, 2);
      x.drawImage(App.Sprites.loboRim, 16, 12, 26, 30);      // borde de luz de luna
      x.drawImage(App.Sprites.loboOscuro, 18, 14, 26, 30);
      return est(c.c);
    },
    // pancarta colgante con texto (fiestas)
    pancarta: function (o) {
      const texto = o.texto || '', esc = o.escala || 2, tw = F.medir(texto, esc), w = tw + 18, h = 7 * esc + 10;
      const c = nuevo(w, h + 12), x = c.x, col = o.col || '#8e4fc7', osc = mez(col, '#2a1238', 0.4), luz = mez(col, '#ffffff', 0.3);
      R(x, '#5a4a60', 4, 0, 1, 8); R(x, '#5a4a60', w - 5, 0, 1, 8);
      R(x, osc, 0, 6, w, h); R(x, col, 1, 7, w - 2, h - 2); R(x, luz, 1, 7, w - 2, 1);
      for (let i = 0; i < w; i += 6) { R(x, osc, i, 6 + h, 4, 2); R(x, col, i + 1, 6 + h, 2, 1); }
      F.dibujar(x, texto, Math.round((w - tw) / 2), 6 + 5, { escala: esc, color: o.colTexto || '#fff1e0', sombra: osc });
      return est(c.c);
    },
    arbolGrande: function () {
      const mk = function (f) {
        const c = nuevo(110, 120), x = c.x;
        R(x, '#4a3a38', 48, 60, 14, 60); R(x, '#5f4a44', 48, 60, 4, 60); R(x, '#38282a', 58, 60, 4, 60);
        R(x, '#4a3a38', 40, 110, 30, 10); R(x, '#4a3a38', 30, 116, 50, 4);
        R(x, '#4a3a38', 38, 62, 6, 4); R(x, '#4a3a38', 66, 58, 8, 4);
        const col = '#3a6a58', luz = '#56907a', osc = '#2a4a46';
        [[55, 38, 34], [30, 52, 24], [80, 52, 24], [40, 28, 22], [70, 28, 22], [55, 20, 20]].forEach(function (b) { circ(x, osc, b[0] + 2, b[1] + 3, b[2]); });
        [[55, 38, 34], [30, 52, 24], [80, 52, 24], [40, 28, 22], [70, 28, 22], [55, 20, 20]].forEach(function (b) { circ(x, col, b[0], b[1], b[2]); });
        [[48, 24, 12], [66, 30, 10], [34, 46, 9], [78, 46, 9]].forEach(function (b) { circ(x, luz, b[0], b[1], b[2]); });
        // luces de hadas
        const cs = ['#ffd36e', '#ff8fb1', '#fff1e0', '#c9a3ee'];
        const r = A.prng(77);
        for (let i = 0; i < 34; i++) {
          const a = r() * Math.PI * 2, d = r() * 40;
          const px = Math.round(55 + Math.cos(a) * d * 1.15), py = Math.round(38 + Math.sin(a) * d * 0.9);
          if (py > 70 || py < 4) continue;
          const on = (i + f) % 2 === 0, col2 = cs[i % cs.length];
          R(x, on ? col2 : mez(col2, '#2a1238', 0.55), px, py, 2, 2);
          if (on) { x.globalAlpha = 0.25; circ(x, col2, px, py, 3); x.globalAlpha = 1; }
        }
        // columpio de corazones
        return c.c;
      };
      return anim([mk(0), mk(1)], 1.4);
    }
  };

  const cache = {};
  function crear(clave, opts) {
    opts = opts || {};
    const k = clave + '|' + JSON.stringify(opts);
    if (cache[k]) return cache[k];
    const f = P[clave];
    if (!f) { console.warn('Prop desconocido:', clave); return est(nuevo(4, 4).c); }
    const r = f(opts);
    r.w = r.frames[0].width; r.h = r.frames[0].height;
    cache[k] = r;
    return r;
  }

  App.Props = { crear: crear, lista: P };
})(window.App = window.App || {});
