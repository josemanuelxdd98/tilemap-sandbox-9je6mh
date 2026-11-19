/* ==========================================================================
   ARTE (parte 1): utilidades de dibujo pixel-art, cielos, nubes, árboles y
   capas de fondo (montañas, colinas, edificios, volcanes, paredes...).
   Todo se genera con código, con números aleatorios "sembrados" para que cada
   escenario siempre se vea igual.
   ========================================================================== */
(function (App) {
  'use strict';

  const ALTO = 176;                 // alto del mundo (11 filas de 16 px)
  const lienzo = App.lienzo;

  /* ------------------------------ utilidades ------------------------------ */
  function prng(semilla) {
    let a = semilla >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hash(x, y, s) {
    let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s || 0, 2147483647)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }
  function nuevo(w, h) {
    const o = lienzo(w, h), x = o[1];
    return { c: o[0], x: x, P: function (col, px, py, pw, ph) { x.fillStyle = col; x.fillRect(px, py, pw === undefined ? 1 : pw, ph === undefined ? 1 : ph); } };
  }
  function R(x, col, px, py, w, h) { x.fillStyle = col; x.fillRect(px | 0, py | 0, w === undefined ? 1 : w, h === undefined ? 1 : h); }
  function circ(x, col, cx, cy, r) {
    x.fillStyle = col;
    for (let dy = -r; dy <= r; dy++) {
      const dx = Math.round(Math.sqrt(r * r - dy * dy + 0.3));
      x.fillRect(cx - dx, cy + dy, dx * 2 + 1, 1);
    }
  }
  function elip(x, col, cx, cy, rx, ry) {
    x.fillStyle = col;
    for (let dy = -ry; dy <= ry; dy++) {
      const dx = Math.round(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry + 0.01))));
      x.fillRect(cx - dx, cy + dy, dx * 2 + 1, 1);
    }
  }
  function tri(x, col, cx, top, baseW, h) {
    x.fillStyle = col;
    for (let i = 0; i < h; i++) {
      const w = Math.max(1, Math.round(baseW * (i + 1) / h));
      x.fillRect(Math.round(cx - w / 2), top + i, w, 1);
    }
  }
  function linea(x, col, x0, y0, x1, y1) {
    x.fillStyle = col;
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      x.fillRect(x0, y0, 1, 1);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }
  // mezcla dos colores #rrggbb
  function mezclar(a, b, t) {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const r = Math.round(((pa >> 16) & 255) * (1 - t) + ((pb >> 16) & 255) * t);
    const g = Math.round(((pa >> 8) & 255) * (1 - t) + ((pb >> 8) & 255) * t);
    const bl = Math.round((pa & 255) * (1 - t) + (pb & 255) * t);
    return '#' + ((1 << 24) | (r << 16) | (g << 8) | bl).toString(16).slice(1);
  }
  // velo de color sólo sobre lo ya dibujado (para dar neblina/atmósfera)
  function velo(c, col, alfa) {
    const x = c.getContext('2d');
    x.save();
    x.globalCompositeOperation = 'source-atop';
    x.globalAlpha = alfa; x.fillStyle = col;
    x.fillRect(0, 0, c.width, c.height);
    x.restore();
  }

  /* ------------------------------ cielo ------------------------------ */
  const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
  // bandas de color con transición "dithering" (típico del pixel art)
  function cielo(w, h, cols) {
    const o = nuevo(w, h), x = o.x, n = cols.length, bh = h / n;
    for (let i = 0; i < n; i++) {
      const y0 = Math.round(i * bh), y1 = Math.round((i + 1) * bh);
      R(x, cols[i], 0, y0, w, y1 - y0);
    }
    for (let i = 0; i < n - 1; i++) {
      const yb = Math.round((i + 1) * bh), filas = 4;
      for (let d = 0; d < filas; d++) {
        const yy = yb - 2 + d, dens = (d + 1) / (filas + 1);
        for (let xx = 0; xx < w; xx++) {
          x.fillStyle = (BAYER[yy & 3][xx & 3] / 16 < dens) ? cols[i + 1] : cols[i];
          x.fillRect(xx, yy, 1, 1);
        }
      }
    }
    return o.c;
  }

  function nube(w, h, luz, som) {
    const o = nuevo(w, h), r = prng(w * 31 + h * 7);
    const n = Math.max(3, Math.floor(w / 9));
    const radios = [], cxs = [];
    for (let i = 0; i < n; i++) {
      cxs.push(Math.round(h * 0.45 + i * (w - h * 0.9) / (n - 1)));
      const t = i / (n - 1), base = h * (0.25 + 0.3 * Math.sin(t * Math.PI));
      radios.push(Math.max(3, Math.round(base + r() * h * 0.12)));
    }
    cxs.forEach(function (cx, i) { circ(o.x, som, cx, h - radios[i] - 1, radios[i]); });
    cxs.forEach(function (cx, i) { circ(o.x, luz, cx, h - radios[i] - 3, Math.max(2, radios[i] - 1)); });
    o.x.clearRect(0, h - 2, w, 2);
    return o.c;
  }

  /* ------------------------------ árboles ------------------------------ */
  function pino(alto, col, luz, tronco) {
    const w = Math.max(10, Math.round(alto * 0.62));
    const o = nuevo(w, alto), x = o.x;
    const tr = Math.max(2, Math.round(alto * 0.12));
    R(x, tronco || '#5a3a28', Math.floor(w / 2) - 1, alto - tr, 2, tr);
    const tiers = 3, th = Math.round((alto - tr) / tiers * 1.5);
    for (let i = 0; i < tiers; i++) {
      const top = Math.round(i * (alto - tr - th) / (tiers - 1 || 1));
      const bw = Math.round(w * (0.5 + 0.5 * (i + 1) / tiers));
      tri(x, col, w / 2, top, bw, th);
      // brillo del lado izquierdo
      for (let k = 0; k < th; k++) {
        const ww = Math.max(1, Math.round(bw * (k + 1) / th));
        R(x, luz, Math.round(w / 2 - ww / 2), top + k, Math.max(1, Math.round(ww * 0.25)), 1);
      }
    }
    return o.c;
  }

  function arbolRedondo(alto, col, luz, tronco) {
    const w = Math.round(alto * 0.8);
    const o = nuevo(w, alto), x = o.x;
    const th = Math.round(alto * 0.4);
    R(x, tronco || '#6b4a30', Math.floor(w / 2) - 1, alto - th, 3, th);
    const rr = Math.round(alto * 0.3);
    circ(x, col, Math.round(w / 2), Math.round(alto * 0.35), rr);
    circ(x, col, Math.round(w * 0.28), Math.round(alto * 0.46), Math.round(rr * 0.7));
    circ(x, col, Math.round(w * 0.72), Math.round(alto * 0.46), Math.round(rr * 0.7));
    circ(x, luz, Math.round(w * 0.42), Math.round(alto * 0.27), Math.round(rr * 0.55));
    return o.c;
  }

  function arbolDesnudo(alto, col, semilla) {
    const w = Math.round(alto * 0.9), o = nuevo(w, alto), x = o.x, r = prng(semilla || 5);
    function rama(x0, y0, ang, len, grosor) {
      if (len < 3) return;
      const x1 = Math.round(x0 + Math.cos(ang) * len), y1 = Math.round(y0 - Math.sin(ang) * len);
      linea(x, col, x0, y0, x1, y1);
      if (grosor > 1) linea(x, col, x0 + 1, y0, x1 + 1, y1);
      rama(x1, y1, ang + 0.5 + r() * 0.4, len * 0.68, grosor - 1);
      rama(x1, y1, ang - 0.5 - r() * 0.4, len * 0.68, grosor - 1);
    }
    rama(Math.round(w / 2), alto - 1, Math.PI / 2, alto * 0.38, 2);
    return o.c;
  }

  function palmera(alto, col, luz) {
    const w = Math.round(alto * 0.9), o = nuevo(w, alto), x = o.x;
    const cx = Math.round(w / 2);
    for (let i = 0; i < alto - 6; i++) { R(x, '#8a6a45', cx + Math.round(Math.sin(i / 14) * 2), alto - 1 - i, 2, 1); }
    const topx = cx + Math.round(Math.sin((alto - 7) / 14) * 2), topy = 6;
    [[-1, 0.2], [-1, 0.6], [1, 0.2], [1, 0.6], [0, 1]].forEach(function (d, i) {
      const dir = d[0], k = d[1];
      for (let t = 0; t < 12; t++) {
        const px = topx + dir * t * (i === 4 ? 0.1 : 1) + (i === 4 ? (t % 2) : 0);
        const py = topy + (i === 4 ? -t * 0.8 : Math.round(-t * (1 - k) * 0.6 + t * t * 0.07 * k * 2));
        R(x, i % 2 ? luz : col, Math.round(px), Math.round(py), 2, 1);
      }
    });
    return o.c;
  }

  function arbusto(w, h, col, luz, flor) {
    const o = nuevo(w, h), x = o.x, r = prng(w * 13 + h);
    elip(x, col, Math.round(w / 2), h - Math.round(h * 0.45), Math.round(w / 2) - 1, Math.round(h * 0.45));
    circ(x, col, Math.round(w * 0.3), h - Math.round(h * 0.5), Math.round(h * 0.4));
    circ(x, col, Math.round(w * 0.7), h - Math.round(h * 0.5), Math.round(h * 0.4));
    circ(x, luz, Math.round(w * 0.4), h - Math.round(h * 0.65), Math.round(h * 0.22));
    if (flor) {
      for (let i = 0; i < Math.round(w / 4); i++) {
        const px = 2 + Math.floor(r() * (w - 4)), py = 1 + Math.floor(r() * (h - 3));
        R(x, flor, px, py, 1, 1);
      }
    }
    return o.c;
  }

  /* ------------------------------ capas de fondo ------------------------------ */
  // Cordillera con picos; periódica (se repite sin costuras)
  function capaMontanas(w, o) {
    const c = nuevo(w, ALTO), x = c.x, r = prng(o.semilla || 1);
    const ks = [1, 2, 3, 5].map(function (k) { return k * (o.frec || 1); });
    const amps = [1, 0.55, 0.3, 0.14], fases = ks.map(function () { return r() * Math.PI * 2; });
    const tops = [];
    for (let i = 0; i < w; i++) {
      let v = 0, s = 0;
      for (let j = 0; j < ks.length; j++) { v += amps[j] * (1 - Math.abs(Math.sin(i / w * Math.PI * ks[j] + fases[j]))); s += amps[j]; }
      tops.push(Math.round(ALTO - o.base - o.amp * (v / s)));
    }
    for (let i = 0; i < w; i++) {
      const t = tops[i];
      R(x, o.col, i, t, 1, ALTO - t);
      const d = tops[(i + 1) % w] - tops[(i - 1 + w) % w];
      const lado = d < 0 ? o.luz : o.som;
      if (lado) R(x, lado, i, t, 1, Math.min(4, ALTO - t));
      if (o.nieve && t < ALTO - o.nieve.nivel) {
        const grosor = Math.round((ALTO - o.nieve.nivel - t) * 0.6) + 1;
        R(x, o.nieve.col, i, t, 1, grosor);
        if (d >= 0) R(x, o.nieve.som || o.nieve.col, i, t, 1, Math.max(1, grosor - 1));
      }
    }
    if (o.velo) velo(c.c, o.velo[0], o.velo[1]);
    return c.c;
  }

  // Colinas suaves
  function capaColinas(w, o) {
    const c = nuevo(w, ALTO), x = c.x, r = prng(o.semilla || 3);
    const ks = [1, 2, 3].map(function (k) { return k * (o.frec || 1); });
    const amps = [1, 0.5, 0.22], fases = ks.map(function () { return r() * Math.PI * 2; });
    const tops = [];
    for (let i = 0; i < w; i++) {
      let v = 0, s = 0;
      for (let j = 0; j < ks.length; j++) { v += amps[j] * (0.5 + 0.5 * Math.sin(i / w * Math.PI * 2 * ks[j] + fases[j])); s += amps[j]; }
      tops.push(Math.round(ALTO - o.base - o.amp * (v / s)));
    }
    for (let i = 0; i < w; i++) {
      const t = tops[i];
      R(x, o.col, i, t, 1, ALTO - t);
      if (o.luz) R(x, o.luz, i, t, 1, 2);
      if (o.som && ((i + t) % 2 === 0)) R(x, o.som, i, t + 3, 1, 1);
    }
    if (o.velo) velo(c.c, o.velo[0], o.velo[1]);
    return { c: c.c, tops: tops };
  }

  // Hilera de árboles sobre una línea base (px desde el fondo)
  function capaArboles(w, o) {
    const c = nuevo(w, ALTO), x = c.x, r = prng(o.semilla || 7);
    const base = ALTO - o.base;
    if (o.suelo) R(x, o.suelo, 0, base, w, ALTO - base);
    let px = 0;
    while (px < w) {
      const alto = Math.round(o.altoMin + r() * (o.altoMax - o.altoMin));
      const tipo = o.tipos[Math.floor(r() * o.tipos.length)];
      let s;
      if (tipo === 'pino') s = pino(alto, o.col, o.luz, o.tronco);
      else if (tipo === 'palmera') s = palmera(alto, o.col, o.luz);
      else if (tipo === 'desnudo') s = arbolDesnudo(alto, o.colDesnudo || o.col, Math.floor(r() * 99));
      else s = arbolRedondo(alto, o.col, o.luz, o.tronco);
      x.drawImage(s, px, base - alto + 2 + (o.hundir || 0));
      // repetir en el borde para que sea periódico
      if (px + s.width > w) x.drawImage(s, px - w, base - alto + 2 + (o.hundir || 0));
      px += Math.round(s.width * (o.sep || 0.6) + r() * (o.hueco || 8));
    }
    if (o.velo) velo(c.c, o.velo[0], o.velo[1]);
    return c.c;
  }

  /* ---- casas coloniales (Coatepec / Puebla) ---- */
  function casaColonial(o) {
    const w = o.w, h = o.h, c = nuevo(w, h), x = c.x, r = prng(o.semilla || w * h);
    const col = o.color, som = mezclar(col, '#2a1238', 0.22), luz = mezclar(col, '#ffffff', 0.25);
    R(x, col, 0, 6, w, h - 6);
    R(x, som, w - 3, 6, 3, h - 6);
    R(x, luz, 0, 6, 2, h - 6);
    // zócalo
    R(x, mezclar(col, '#2a1238', 0.35), 0, h - 8, w, 8);
    // techo de teja
    if (o.techo === 'dos-aguas') {
      for (let i = 0; i < 7; i++) R(x, i % 2 ? '#b5533a' : '#c4684a', i, 6 - i, w - i * 2, 1);
      R(x, '#8a3a2a', 0, 6, w, 1);
    } else {
      R(x, '#c4684a', 0, 2, w, 4);
      R(x, '#8a3a2a', 0, 6, w, 1);
      for (let i = 0; i < w; i += 3) R(x, '#e08a68', i, 3, 1, 1);
    }
    // ventanas
    const pisos = o.pisos || 2, hv = 9, sepY = Math.floor((h - 8 - 14) / pisos);
    const nv = Math.max(1, Math.floor((w - 6) / 14));
    for (let p = 0; p < pisos; p++) {
      for (let k = 0; k < nv; k++) {
        const vx = Math.round(3 + (k + 0.5) * (w - 6) / nv - 4), vy = 12 + p * sepY;
        if (p === pisos - 1 && k === Math.floor(nv / 2) && o.puerta !== false) continue;
        R(x, '#fff1e0', vx - 1, vy - 1, 10, hv + 2);
        R(x, '#31456e', vx, vy, 8, hv);
        R(x, '#4f6ea3', vx, vy, 8, 3);
        R(x, '#fff1e0', vx + 3, vy, 1, hv);
        if (o.balcon && p === 0) {
          R(x, '#2a1a2e', vx - 2, vy + hv + 1, 12, 1);
          for (let b = 0; b < 12; b += 3) R(x, '#2a1a2e', vx - 2 + b, vy + hv + 1, 1, 3);
          if (r() < 0.6) { R(x, '#3f7a3a', vx + 1, vy + hv, 3, 2); R(x, ['#ff6f7d', '#ffd36e', '#ff8fb1'][Math.floor(r() * 3)], vx + 2, vy + hv - 1, 1, 1); }
        }
      }
    }
    // puerta
    if (o.puerta !== false) {
      const dx = Math.round(w / 2 - 4);
      R(x, '#fff1e0', dx - 1, h - 22, 10, 22);
      R(x, o.puertaCol || '#6b4a30', dx, h - 21, 8, 21);
      R(x, '#4a3020', dx + 3, h - 21, 1, 21);
      R(x, '#ffd36e', dx + 5, h - 11, 1, 1);
    }
    return c.c;
  }

  function torreIglesia(h) {
    const w = 26, c = nuevo(w, h), x = c.x;
    const piedra = '#e6c9a0', som = '#c9a07a', luz = '#f6e2c0';
    // cúpula + cruz
    elip(x, '#c4684a', 13, 22, 9, 9); x.clearRect(0, 23, w, 4);
    R(x, '#8a3a2a', 4, 22, 18, 1);
    R(x, '#3a2a1a', 13, 4, 1, 8); R(x, '#3a2a1a', 11, 6, 5, 1);
    // campanario
    R(x, piedra, 4, 23, 18, h - 23); R(x, som, 19, 23, 3, h - 23); R(x, luz, 4, 23, 2, h - 23);
    R(x, som, 3, 23, 20, 2);
    R(x, '#3a2a40', 9, 28, 8, 14); elip(x, '#3a2a40', 13, 28, 4, 4);
    R(x, '#ffd36e', 12, 36, 2, 3);
    // base
    R(x, som, 3, h - 10, 20, 2);
    R(x, '#2a1a30', 10, h - 8, 6, 8); elip(x, '#2a1a30', 13, h - 8, 3, 3);
    return c.c;
  }

  // Fila de edificios coloniales; con torres de iglesia opcionales
  function capaEdificios(w, o) {
    const c = nuevo(w, ALTO), x = c.x, r = prng(o.semilla || 11);
    const base = ALTO - o.base;
    R(x, o.suelo || '#6b5560', 0, base, w, ALTO - base);
    let px = -6;
    const torres = (o.torres || []).slice();
    while (px < w) {
      let s, ancho;
      if (torres.length && px > torres[0]) {
        torres.shift();
        s = torreIglesia(o.altoMax + 18);
      } else {
        ancho = Math.round(o.anchoMin + r() * (o.anchoMax - o.anchoMin));
        const alto = Math.round(o.altoMin + r() * (o.altoMax - o.altoMin));
        s = casaColonial({ w: ancho, h: alto, color: o.paleta[Math.floor(r() * o.paleta.length)], pisos: alto > 64 ? 2 : 1, balcon: r() < 0.5, techo: r() < 0.35 ? 'dos-aguas' : 'plano', semilla: Math.floor(r() * 1e6) });
      }
      x.drawImage(s, px, base - s.height + 1);
      if (px + s.width > w) x.drawImage(s, px - w, base - s.height + 1);
      px += s.width - 1 + (o.hueco || 0);
    }
    if (o.velo) velo(c.c, o.velo[0], o.velo[1]);
    return c.c;
  }

  // Casitas de colores trepando un cerro (estilo ciudad en la montaña)
  function capaCasitasCerro(w, o) {
    const c = nuevo(w, ALTO), x = c.x, r = prng(o.semilla || 17);
    const colina = capaColinas(w, { base: o.base, amp: o.amp, col: o.cerroCol, semilla: o.semilla + 1, frec: o.frec || 1 });
    x.drawImage(colina.c, 0, 0);
    const tops = colina.tops;
    let px = 2;
    while (px < w - 14) {
      const ancho = 12 + Math.floor(r() * 10), alto = 10 + Math.floor(r() * 10);
      const t = Math.min(tops[Math.min(w - 1, px)], tops[Math.min(w - 1, px + ancho)]);
      const col = o.paleta[Math.floor(r() * o.paleta.length)];
      const filas = 1 + Math.floor(r() * 2);
      for (let f = 0; f < filas; f++) {
        const yy = t + f * (alto + 1) + 2;
        if (yy + alto > ALTO) break;
        R(x, col, px, yy, ancho, alto);
        R(x, mezclar(col, '#2a1238', 0.25), px + ancho - 2, yy, 2, alto);
        R(x, '#8a3a2a', px - 1, yy - 1, ancho + 2, 1);
        for (let k = 0; k < Math.floor(ancho / 6); k++) {
          R(x, '#2a3a63', px + 2 + k * 5, yy + 3, 3, 4);
          R(x, '#fff1e0', px + 2 + k * 5, yy + 3, 3, 1);
        }
      }
      px += ancho + Math.floor(r() * 3);
    }
    // pinos sueltos
    for (let i = 0; i < 6; i++) {
      const p = pino(14 + Math.floor(r() * 10), '#3f7a4a', '#5a9a5a');
      const pxx = Math.floor(r() * w);
      x.drawImage(p, pxx, Math.min(tops[pxx], ALTO - 30) - 4);
    }
    if (o.velo) velo(c.c, o.velo[0], o.velo[1]);
    return c.c;
  }

  // Volcanes nevados (Popocatépetl + Iztaccíhuatl)
  function capaVolcanes(w, o) {
    const c = nuevo(w, ALTO), x = c.x, r = prng(7);
    function cono(cx, mitad, alto, col, luz, nieveCol, picoPlano) {
      for (let i = -mitad; i <= mitad; i++) {
        const t = Math.abs(i) / mitad;
        let h = Math.round(alto * (1 - Math.pow(t, 0.8)) + (r() - 0.5) * 1.2);
        if (picoPlano && h > alto - 3) h = alto - 3;
        const px = cx + i; if (px < 0 || px >= w) continue;
        const top = ALTO - o.base - h;
        R(x, col, px, top, 1, ALTO - top);
        if (i < 0) R(x, luz, px, top, 1, 3);
        if (h > alto * 0.62) {
          const g = Math.round((h - alto * 0.62) * 0.9) + 1;
          R(x, nieveCol, px, top, 1, g);
        }
      }
    }
    // Iztaccíhuatl (la mujer dormida): varias cumbres alargadas
    const izx = Math.round(w * 0.3);
    [[-52, 14, 40], [-30, 16, 52], [-6, 14, 44], [18, 16, 38], [44, 12, 30]].forEach(function (d) {
      cono(izx + d[0], d[1] + 6, d[2], o.col, o.luz, o.nieve, false);
    });
    // Popocatépetl: cono perfecto con fumarola
    const px0 = Math.round(w * 0.72);
    cono(px0, 46, 76, o.col, o.luz, o.nieve, true);
    for (let i = 0; i < 5; i++) {
      circ(x, 'rgba(230,225,240,' + (0.7 - i * 0.12) + ')', px0 + 3 + i * 4, ALTO - o.base - 76 - 4 - i * 4, 3 + i);
    }
    if (o.velo) velo(c.c, o.velo[0], o.velo[1]);
    return c.c;
  }

  // Catedral de dos torres (Puebla)
  function catedral() {
    const w = 120, h = 96, c = nuevo(w, h), x = c.x;
    const p = '#e9d5ae', som = '#c9aa7e', luz = '#f8ead0', tej = '#c4684a';
    function torre(tx) {
      R(x, p, tx, 28, 26, h - 28); R(x, som, tx + 22, 28, 4, h - 28); R(x, luz, tx, 28, 2, h - 28);
      R(x, som, tx - 2, 26, 30, 3);
      R(x, p, tx + 4, 10, 18, 17); R(x, som, tx + 18, 10, 4, 17);
      elip(x, tej, tx + 13, 10, 11, 9); x.clearRect(tx, 11, 26, 10);
      R(x, '#8a3a2a', tx + 2, 10, 22, 1);
      R(x, '#3a2a1a', tx + 13, 0, 1, 8); R(x, '#3a2a1a', tx + 11, 2, 5, 1);
      R(x, '#3a2a40', tx + 8, 14, 10, 10); elip(x, '#3a2a40', tx + 13, 14, 5, 4);
      R(x, '#3a2a40', tx + 9, 36, 8, 14); elip(x, '#3a2a40', tx + 13, 36, 4, 4);
      R(x, '#3a2a40', tx + 9, 58, 8, 14); elip(x, '#3a2a40', tx + 13, 58, 4, 4);
    }
    torre(4); torre(w - 30);
    R(x, p, 30, 44, 60, h - 44); R(x, som, 30, 44, 60, 2); R(x, luz, 30, 46, 60, 1);
    elip(x, tej, 60, 44, 22, 10); x.clearRect(30, 45, 60, 12);
    R(x, '#8a3a2a', 30, 44, 60, 1);
    circ(x, '#3a2a40', 60, 58, 6); circ(x, '#e08fc0', 60, 58, 4); R(x, '#3a2a40', 60, 52, 1, 13); R(x, '#3a2a40', 54, 58, 13, 1);
    R(x, '#2a1a30', 52, h - 26, 16, 26); elip(x, '#2a1a30', 60, h - 26, 8, 8);
    R(x, '#6b4a30', 55, h - 24, 4, 24); R(x, '#6b4a30', 61, h - 24, 4, 24);
    R(x, '#ffd36e', 59, h - 12, 1, 2); R(x, '#ffd36e', 61, h - 12, 1, 2);
    return c.c;
  }

  // Interior: pared con zoclo, repetible
  function capaPared(w, o) {
    const c = nuevo(w, ALTO), x = c.x, r = prng(o.semilla || 21);
    R(x, o.pared, 0, 0, w, ALTO);
    // textura de estuco
    for (let i = 0; i < w * 5; i++) {
      const px = Math.floor(r() * w), py = Math.floor(r() * ALTO);
      R(x, r() < 0.5 ? o.paredLuz : o.paredSom, px, py, 1, 1);
    }
    // zoclo / lambrín
    const zy = ALTO - o.zocalo;
    R(x, o.zocaloCol, 0, zy, w, o.zocalo);
    R(x, o.zocaloLuz, 0, zy, w, 2);
    for (let px = 0; px < w; px += 18) R(x, o.zocaloSom, px, zy + 2, 1, o.zocalo - 2);
    return c.c;
  }

  App.Arte = {
    ALTO: ALTO,
    prng: prng, hash: hash, nuevo: nuevo, R: R, circ: circ, elip: elip, tri: tri, linea: linea,
    mezclar: mezclar, velo: velo,
    cielo: cielo, nube: nube,
    pino: pino, arbolRedondo: arbolRedondo, arbolDesnudo: arbolDesnudo, palmera: palmera, arbusto: arbusto,
    capaMontanas: capaMontanas, capaColinas: capaColinas, capaArboles: capaArboles,
    casaColonial: casaColonial, torreIglesia: torreIglesia, capaEdificios: capaEdificios,
    capaCasitasCerro: capaCasitasCerro, capaVolcanes: capaVolcanes, catedral: catedral, capaPared: capaPared
  };
})(window.App = window.App || {});
