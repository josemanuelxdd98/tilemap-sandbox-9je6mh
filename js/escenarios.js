/* ==========================================================================
   ESCENARIOS: un decorado por recuerdo (cielo, sol/luna, nubes, capas con
   paralaje, suelo, ambiente). Cada escenario evoca el lugar y la foto del
   recuerdo, siempre con tonos cálidos y moraditos.
   ========================================================================== */
(function (App) {
  'use strict';
  const A = App.Arte, T = App.Tiles, Pr = App.Props, ALTO = A.ALTO;
  const R = A.R, circ = A.circ, linea = A.linea, mez = A.mezclar;
  const LW = 512;

  /* ---------- helpers de capas con detalles dibujados encima ---------- */
  function postesConAlambre(ctx, tops, col, desde, hasta, paso, alto) {
    for (let px = desde; px < hasta; px += paso) {
      const t = tops[px % tops.length];
      R(ctx, col, px, t - alto, 2, alto + 2);
    }
    for (let px = desde; px + paso < hasta; px += paso) {
      const t0 = tops[px % tops.length], t1 = tops[(px + paso) % tops.length];
      linea(ctx, col, px + 1, t0 - alto + 2, px + paso, t1 - alto + 2);
      linea(ctx, col, px + 1, t0 - Math.round(alto / 2), px + paso, t1 - Math.round(alto / 2));
    }
  }

  const TEMAS = {
    /* ===== 1. La Sombra: sierra con niebla, camino de tierra ===== */
    sierra: function () {
      return {
        cielo: ['#7fb2e6', '#98c3ea', '#b2d2ee', '#cde0f0', '#e6ecf2', '#f5eee6', '#ffe7cf'],
        celeste: { tipo: 'sol', fx: 0.8, fy: 0.3, r: 11, col: '#fff6d8', halo: '#ffe9bd' },
        nubes: { n: 7, luz: '#ffffff', som: '#d3e0ee', ymin: 8, ymax: 60 },
        capas: [
          { vel: 0.10, hacer: function () { return A.capaMontanas(LW, { base: 78, amp: 60, col: '#9db5d2', luz: '#b4c8e0', som: '#8aa2c0', frec: 1, semilla: 3, velo: ['#dfe9f5', 0.25] }); } },
          { vel: 0.22, hacer: function () { return A.capaMontanas(LW, { base: 50, amp: 54, col: '#6f9a8a', luz: '#86b09a', som: '#5a8474', frec: 2, semilla: 8, velo: ['#cfe2e8', 0.22] }); } },
          { vel: 0.30, niebla: true, hacer: function () {
            const c = A.nuevo(LW, ALTO), r = A.prng(41);
            for (let i = 0; i < 16; i++) {
              const cx = Math.round(i * LW / 16 + r() * 20), cy = 78 + Math.round(r() * 40), rx = 44 + Math.round(r() * 40), ry = 5 + Math.round(r() * 6);
              c.x.globalAlpha = 0.3; A.elip(c.x, '#ffffff', cx, cy, rx, ry);
              c.x.globalAlpha = 0.25; A.elip(c.x, '#ffffff', (cx + LW) % LW, cy, rx, ry);
            }
            c.x.globalAlpha = 1;
            return c.c;
          } },
          { vel: 0.42, hacer: function () { return A.capaArboles(LW, { base: 36, altoMin: 28, altoMax: 50, tipos: ['pino', 'pino', 'redondo'], col: '#3f7a55', luz: '#5a9a6a', suelo: '#3f7a55', semilla: 2, sep: 0.55, hueco: 4, velo: ['#bfd8d8', 0.18] }); } },
          { vel: 0.58, hacer: function () {
            const col = A.capaColinas(LW, { base: 24, amp: 20, col: '#4a8a4e', luz: '#6aaa5e', som: '#3a7040', semilla: 5, frec: 2 });
            const x = col.c.getContext('2d'), r = A.prng(9);
            for (let i = 0; i < 9; i++) {
              const px = Math.floor(r() * (LW - 30)), t = col.tops[px];
              const arb = A.arbolDesnudo(40 + Math.floor(r() * 18), '#4a3a38', 4 + i);
              x.drawImage(arb, px, t - arb.height + 6);
            }
            for (let i = 0; i < 7; i++) {
              const px = Math.floor(r() * (LW - 30)), t = col.tops[px];
              const p = A.pino(44 + Math.floor(r() * 16), '#2f6b44', '#4f8f5a');
              x.drawImage(p, px, t - p.height + 8);
            }
            return col.c;
          } }
        ],
        atlas: {
          estilo: 'pasto',
          c: { pasto: '#d8b67e', pastoLuz: '#ecd29c', pastoOsc: '#a8804e', tierra: '#7a5a3c', tierraOsc: '#5d422c', tierraLuz: '#946f48', piedritas: '#9a8a78', hierba: '#5aa84a', hierbaLuz: '#7ac45e' },
          plat: { tipo: 'tronco', c: { mid: '#8a6a45', luz: '#a8854f', osc: '#5a4228', som: '#6f5336', musgo: '#5a9a4a' } },
          bloque: { tipo: 'piedra', c: { osc: '#4a4458', mid: '#8c849a', luz: '#aaa3b8', som: '#6a6275' } }
        },
        foso: { tipo: 'agua', col: '#4aa8d4', luz: '#a8e4f4' },
        ambiente: { tipo: 'niebla', n: 5 },
        sombra: 'rgba(40,50,40,0.35)'
      };
    },

    /* ===== 2. Coatepec: calle colonial al atardecer, café ===== */
    coatepec: function () {
      return {
        cielo: ['#7f7fd5', '#9a8fdb', '#b99cdc', '#d9a8d4', '#f2b2b6', '#ffc79a', '#ffdca6'],
        celeste: { tipo: 'sol', fx: 0.2, fy: 0.5, r: 13, col: '#fff0c0', halo: '#ffd9a0' },
        nubes: { n: 6, luz: '#ffe3ea', som: '#e8b4cc', ymin: 8, ymax: 56 },
        capas: [
          { vel: 0.08, hacer: function () { return A.capaMontanas(LW, { base: 92, amp: 52, col: '#9c8cc8', luz: '#b4a2da', som: '#8878b4', frec: 1, semilla: 12, velo: ['#e8cfe8', 0.2] }); } },
          { vel: 0.24, hacer: function () { return A.capaEdificios(LW, { base: 40, altoMin: 40, altoMax: 70, anchoMin: 24, anchoMax: 36, paleta: ['#d8a8b0', '#e0c0a0', '#a8b0d0', '#d0a0c0', '#e8d0a0'], suelo: '#a08aa8', semilla: 4, velo: ['#ecc8e0', 0.4], hueco: 0 }); } },
          { vel: 0.48, hacer: function () { return A.capaEdificios(LW, { base: 24, altoMin: 62, altoMax: 96, anchoMin: 30, anchoMax: 46, paleta: ['#e0a458', '#c4684a', '#4f9a96', '#e3899a', '#f3dfb5', '#e8c25a', '#5f87c2', '#b87ad0'], suelo: '#6b5560', semilla: 15, torres: [190], hueco: 0, velo: ['#ffb08a', 0.08] }); } }
        ],
        atlas: {
          estilo: 'adoquin',
          c: { junta: '#5a4a52', piedra: '#a39095', piedraLuz: '#c0b0b2', piedraSom: '#8a777c', muro: '#b89a8a', muroLuz: '#d0b4a2', muroSom: '#8f7568' },
          plat: { tipo: 'toldo', c: { a: '#8e4fc7', b: '#fff1e0', luz: '#ffffff', som: '#c9b8d8', osc: '#5b2a86' } },
          bloque: { tipo: 'saco', c: { osc: '#5a3a22', mid: '#c9a06a', luz: '#e0bb86', som: '#a88450', cinta: '#8a3a2a' } }
        },
        foso: { tipo: 'abismo' },
        ambiente: { tipo: 'petalos', n: 22, cols: ['#e3b4f0', '#ff8fb1', '#c9a3ee', '#fff1e0'] },
        sombra: 'rgba(60,30,70,0.35)'
      };
    },

    /* ===== 3. La Joya: cabaña con guirnalda navideña al anochecer ===== */
    joya: function () {
      return {
        cielo: ['#2f2a63', '#463776', '#6a437f', '#97508a', '#c45f84', '#e8836f', '#ffb36b'],
        celeste: { tipo: 'luna', fx: 0.82, fy: 0.22, r: 7, col: '#fff4d0', halo: '#b8a0e0' },
        estrellas: 26,
        nubes: { n: 4, luz: '#a96a98', som: '#7a4a86', ymin: 20, ymax: 60 },
        capas: [
          { vel: 0.09, hacer: function () { return A.capaMontanas(LW, { base: 78, amp: 58, col: '#4a3a78', luz: '#5e4c8e', som: '#3a2c64', frec: 1, semilla: 14, velo: ['#9a5a90', 0.2] }); } },
          { vel: 0.26, hacer: function () { return A.capaArboles(LW, { base: 40, altoMin: 30, altoMax: 52, tipos: ['pino'], col: '#2c4666', luz: '#3a5a7a', suelo: '#2c4666', semilla: 6, sep: 0.5, hueco: 3, velo: ['#7a4a86', 0.18] }); } },
          { vel: 0.5, hacer: function () {
            const c = A.capaArboles(LW, { base: 24, altoMin: 40, altoMax: 66, tipos: ['pino', 'pino', 'redondo'], col: '#244a44', luz: '#31665a', suelo: '#244a44', semilla: 19, sep: 0.5, hueco: 14, velo: ['#5a3a70', 0.12] });
            const x = c.getContext('2d'), r = A.prng(5);
            for (let i = 0; i < 12; i++) { R(x, '#ffd36e', Math.floor(r() * LW), 120 + Math.floor(r() * 40), 2, 2); }
            return c;
          } }
        ],
        atlas: {
          estilo: 'pasto',
          c: { pasto: '#3f7a55', pastoLuz: '#5a9a6a', pastoOsc: '#2d5a42', tierra: '#5a4234', tierraOsc: '#3f2c24', tierraLuz: '#7a5a44' },
          plat: { tipo: 'tablon', c: { luz: '#c28a5a', mid: '#a8724a', osc: '#6b4a30', som: '#8a5a3a', clavo: '#4a2f1f' } },
          bloque: { tipo: 'regalo', c: { osc: '#7a1f2f', mid: '#c43a4a', luz: '#e86a78', som: '#9a2a3a', cinta: '#ffd36e', cintaLuz: '#fff3a0' } }
        },
        foso: { tipo: 'abismo' },
        ambiente: { tipo: 'brillos', n: 26, cols: ['#ffd36e', '#fff1e0', '#ff8fb1'] },
        sombra: 'rgba(20,10,40,0.4)'
      };
    },

    /* ===== 4. La Sombra de noche: luna, luciérnagas ===== */
    noche: function () {
      return {
        cielo: ['#0c0826', '#140c3a', '#1e1250', '#2c1a66', '#3d2478', '#533088', '#6a3f96'],
        celeste: { tipo: 'luna', fx: 0.74, fy: 0.3, r: 17, col: '#fff4d0', halo: '#9a8ad8' },
        estrellas: 80,
        nubes: { n: 3, luz: '#5a3f96', som: '#3a2a70', ymin: 24, ymax: 80 },
        capas: [
          { vel: 0.08, hacer: function () { return A.capaMontanas(LW, { base: 78, amp: 62, col: '#2a1f5a', luz: '#3a2e74', som: '#1e1548', frec: 1, semilla: 23 }); } },
          { vel: 0.22, hacer: function () { return A.capaMontanas(LW, { base: 48, amp: 52, col: '#1f1848', luz: '#2c2460', som: '#161038', frec: 2, semilla: 27 }); } },
          { vel: 0.4, hacer: function () { return A.capaArboles(LW, { base: 32, altoMin: 34, altoMax: 58, tipos: ['pino'], col: '#171236', luz: '#241c4a', suelo: '#171236', semilla: 31, sep: 0.5, hueco: 3 }); } },
          { vel: 0.6, hacer: function () {
            const col = A.capaColinas(LW, { base: 20, amp: 14, col: '#120d2e', luz: '#2a2260', semilla: 33, frec: 2 });
            const x = col.c.getContext('2d'), r = A.prng(12);
            for (let i = 0; i < 8; i++) {
              const px = Math.floor(r() * (LW - 30)), t = col.tops[px];
              const p = A.pino(46 + Math.floor(r() * 20), '#0f0b28', '#1c1642');
              x.drawImage(p, px, t - p.height + 8);
            }
            return col.c;
          } }
        ],
        atlas: {
          estilo: 'pasto',
          c: { pasto: '#2f5a6a', pastoLuz: '#6a9aaa', pastoOsc: '#1f3f50', tierra: '#2a2048', tierraOsc: '#1c1436', tierraLuz: '#3d3262' },
          plat: { tipo: 'tronco', c: { mid: '#5a4a6a', luz: '#8a7aa0', osc: '#2f2640', som: '#463a58', musgo: '#3f7a6a' } },
          bloque: { tipo: 'piedra', c: { osc: '#1c1436', mid: '#4a4068', luz: '#6a5f8c', som: '#352c54' } }
        },
        foso: { tipo: 'agua', col: '#26398a', luz: '#6a8ad8' },
        ambiente: { tipo: 'luciernagas', n: 34, cols: ['#fff3a0', '#e8ff9a', '#ffd36e'] },
        sombra: 'rgba(0,0,10,0.45)'
      };
    },

    /* ===== 5. Acajete: atardecer en la loma (foto 5) + San Valentín ===== */
    acajete: function () {
      return {
        cielo: ['#3b3170', '#4f3f82', '#6e4c8e', '#97588f', '#c46f8c', '#ee8f72', '#ffb765', '#ffd98a'],
        celeste: { tipo: 'sol', fx: 0.26, fy: 0.5, r: 16, col: '#fff1b8', halo: '#ffc27a' },
        estrellas: 18,
        nubes: { n: 6, luz: '#ffb08a', som: '#c06a8a', ymin: 6, ymax: 70 },
        capas: [
          { vel: 0.05, hacer: function () { return A.capaMontanas(LW, { base: 70, amp: 38, col: '#7a5a96', luz: '#8e6aa8', som: '#664a84', frec: 1, semilla: 41, velo: ['#e8a58a', 0.4] }); } },
          { vel: 0.3, hacer: function () {
            const col = A.capaColinas(LW, { base: 44, amp: 24, col: '#3a2a52', luz: '#a05a74', semilla: 21, frec: 1 });
            const x = col.c.getContext('2d'), tops = col.tops;
            const torre = Pr.crear('torre', { col: '#2f2248' }).frames[0];
            const tx = 36;
            x.drawImage(torre, tx, tops[tx + 17] - torre.height + 6);
            linea(x, '#2f2248', tx + 4, tops[tx + 17] - 60, tx + 150, tops[tx + 150] - 42);
            linea(x, '#2f2248', tx + 29, tops[tx + 17] - 52, tx + 170, tops[tx + 170] - 36);
            // cobertizo (palapa) del recuerdo
            const sx = 300, sy = tops[sx + 10];
            R(x, '#2f2248', sx, sy - 14, 2, 14); R(x, '#2f2248', sx + 20, sy - 17, 2, 17);
            for (let i = 0; i < 28; i++) R(x, '#2f2248', sx - 3 + i, sy - 16 - Math.round(i * 0.12), 1, 3);
            postesConAlambre(x, tops, '#2a1f40', 20, 100, 12, 9);
            postesConAlambre(x, tops, '#2a1f40', 380, 500, 12, 9);
            return col.c;
          } },
          { vel: 0.52, hacer: function () {
            const col = A.capaColinas(LW, { base: 24, amp: 14, col: '#261b3c', luz: '#a8586a', semilla: 22, frec: 2 });
            const x = col.c.getContext('2d');
            postesConAlambre(x, col.tops, '#1d1531', 8, LW - 20, 16, 10);
            return col.c;
          } }
        ],
        atlas: {
          estilo: 'silueta',
          c: { pasto: '#241a3a', pastoLuz: '#c0687a', tierra: '#1d1531', tierraLuz: '#33264a' },
          plat: { tipo: 'tablon', c: { luz: '#c0687a', mid: '#3a2a52', osc: '#241a3a', som: '#2f2245', clavo: '#241a3a' } },
          bloque: { tipo: 'regalo', c: { osc: '#7a1f45', mid: '#ff5d8a', luz: '#ffa0b8', som: '#d4406e', cinta: '#fff1e0', cintaLuz: '#ffffff' } }
        },
        foso: { tipo: 'abismo' },
        ambiente: { tipo: 'petalos', n: 20, cols: ['#ff5d8a', '#ff8fb1', '#d4283a', '#ffc2d0'] },
        sombra: 'rgba(10,0,20,0.4)'
      };
    },

    /* ===== 6. Puebla: volcanes, catedral, casitas de colores (foto 6), talavera ===== */
    puebla: function () {
      return {
        cielo: ['#4aa3df', '#6cb8e8', '#8dc9ee', '#b0dbf2', '#d4ebf3', '#fff0d4'],
        celeste: { tipo: 'sol', fx: 0.86, fy: 0.2, r: 12, col: '#fff7c8', halo: '#fff0a0' },
        nubes: { n: 6, luz: '#ffffff', som: '#d0e2f2', ymin: 6, ymax: 54 },
        capas: [
          { vel: 0.05, ancho: 640, hacer: function () { return A.capaVolcanes(640, { base: 72, col: '#7d8fc4', luz: '#95a8d8', nieve: '#f2f4fb', velo: ['#dfe8f8', 0.28] }); } },
          { vel: 0.26, hacer: function () {
            const c = A.capaCasitasCerro(LW, { base: 34, amp: 70, cerroCol: '#b0a070', paleta: ['#3f6fd0', '#f2b230', '#ff8a3d', '#ff8fb1', '#4fb0a8', '#fff0c0', '#b87ad0'], semilla: 51, frec: 1, velo: ['#dfe8f8', 0.12] });
            const x = c.getContext('2d'), cat = A.catedral();
            x.drawImage(cat, 300, ALTO - 30 - cat.height + 14);
            return c;
          } },
          { vel: 0.5, hacer: function () { return A.capaEdificios(LW, { base: 22, altoMin: 44, altoMax: 80, anchoMin: 30, anchoMax: 44, paleta: ['#3f6fd0', '#f2b230', '#ff8a3d', '#ff8fb1', '#4fb0a8', '#f3dfb5', '#e0a458'], suelo: '#c46b4c', semilla: 61, hueco: 0 }); } }
        ],
        atlas: {
          estilo: 'azulejo',
          c: { azul: '#2f5fb5', blanco: '#f4f0e6', amarillo: '#f2c230', junta: '#bfb6a6', muro: '#c46b4c', muroLuz: '#dc8a68', muroSom: '#9a4a38' },
          plat: { tipo: 'azulejo', c: { azul: '#2f5fb5', blanco: '#f4f0e6', amarillo: '#f2c230', muro: '#c46b4c', muroSom: '#9a4a38' } },
          bloque: { tipo: 'piedra', c: { osc: '#6a4a3a', mid: '#b8a088', luz: '#d6c0a6', som: '#947a64' } }
        },
        foso: { tipo: 'abismo' },
        ambiente: { tipo: 'brillos', n: 14, cols: ['#fff7c8', '#ffffff'] },
        sombra: 'rgba(40,30,70,0.32)'
      };
    },

    /* ===== 7. Cumpleaños de Ana: pradera dorada en La Joya (foto 7) ===== */
    cumple: function () {
      return {
        cielo: ['#7fa8ee', '#a0b8f0', '#c4c4f0', '#e6cfe8', '#ffd8c4', '#ffe8b8'],
        celeste: { tipo: 'sol', fx: 0.84, fy: 0.62, r: 15, col: '#fff4c0', halo: '#ffe08a' },
        nubes: { n: 6, luz: '#fff3ee', som: '#e8c8d8', ymin: 6, ymax: 60 },
        capas: [
          { vel: 0.07, hacer: function () { return A.capaColinas(LW, { base: 74, amp: 40, col: '#8aa8c8', luz: '#a0bcd8', semilla: 71, frec: 1, velo: ['#e6d8e8', 0.35] }).c; } },
          { vel: 0.26, hacer: function () { return A.capaArboles(LW, { base: 46, altoMin: 24, altoMax: 42, tipos: ['redondo', 'redondo', 'pino'], col: '#5a9a5a', luz: '#7ab86a', suelo: '#5a9a5a', semilla: 72, sep: 0.55, hueco: 6, velo: ['#e8e0d0', 0.22] }); } },
          { vel: 0.5, hacer: function () {
            const col = A.capaColinas(LW, { base: 24, amp: 18, col: '#8cc055', luz: '#b4de6c', som: '#6a9a40', semilla: 73, frec: 2 });
            const x = col.c.getContext('2d'), r = A.prng(6);
            const cabana = Pr.crear('cabana', { noche: false, navidad: false }).frames[0];
            x.drawImage(cabana, 330, col.tops[380] - cabana.height + 26);
            return col.c;
          } }
        ],
        atlas: {
          estilo: 'pasto',
          c: { pasto: '#8cc055', pastoLuz: '#c3e070', pastoOsc: '#5f9a3a', tierra: '#8a6340', tierraOsc: '#6a4a2e', tierraLuz: '#a8804e', flores: '#ffe27a' },
          plat: { tipo: 'tablon', c: { luz: '#d9a870', mid: '#b8824e', osc: '#7a5530', som: '#9a6a3e', clavo: '#5a3a22' } },
          bloque: { tipo: 'regalo', c: { osc: '#5b2a86', mid: '#8e4fc7', luz: '#b58be0', som: '#6a38a0', cinta: '#ffd36e', cintaLuz: '#fff3a0' } }
        },
        foso: { tipo: 'abismo' },
        ambiente: { tipo: 'confeti', n: 34, cols: ['#8e4fc7', '#ff8fb1', '#ffd36e', '#7fd0ff', '#c9a3ee'] },
        sombra: 'rgba(60,40,20,0.35)',
        sombraLarga: true
      };
    },

    /* ===== 8. Cumpleaños de Mani: fiesta en casa con papel picado (foto 8) ===== */
    zapata: function () {
      return {
        interior: true,
        fondoSolido: '#f3e2c8',
        cielo: null,
        capas: [
          { vel: 0.3, hacer: function () { return A.capaPared(LW, { pared: '#f3e2c8', paredLuz: '#fff0da', paredSom: '#e4cfa8', zocalo: 46, zocaloCol: '#8a5a3a', zocaloLuz: '#a8724a', zocaloSom: '#6b4a30', semilla: 81 }); } }
        ],
        atlas: {
          estilo: 'madera',
          c: { madera: '#a8724a', maderaLuz: '#c28a5a', maderaSom: '#8a5a3a', maderaOsc: '#5a3a28' },
          plat: { tipo: 'tablon', c: { luz: '#c28a5a', mid: '#8a5a3a', osc: '#4a2f1f', som: '#6b4a30', clavo: '#2a1a12' } },
          bloque: { tipo: 'regalo', c: { osc: '#1f5a30', mid: '#2f8a4a', luz: '#56b070', som: '#256a3a', cinta: '#fff1e0', cintaLuz: '#ffffff' } }
        },
        foso: { tipo: 'abismo' },
        ambiente: { tipo: 'confeti', n: 30, cols: ['#2f8a4a', '#fff1e0', '#d4283a', '#ffd36e'] },
        sombra: 'rgba(60,30,10,0.3)'
      };
    },

    /* ===== 9. Final: jardín al anochecer con luces ===== */
    final: function () {
      return {
        cielo: ['#2a1a5e', '#3f2478', '#5b2f8e', '#8a3f9a', '#c05498', '#e86f98', '#ff9a82', '#ffc98a'],
        celeste: { tipo: 'luna', fx: 0.8, fy: 0.24, r: 11, col: '#fff4d8', halo: '#e8a0d0' },
        estrellas: 60,
        nubes: { n: 5, luz: '#e888b0', som: '#a85a9a', ymin: 14, ymax: 70 },
        capas: [
          { vel: 0.07, hacer: function () { return A.capaMontanas(LW, { base: 70, amp: 46, col: '#6a3f94', luz: '#8a58b0', som: '#55307f', frec: 1, semilla: 91, velo: ['#e49ac0', 0.25] }); } },
          { vel: 0.24, hacer: function () { return A.capaArboles(LW, { base: 40, altoMin: 28, altoMax: 50, tipos: ['redondo', 'pino', 'redondo'], col: '#3a4f7a', luz: '#566a96', suelo: '#3a4f7a', semilla: 92, sep: 0.55, hueco: 5, velo: ['#c488b8', 0.16] }); } },
          { vel: 0.5, hacer: function () { return A.capaColinas(LW, { base: 24, amp: 16, col: '#3f6a64', luz: '#5a8a7e', som: '#2f5450', semilla: 93, frec: 2 }).c; } }
        ],
        atlas: {
          estilo: 'pasto',
          c: { pasto: '#4a8a6a', pastoLuz: '#7abf98', pastoOsc: '#356a52', tierra: '#4a3a5a', tierraOsc: '#33274a', tierraLuz: '#66507a', flores: '#ff8fb1' },
          plat: { tipo: 'nube', c: { luz: '#fff1f8', som: '#d9b8e8' } },
          bloque: { tipo: 'regalo', c: { osc: '#5b2a86', mid: '#8e4fc7', luz: '#b58be0', som: '#6a38a0', cinta: '#ff8fb1', cintaLuz: '#ffc2d0' } }
        },
        foso: { tipo: 'abismo' },
        ambiente: { tipo: 'luciernagas', n: 36, cols: ['#ffd36e', '#ff8fb1', '#fff1e0'] },
        sombra: 'rgba(20,0,40,0.4)'
      };
    },

    /* ===== Pantalla de inicio ===== */
    titulo: function () {
      return {
        cielo: ['#2a1238', '#4a1f66', '#7a2f86', '#b24a92', '#e86f98', '#ff9a82', '#ffc98a'],
        celeste: { tipo: 'sol', fx: 0.5, fy: 0.72, r: 24, col: '#fff0c0', halo: '#ffb07a' },
        estrellas: 70,
        nubes: { n: 5, luz: '#ff9ab0', som: '#c05a98', ymin: 18, ymax: 80 },
        capas: [
          { vel: 0.1, hacer: function () { return A.capaMontanas(LW, { base: 72, amp: 52, col: '#7a3f94', luz: '#9a58b0', som: '#62307f', frec: 1, semilla: 101, velo: ['#ff9ab0', 0.22] }); } },
          { vel: 0.26, hacer: function () { return A.capaColinas(LW, { base: 42, amp: 30, col: '#52307f', luz: '#7a4a9a', semilla: 102, frec: 1 }).c; } },
          { vel: 0.5, hacer: function () {
            const col = A.capaColinas(LW, { base: 22, amp: 16, col: '#33205a', luz: '#5a3a82', semilla: 103, frec: 2 });
            const x = col.c.getContext('2d'), r = A.prng(8);
            for (let i = 0; i < 10; i++) {
              const px = Math.floor(r() * (LW - 30)), t = col.tops[px];
              const p = A.arbolRedondo(34 + Math.floor(r() * 16), '#2a1a4e', '#3d2a6a', '#241440');
              x.drawImage(p, px, t - p.height + 8);
            }
            return col.c;
          } }
        ],
        atlas: {
          estilo: 'pasto',
          c: { pasto: '#3f2a6a', pastoLuz: '#7a58a8', pastoOsc: '#2a1a4e', tierra: '#2a1a4e', tierraOsc: '#1c1038', tierraLuz: '#3f2a6a', flores: '#ff8fb1' },
          plat: { tipo: 'nube', c: { luz: '#fff1f8', som: '#d9b8e8' } },
          bloque: { tipo: 'caja', c: { osc: '#4a2f1f', mid: '#8a5a3a', luz: '#a8724a', som: '#6b4a30' } }
        },
        foso: { tipo: 'abismo' },
        ambiente: { tipo: 'corazones', n: 16, cols: ['#ff8fb1', '#e3b4f0', '#ffd36e', '#ff5d8a'] },
        sombra: 'rgba(10,0,20,0.4)'
      };
    }
  };

  /* ------------------------------------------------------------------ */
  function crear(clave) {
    const cfg = TEMAS[clave]();
    const esc = {
      clave: clave, interior: !!cfg.interior, fondoSolido: cfg.fondoSolido,
      coloresCielo: cfg.cielo, celeste: cfg.celeste || null,
      sombra: cfg.sombra, sombraLarga: !!cfg.sombraLarga,
      foso: cfg.foso, ambienteCfg: cfg.ambiente,
      capas: [], nubes: [], estrellas: [], _cieloCache: null
    };
    cfg.capas.forEach(function (l) {
      const cv = l.hacer();
      esc.capas.push({ vel: l.vel, c: cv, w: cv.width, niebla: !!l.niebla });
    });
    esc.atlas = T.crearAtlas(cfg.atlas);

    // nubes
    if (cfg.nubes) {
      const r = A.prng(clave.length * 977 + 3);
      for (let i = 0; i < cfg.nubes.n; i++) {
        const w = 36 + Math.floor(r() * 44), h = 12 + Math.floor(r() * 10);
        esc.nubes.push({ c: A.nube(w, h, cfg.nubes.luz, cfg.nubes.som), x: r() * 900, y: cfg.nubes.ymin + r() * (cfg.nubes.ymax - cfg.nubes.ymin), v: 2 + r() * 4, par: 0.04 + r() * 0.05 });
      }
    }
    // estrellas
    if (cfg.estrellas) {
      const r = A.prng(clave.length * 313 + 9);
      for (let i = 0; i < cfg.estrellas; i++) esc.estrellas.push({ x: r(), y: r() * 0.55, g: r() < 0.12, f: 1 + r() * 3 });
    }
    // agua (tira animada)
    if (cfg.foso && cfg.foso.tipo === 'agua') {
      const w = A.nuevo(64, 26), r = A.prng(5);
      w.P(cfg.foso.col, 0, 0, 64, 26);
      w.P(mez(cfg.foso.col, '#000000', 0.18), 0, 12, 64, 14);
      w.P(cfg.foso.luz, 0, 0, 64, 1);
      for (let i = 0; i < 14; i++) w.P(cfg.foso.luz, Math.floor(r() * 60), 3 + Math.floor(r() * 18), 3 + Math.floor(r() * 4), 1);
      esc.aguaTile = w.c;
    }
    // ambiente (partículas en pantalla)
    esc.amb = { parts: [], listo: false };
    return esc;
  }

  function cieloCanvas(esc, W, H) {
    if (esc._cieloCache && esc._cieloCache.width >= W && esc._cieloCache.height === H) return esc._cieloCache;
    esc._cieloCache = A.cielo(Math.max(W, 480), H, esc.coloresCielo);
    return esc._cieloCache;
  }

  function dibujarCeleste(esc, ctx, W, H) {
    const c = esc.celeste; if (!c) return;
    const cx = Math.round(W * c.fx), cy = Math.round(H - ALTO + ALTO * c.fy);
    ctx.globalAlpha = 0.14;
    [c.r + 16, c.r + 10, c.r + 5].forEach(function (rr) { circ(ctx, c.halo, cx, cy, rr); });
    ctx.globalAlpha = 1;
    circ(ctx, c.col, cx, cy, c.r);
    if (c.tipo === 'luna') {
      const r = c.r;
      R(ctx, '#e4d4a0', cx - Math.round(r * 0.45), cy - Math.round(r * 0.35), Math.max(2, Math.round(r * 0.3)), Math.max(2, Math.round(r * 0.25)));
      R(ctx, '#e4d4a0', cx + Math.round(r * 0.25), cy + Math.round(r * 0.15), Math.max(2, Math.round(r * 0.25)), Math.max(2, Math.round(r * 0.2)));
      R(ctx, '#e4d4a0', cx - Math.round(r * 0.1), cy + Math.round(r * 0.5), Math.max(2, Math.round(r * 0.2)), 2);
    } else {
      ctx.globalAlpha = 0.5; circ(ctx, '#ffffff', cx - 3, cy - 3, Math.max(2, Math.round(c.r * 0.45))); ctx.globalAlpha = 1;
    }
  }

  function dibujarFondo(esc, ctx, camX, W, H, t) {
    ctx.imageSmoothingEnabled = false;
    if (esc.interior) {
      ctx.fillStyle = esc.fondoSolido; ctx.fillRect(0, 0, W, H);
    } else {
      ctx.drawImage(cieloCanvas(esc, W, H), 0, 0);
      for (let i = 0; i < esc.estrellas.length; i++) {
        const s = esc.estrellas[i], a = 0.45 + 0.55 * Math.sin(t * s.f + i);
        ctx.globalAlpha = Math.max(0.1, a);
        const sx = Math.round(s.x * W), sy = Math.round(s.y * (H - ALTO + ALTO * 0.7));
        R(ctx, '#fff6e0', sx, sy, s.g ? 2 : 1, s.g ? 2 : 1);
        if (s.g) { R(ctx, '#fff6e0', sx - 1, sy, 1, 1); R(ctx, '#fff6e0', sx + 2, sy, 1, 1); R(ctx, '#fff6e0', sx, sy - 1, 1, 1); R(ctx, '#fff6e0', sx, sy + 2, 1, 1); }
      }
      ctx.globalAlpha = 1;
      dibujarCeleste(esc, ctx, W, H);
      for (let i = 0; i < esc.nubes.length; i++) {
        const n = esc.nubes[i], span = W + n.c.width + 60;
        let x = ((n.x + t * n.v - camX * n.par) % span + span) % span - n.c.width - 10;
        ctx.drawImage(n.c, Math.round(x), Math.round(H - ALTO + n.y));
      }
    }
    for (let i = 0; i < esc.capas.length; i++) {
      const l = esc.capas[i];
      const off = (((camX * l.vel) % l.w) + l.w) % l.w;
      const y = H - ALTO;
      for (let x = -off; x < W; x += l.w) ctx.drawImage(l.c, Math.round(x), y);
    }
    if (esc.interior && H > ALTO) { /* la pared ya cubre el alto del mundo */ }
  }

  // Agua o profundidad por detrás de los tiles (se ve dentro de los fosos)
  function dibujarFoso(esc, ctx, camX, W, H, t) {
    if (esc.foso && esc.foso.tipo === 'agua' && esc.aguaTile) {
      const off = (camX + t * 12) % 64;
      for (let x = -off; x < W; x += 64) ctx.drawImage(esc.aguaTile, Math.round(x), H - 26);
    } else {
      for (let i = 0; i < 8; i++) {
        ctx.fillStyle = 'rgba(14,4,28,' + (0.1 + i * 0.1) + ')';
        ctx.fillRect(0, H - 8 * (8 - i), W, 8);
      }
    }
  }

  /* ---------- ambiente: partículas en pantalla ---------- */
  function iniciarAmbiente(esc, W, H) {
    const cfg = esc.ambienteCfg, r = A.prng(11), a = esc.amb;
    a.parts = []; a.listo = true; a.W = W; a.H = H;
    if (!cfg) return;
    for (let i = 0; i < cfg.n; i++) {
      a.parts.push({ x: r() * W, y: r() * H, vx: (r() - 0.5) * 8, vy: 0, f: r() * 6.28, s: 0.5 + r(), c: cfg.cols ? cfg.cols[Math.floor(r() * cfg.cols.length)] : '#fff' });
    }
  }

  function actualizarAmbiente(esc, dt, W, H, t) {
    const a = esc.amb, cfg = esc.ambienteCfg;
    if (!cfg) return;
    if (!a.listo || a.W !== W || a.H !== H) iniciarAmbiente(esc, W, H);
    for (let i = 0; i < a.parts.length; i++) {
      const p = a.parts[i];
      switch (cfg.tipo) {
        case 'luciernagas':
          p.x += (Math.sin(t * 0.7 * p.s + p.f) * 10) * dt; p.y += (Math.cos(t * 0.5 * p.s + p.f * 2) * 7) * dt;
          if (p.y < H - 130) p.y = H - 130; if (p.y > H - 28) p.y = H - 28; break;
        case 'petalos':
          p.y += (12 + 8 * p.s) * dt; p.x += (Math.sin(t * 1.3 * p.s + p.f) * 14 - 6) * dt; break;
        case 'confeti':
          p.y += (22 + 14 * p.s) * dt; p.x += Math.sin(t * 2 * p.s + p.f) * 10 * dt; break;
        case 'niebla':
          p.x += (5 + 5 * p.s) * dt; break;
        case 'corazones':
          p.y -= (6 + 6 * p.s) * dt; p.x += Math.sin(t * 0.9 * p.s + p.f) * 8 * dt; break;
        default: break;
      }
      if (p.x > W + 20) p.x = -20; if (p.x < -40) p.x = W + 20;
      if (p.y > H + 10) { p.y = -8; p.x = Math.random() * W; }
      if (p.y < -12) { p.y = H + 8; p.x = Math.random() * W; }
    }
  }

  function dibujarAmbiente(esc, ctx, W, H, t) {
    const a = esc.amb, cfg = esc.ambienteCfg;
    if (!cfg || !a.listo) return;
    for (let i = 0; i < a.parts.length; i++) {
      const p = a.parts[i], x = Math.round(p.x), y = Math.round(p.y);
      switch (cfg.tipo) {
        case 'luciernagas': {
          const on = 0.5 + 0.5 * Math.sin(t * 2.2 * p.s + p.f);
          ctx.globalAlpha = 0.18 * on; circ(ctx, p.c, x, y, 4);
          ctx.globalAlpha = 0.5 + 0.5 * on; R(ctx, p.c, x, y, 2, 2);
          ctx.globalAlpha = 1; break;
        }
        case 'petalos': {
          ctx.globalAlpha = 0.9; R(ctx, p.c, x, y, 3, 2); R(ctx, mez(p.c, '#ffffff', 0.4), x, y, 1, 1); ctx.globalAlpha = 1; break;
        }
        case 'confeti': {
          const g = Math.floor(t * 6 * p.s + p.f) % 2;
          R(ctx, p.c, x, y, g ? 2 : 3, g ? 3 : 2); break;
        }
        case 'niebla': {
          ctx.globalAlpha = 0.16; A.elip(ctx, '#ffffff', x, H - 50 - (i % 4) * 14, 46 + (i % 3) * 14, 6); ctx.globalAlpha = 1; break;
        }
        case 'brillos': {
          const on = Math.sin(t * 1.5 * p.s + p.f);
          if (on > 0.2) { ctx.globalAlpha = on; R(ctx, p.c, x, y % (H - 40), 1, 1); R(ctx, p.c, x - 1, y % (H - 40), 3, 1); R(ctx, p.c, x, (y % (H - 40)) - 1, 1, 3); ctx.globalAlpha = 1; }
          break;
        }
        case 'corazones': {
          ctx.globalAlpha = 0.55; ctx.drawImage(App.Sprites.corazon7(p.c), x, y); ctx.globalAlpha = 1; break;
        }
        default: break;
      }
    }
  }

  App.Escenarios = {
    crear: crear,
    dibujarFondo: dibujarFondo, dibujarFoso: dibujarFoso,
    actualizarAmbiente: actualizarAmbiente, dibujarAmbiente: dibujarAmbiente
  };
})(window.App = window.App || {});
