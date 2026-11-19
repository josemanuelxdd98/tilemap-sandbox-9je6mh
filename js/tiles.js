/* ==========================================================================
   TILES: suelos, plataformas de un solo sentido y bloques, por estilo.
   Cada nivel pide un "atlas" (conjunto de piezas de 16x16) según su escenario.
   Variante de borde: bit 1 = no hay suelo a la izquierda, bit 2 = a la derecha.
   ========================================================================== */
(function (App) {
  'use strict';
  const A = App.Arte;
  const nuevo = A.nuevo, hash = A.hash, mez = A.mezclar;

  function moteado(P, c, x0, y0, x1, y1, sem) {
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      const h = hash(x, y, sem);
      if (h < 0.07) P(c.tierraOsc, x, y); else if (h > 0.95) P(c.tierraLuz, x, y);
    }
  }
  function bordes(o, v, colSom, colLuz) {
    // recorta esquinas y marca los costados cuando no hay vecino
    if (v & 1) { o.x.clearRect(0, 0, 1, 1); o.P(colLuz || colSom, 1, 1, 1, 1); }
    if (v & 2) { o.x.clearRect(15, 0, 1, 1); o.P(colSom, 14, 1, 1, 1); }
  }

  /* ---------- pasto / camino (tierra con césped o arena arriba) ---------- */
  function topPasto(c, v) {
    const o = nuevo(16, 16), P = o.P;
    P(c.tierra, 0, 2, 16, 14);
    moteado(P, c, 0, 5, 16, 16, 11);
    P(c.pasto, 0, 0, 16, 3);
    P(c.pastoLuz, 0, 0, 16, 1);
    if (c.hierba) for (let x = 0; x < 16; x++) {
      const hh = hash(x, 0, 13);
      if (hh < 0.45) { P(c.hierba, x, 0); if (hh < 0.2) P(c.hierbaLuz || c.hierba, x, 1); }
    }
    for (let x = 0; x < 16; x++) {
      const h = hash(x, 1, 5);
      if (h < 0.55) P(c.pasto, x, 3);
      if (h < 0.22) P(c.pastoOsc, x, 4);
      if (hash(x, 0, 9) < 0.18) P(c.pastoOsc, x, 1);
    }
    P(c.pastoOsc, 0, 2, 16, 1);
    if (c.piedritas) for (let i = 0; i < 4; i++) P(c.piedritas, Math.floor(hash(i, v, 2) * 14) + 1, 1 + (i % 2));
    if (c.flores) for (let x = 1; x < 16; x += 5) if (hash(x, 3, 7) < 0.6) { P(c.flores, x, 0); }
    bordes(o, v, c.pastoOsc, c.pastoLuz);
    if (v & 1) P(c.tierraOsc, 0, 3, 1, 13);
    if (v & 2) P(c.tierraOsc, 15, 3, 1, 13);
    return o.c;
  }
  function cuerpoTierra(c, v) {
    const o = nuevo(16, 16), P = o.P;
    P(c.tierra, 0, 0, 16, 16);
    moteado(P, c, 0, 0, 16, 16, 23);
    for (let i = 0; i < 2; i++) {
      const px = 2 + Math.floor(hash(i, v, 8) * 10), py = 3 + Math.floor(hash(v, i, 4) * 9);
      P(c.tierraLuz, px, py, 3, 2); P(c.tierraOsc, px, py + 2, 3, 1);
    }
    if (v & 1) P(c.tierraOsc, 0, 0, 1, 16);
    if (v & 2) P(c.tierraOsc, 15, 0, 1, 16);
    return o.c;
  }

  /* ---------- adoquín (Coatepec) ---------- */
  function topAdoquin(c, v) {
    const o = nuevo(16, 16), P = o.P;
    P(c.junta, 0, 0, 16, 16);
    // dos hileras de adoquines arriba
    [[0, 3, 0], [3, 3, 4]].forEach(function (f) {
      for (let x = -4 + f[2]; x < 16; x += 8) {
        const w = 7, xx = Math.max(0, x), ww = Math.min(16, x + w) - xx;
        if (ww <= 0) continue;
        const tono = hash(x, f[0], 3);
        P(tono < 0.3 ? c.piedraSom : tono > 0.7 ? c.piedraLuz : c.piedra, xx, f[0], ww, f[1] - 0);
        P(c.piedraLuz, xx, f[0], ww, 1);
      }
    });
    // mampostería abajo
    for (let fila = 0; fila < 2; fila++) {
      const y = 6 + fila * 5, off = fila ? 4 : 0;
      for (let x = -8 + off; x < 16; x += 8) {
        const xx = Math.max(0, x), ww = Math.min(16, x + 7) - xx;
        if (ww <= 0) continue;
        P(c.muro, xx, y, ww, 4);
        P(c.muroLuz, xx, y, ww, 1);
        P(c.muroSom, xx, y + 3, ww, 1);
      }
    }
    P(c.muro, 0, 16 - 1, 16, 1);
    bordes(o, v, c.junta, c.piedraLuz);
    return o.c;
  }
  function cuerpoMuro(c, v) {
    const o = nuevo(16, 16), P = o.P;
    P(c.junta, 0, 0, 16, 16);
    for (let fila = 0; fila < 3; fila++) {
      const y = fila * 5, off = (fila % 2) ? 4 : 0;
      for (let x = -8 + off; x < 16; x += 8) {
        const xx = Math.max(0, x), ww = Math.min(16, x + 7) - xx;
        if (ww <= 0) continue;
        P(c.muro, xx, y, ww, 4);
        P(c.muroLuz, xx, y, ww, 1);
        P(c.muroSom, xx, y + 3, ww, 1);
      }
    }
    if (v & 1) P(c.junta, 0, 0, 1, 16);
    if (v & 2) P(c.junta, 15, 0, 1, 16);
    return o.c;
  }

  /* ---------- talavera (Puebla) ---------- */
  function topAzulejo(c, v) {
    const o = nuevo(16, 16), P = o.P;
    P(c.muro, 0, 8, 16, 8);
    for (let fila = 0; fila < 2; fila++) for (let col = 0; col < 3; col++) {
      const bx = col * 5 - 0, by = 8 + fila * 4;
      P(c.muroLuz, col * 6 - 2, by, 5, 1);
    }
    // franja de azulejos: dos piezas de 8x8
    [0, 8].forEach(function (x0, i) {
      const fondo = i === 0 ? c.blanco : c.azul, dib = i === 0 ? c.azul : c.blanco;
      P(c.junta, x0, 0, 8, 8);
      P(fondo, x0, 0, 7, 7);
      // dibujo geométrico
      P(dib, x0 + 3, 1, 1, 5); P(dib, x0 + 1, 3, 5, 1);
      P(c.amarillo, x0 + 3, 3, 1, 1);
      P(dib, x0 + 1, 1, 1, 1); P(dib, x0 + 5, 1, 1, 1); P(dib, x0 + 1, 5, 1, 1); P(dib, x0 + 5, 5, 1, 1);
    });
    P(c.blanco, 0, 0, 16, 1);
    for (let x = 0; x < 16; x += 2) P(c.muroSom, x, 7, 1, 1);
    bordes(o, v, c.junta, c.blanco);
    return o.c;
  }
  function cuerpoAzulejoMuro(c, v) {
    const o = nuevo(16, 16), P = o.P;
    P(c.muro, 0, 0, 16, 16);
    for (let fila = 0; fila < 4; fila++) {
      const y = fila * 4, off = (fila % 2) ? 5 : 0;
      for (let x = -10 + off; x < 16; x += 10) {
        const xx = Math.max(0, x), ww = Math.min(16, x + 9) - xx;
        if (ww > 0) { P(c.muroLuz, xx, y, ww, 1); P(c.muroSom, xx, y + 3, ww, 1); }
      }
    }
    if (v & 1) P(c.muroSom, 0, 0, 1, 16);
    if (v & 2) P(c.muroSom, 15, 0, 1, 16);
    return o.c;
  }

  /* ---------- madera (interior / cubierta) ---------- */
  function topMadera(c, v) {
    const o = nuevo(16, 16), P = o.P;
    P(c.madera, 0, 0, 16, 16);
    P(c.maderaLuz, 0, 0, 16, 2);
    P(c.maderaSom, 0, 5, 16, 1);
    P(c.maderaOsc, 0, 10, 16, 1);
    for (let x = 0; x < 16; x++) {
      if (hash(x, 3, 1) < 0.25) P(c.maderaSom, x, 3);
      if (hash(x, 8, 2) < 0.25) P(c.maderaLuz, x, 8);
      if (hash(x, 13, 3) < 0.25) P(c.maderaSom, x, 13);
    }
    P(c.maderaOsc, 5, 0, 1, 5); P(c.maderaOsc, 11, 6, 1, 4); P(c.maderaOsc, 3, 11, 1, 5);
    bordes(o, v, c.maderaOsc, c.maderaLuz);
    return o.c;
  }
  function cuerpoMadera(c, v) {
    const o = nuevo(16, 16), P = o.P;
    P(c.maderaOsc, 0, 0, 16, 16);
    P(c.maderaSom, 0, 4, 16, 1); P(c.maderaSom, 0, 10, 16, 1);
    for (let x = 0; x < 16; x++) if (hash(x, 7, 4) < 0.2) P(c.madera, x, 2 + (x % 3) * 4);
    P(c.maderaSom, 7, 0, 1, 4); P(c.maderaSom, 12, 5, 1, 5);
    return o.c;
  }

  /* ---------- silueta (atardecer): casi negro con luz de borde ---------- */
  function topSilueta(c, v) {
    const o = nuevo(16, 16), P = o.P;
    P(c.tierra, 0, 1, 16, 15);
    P(c.pasto, 0, 0, 16, 2);
    P(c.pastoLuz, 0, 0, 16, 1);
    for (let x = 0; x < 16; x++) {
      if (hash(x, 0, 6) < 0.3) P(c.pastoLuz, x, 2);
      if (hash(x, 2, 6) < 0.25) P(c.pasto, x, 2);
    }
    for (let y = 4; y < 16; y++) for (let x = 0; x < 16; x++) if (hash(x, y, 31) < 0.06) P(c.tierraLuz, x, y);
    bordes(o, v, c.pasto, c.pastoLuz);
    return o.c;
  }

  /* ---------- plataformas (16x8) ---------- */
  function platTablon(c, v) {
    // v: 0 medio, 1 izquierda, 2 derecha, 3 sola
    const o = nuevo(16, 8), P = o.P;
    P(c.luz, 0, 0, 16, 2); P(c.mid, 0, 2, 16, 4); P(c.osc, 0, 6, 16, 2);
    P(c.som, 0, 5, 16, 1);
    for (let x = 0; x < 16; x++) if (hash(x, v, 2) < 0.2) P(c.som, x, 3);
    if (v & 1) { o.x.clearRect(0, 0, 1, 8); o.P(c.osc, 1, 2, 1, 4); o.P(c.clavo, 3, 3); }
    if (v & 2) { o.x.clearRect(15, 0, 1, 8); o.P(c.osc, 14, 2, 1, 4); o.P(c.clavo, 12, 3); }
    return o.c;
  }
  function platToldo(c, v) {
    const o = nuevo(16, 8), P = o.P;
    for (let x = 0; x < 16; x += 4) {
      const col = ((x / 4) % 2) ? c.b : c.a;
      P(col, x, 0, 4, 5); P(col, x + 1, 5, 2, 1);
      P(c.som, x, 4, 4, 1);
    }
    P(c.luz, 0, 0, 16, 1);
    P(c.osc, 0, 6, 16, 1);
    for (let x = 1; x < 16; x += 4) P(c.osc, x, 6, 2, 1);
    if (v & 1) o.x.clearRect(0, 0, 1, 8);
    if (v & 2) o.x.clearRect(15, 0, 1, 8);
    return o.c;
  }
  function platNube(c, v) {
    const o = nuevo(16, 8), P = o.P;
    A.elip(o.x, c.som, 8, 4, 8, 3);
    A.elip(o.x, c.luz, 8, 3, 7, 2);
    A.circ(o.x, c.luz, 4, 3, 3); A.circ(o.x, c.luz, 11, 3, 3);
    P(c.som, 0, 6, 16, 1);
    o.x.clearRect(0, 7, 16, 1);
    if (v & 1) o.x.clearRect(0, 0, 2, 8);
    if (v & 2) o.x.clearRect(14, 0, 2, 8);
    return o.c;
  }
  function platAzulejo(c, v) {
    const o = nuevo(16, 8), P = o.P;
    P(c.blanco, 0, 0, 16, 2);
    for (let x = 0; x < 16; x += 4) { P(((x / 4) % 2) ? c.azul : c.blanco, x, 2, 4, 3); }
    P(c.amarillo, 2, 3, 1, 1); P(c.amarillo, 10, 3, 1, 1);
    P(c.muro, 0, 5, 16, 3); P(c.muroSom, 0, 7, 16, 1);
    if (v & 1) o.x.clearRect(0, 0, 1, 8);
    if (v & 2) o.x.clearRect(15, 0, 1, 8);
    return o.c;
  }
  function platTronco(c, v) {
    const o = nuevo(16, 8), P = o.P;
    P(c.mid, 0, 0, 16, 8);
    P(c.luz, 0, 0, 16, 2);
    P(c.osc, 0, 6, 16, 2);
    for (let x = 1; x < 16; x += 3) if (hash(x, v, 5) < 0.7) P(c.som, x, 2 + (x % 3), 1, 2);
    P(c.musgo, 0, 0, 16, 1);
    for (let x = 0; x < 16; x++) if (hash(x, 0, 8) < 0.4) P(c.musgo, x, 1);
    if (v & 1) { o.x.clearRect(0, 0, 1, 8); A.elip(o.x, c.luz, 2, 4, 2, 3); P(c.som, 2, 4); }
    if (v & 2) { o.x.clearRect(15, 0, 1, 8); A.elip(o.x, c.luz, 13, 4, 2, 3); P(c.som, 13, 4); }
    return o.c;
  }

  /* ---------- bloques sólidos 16x16 ---------- */
  function bloqueCaja(c) {
    const o = nuevo(16, 16), P = o.P;
    P(c.osc, 0, 0, 16, 16); P(c.mid, 1, 1, 14, 14);
    P(c.luz, 1, 1, 14, 1); P(c.som, 1, 14, 14, 1);
    for (let i = 1; i < 14; i++) { P(c.som, i, i); P(c.som, 15 - i, i); }
    P(c.osc, 3, 5, 1, 1); P(c.osc, 12, 10, 1, 1);
    return o.c;
  }
  function bloqueRegalo(c) {
    const o = nuevo(16, 16), P = o.P;
    P(c.osc, 0, 0, 16, 16); P(c.mid, 1, 1, 14, 14);
    P(c.luz, 1, 1, 14, 2); P(c.som, 1, 13, 14, 2);
    P(c.cinta, 7, 0, 2, 16); P(c.cinta, 0, 7, 16, 2);
    P(c.cintaLuz, 7, 0, 1, 16); P(c.cintaLuz, 0, 7, 16, 1);
    // moño
    P(c.cinta, 4, 0, 3, 3); P(c.cinta, 9, 0, 3, 3);
    P(c.cintaLuz, 4, 0, 3, 1); P(c.cintaLuz, 9, 0, 3, 1);
    return o.c;
  }
  function bloqueSaco(c) {
    const o = nuevo(16, 16), P = o.P;
    A.elip(o.x, c.osc, 8, 9, 8, 7); A.elip(o.x, c.mid, 8, 9, 7, 6);
    P(c.luz, 4, 5, 4, 2); P(c.som, 4, 13, 9, 1);
    P(c.osc, 5, 1, 6, 3); P(c.mid, 6, 2, 4, 1); P(c.cinta, 5, 4, 6, 1);
    P(c.cinta, 6, 9, 4, 3); P(c.osc, 7, 10, 2, 1);
    return o.c;
  }
  function bloquePiedra(c) {
    const o = nuevo(16, 16), P = o.P;
    P(c.osc, 0, 0, 16, 16); P(c.mid, 1, 1, 14, 14);
    P(c.luz, 1, 1, 14, 2); P(c.luz, 1, 1, 2, 14);
    P(c.som, 1, 13, 14, 2); P(c.som, 13, 1, 2, 14);
    P(c.osc, 5, 6, 4, 1); P(c.osc, 9, 9, 3, 1); P(c.osc, 4, 10, 1, 2);
    return o.c;
  }
  function bloqueMesa(c) {
    // mesa/cubierta de madera (fiesta)
    const o = nuevo(16, 16), P = o.P;
    P(c.osc, 0, 0, 16, 16); P(c.mid, 1, 1, 14, 14);
    P(c.luz, 0, 0, 16, 2); P(c.som, 1, 11, 14, 1);
    for (let x = 1; x < 15; x++) if (hash(x, 5, 3) < 0.25) P(c.som, x, 4);
    P(c.osc, 3, 12, 2, 4); P(c.osc, 11, 12, 2, 4);
    return o.c;
  }

  const PLAT = { tablon: platTablon, toldo: platToldo, nube: platNube, azulejo: platAzulejo, tronco: platTronco };
  const BLOQ = { caja: bloqueCaja, regalo: bloqueRegalo, saco: bloqueSaco, piedra: bloquePiedra, mesa: bloqueMesa };

  /* cfg: { estilo, c (colores del suelo), plat: {tipo, c}, bloque: {tipo, c} } */
  function crearAtlas(cfg) {
    const e = cfg.estilo;
    let top, cuerpo;
    if (e === 'adoquin') { top = topAdoquin; cuerpo = cuerpoMuro; }
    else if (e === 'azulejo') { top = topAzulejo; cuerpo = cuerpoAzulejoMuro; }
    else if (e === 'madera') { top = topMadera; cuerpo = cuerpoMadera; }
    else if (e === 'silueta') { top = topSilueta; cuerpo = cuerpoTierra; }
    else { top = topPasto; cuerpo = cuerpoTierra; }
    const at = { top: [], cuerpo: [], plat: [], bloque: null };
    for (let v = 0; v < 4; v++) { at.top.push(top(cfg.c, v)); at.cuerpo.push(cuerpo(cfg.c, v)); }
    const pf = PLAT[cfg.plat.tipo] || platTablon;
    for (let v = 0; v < 4; v++) at.plat.push(pf(cfg.plat.c, v));
    const bf = BLOQ[cfg.bloque.tipo] || bloqueCaja;
    at.bloque = bf(cfg.bloque.c);
    return at;
  }

  App.Tiles = { crearAtlas: crearAtlas };
})(window.App = window.App || {});
