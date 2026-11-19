/* ==========================================================================
   PRINCIPAL: arranque, pantallas (inicio, tarjetas, galería, carta), flujo de
   niveles, progreso guardado y ajuste del lienzo al tamaño del celular.
   ========================================================================== */
(function (App) {
  'use strict';
  const D = window.DATOS;
  const Sp = App.Sprites, F = App.Fuente, Es = App.Escenarios, Au = App.Audio, En = App.Entrada, Mo = App.Motor;
  const $ = function (id) { return document.getElementById(id); };
  const depurar = /[?&]debug/.test(location.search);
  const TOTAL = D.recuerdos.length;          // 8 recuerdos → nivel 9 = final

  let lienzo, ctx, estado = 'cargando', pausaGiro = false, ultimo = 0;
  let progreso = { max: 0, final: false, bananas: [], rolly: false };
  let galeriaVuelta = null, tarjetaDesdeGaleria = false;

  /* ------------------------------ progreso ------------------------------ */
  function cargarProgreso() {
    try { const s = localStorage.getItem('nap_progreso'); if (s) progreso = Object.assign(progreso, JSON.parse(s)); } catch (e) {}
  }
  function guardarProgreso() { try { localStorage.setItem('nap_progreso', JSON.stringify(progreso)); } catch (e) {} }

  function irA(e) {
    estado = e;
    document.body.dataset.estado = e;
    En.activa = (e === 'juego');
    if (e !== 'juego') En.reiniciar();
  }

  /* ------------------------------ lienzo ------------------------------ */
  // Escalado ENTERO: cada píxel del juego = k píxeles reales → se ve nítido en cualquier celular
  function ajustarLienzo() {
    const dpr = window.devicePixelRatio || 1;
    const cw = window.innerWidth, ch = window.innerHeight;
    const app = $('app');
    app.style.width = cw + 'px'; app.style.height = ch + 'px';
    document.documentElement.style.setProperty('--vh', (ch / 100) + 'px');
    const pw = Math.floor(cw * dpr), ph = Math.floor(ch * dpr);
    let k = Math.max(1, Math.round(ph / 176));
    while (k > 1 && pw / k < 320) k--;
    let W = Math.floor(pw / k), H = Math.floor(ph / k);
    H = Math.min(H, 240); W = Math.min(W, 560);
    lienzo.width = W; lienzo.height = H;
    const cssW = W * k / dpr, cssH = H * k / dpr;
    lienzo.style.width = cssW + 'px'; lienzo.style.height = cssH + 'px';
    lienzo.style.left = Math.round((cw - cssW) / 2) + 'px'; lienzo.style.top = Math.round((ch - cssH) / 2) + 'px';
    ctx = lienzo.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    Mo.redimensionar(W, H);
    // zonas seguras (muesca / esquinas redondeadas) convertidas a píxeles del juego
    try {
      const cs = getComputedStyle($('zona-segura')), porPx = k / dpr;
      Mo.seguro = { izq: Math.ceil((parseFloat(cs.paddingLeft) || 0) / porPx), arr: Math.ceil((parseFloat(cs.paddingTop) || 0) / porPx) };
    } catch (e) { Mo.seguro = { izq: 0, arr: 0 }; }
    revisarOrientacion();
  }

  function revisarOrientacion() {
    const vertical = window.innerHeight > window.innerWidth;
    const pequeno = Math.min(window.innerWidth, window.innerHeight) < 640;
    const tactil = document.body.classList.contains('tactil') || (window.matchMedia && matchMedia('(pointer: coarse)').matches);
    const mostrar = vertical && pequeno && tactil;
    $('girar').classList.toggle('oculto', !mostrar);
    pausaGiro = mostrar;
  }

  /* ------------------------------ fotos ------------------------------ */
  const EXTS = ['jpeg', 'jpg', 'png', 'webp', 'JPG', 'JPEG', 'PNG'];
  function cargarFoto(img, base, marco) {
    let i = 0;
    if (marco) marco.classList.remove('sin-foto');
    img.onerror = function () {
      i++;
      if (i < EXTS.length) img.src = 'fotos/' + base + '.' + EXTS[i];
      else { img.onerror = null; if (marco) marco.classList.add('sin-foto'); }
    };
    img.src = 'fotos/' + base + '.' + EXTS[0];
  }
  function precargarFotos() {
    if (precargarFotos.hecho) return; precargarFotos.hecho = true;
    D.recuerdos.forEach(function (r) { cargarFoto(new Image(), r.foto, null); });
  }

  /* ------------------------------ texto ------------------------------ */
  function html(texto) {
    return String(texto).replace(/<3>?/g, '\u0001').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\u0001/g, '<i class="corazon" aria-label="corazón"></i>');
  }
  const MESES = { enero: 'ene', febrero: 'feb', marzo: 'mar', abril: 'abr', mayo: 'may', junio: 'jun', julio: 'jul', agosto: 'ago', septiembre: 'sep', octubre: 'oct', noviembre: 'nov', diciembre: 'dic' };
  function fechaCorta(s) {
    const m = /(\d+)\s+de\s+(\w+)\s+de\s+(\d+)/i.exec(s);
    return m ? m[1] + ' ' + (MESES[m[2].toLowerCase()] || m[2]) + ' ' + m[3] : s;
  }

  /* ------------------------------ PANTALLA DE INICIO ------------------------------ */
  const Titulo = {
    t: 0, esc: null, burbujas: [], parts: [], saliendo: null,
    iniciar: function () { this.esc = Es.crear('titulo'); },
    geom: function () { const W = Mo.W, H = Mo.H, ax = Math.round(W * 0.26); return { W: W, H: H, gy: H - 32, ax: ax, rx: ax + 30 }; },
    corazones: function (x, y, n) {
      const cols = ['#ff5d8a', '#ff8fb1', '#ffc2d0', '#e3b4f0', '#ffd36e'];
      for (let i = 0; i < n; i++) this.parts.push({ x: x + (Math.random() - 0.5) * 10, y: y, vx: (Math.random() - 0.5) * 50, vy: -(30 + Math.random() * 60), t: 0, ttl: 1.1 + Math.random() * 0.8, col: cols[i % cols.length] });
    },
    // alto (en píxeles del juego) que ocupan los botones HTML en la parte de abajo
    medirMenu: function () {
      const caja = document.querySelector('#menu .menu-botones');
      if (!caja || !lienzo) return;
      const r = caja.getBoundingClientRect(), c = lienzo.getBoundingClientRect();
      if (!r.height || !c.height) return;
      this.reservado = Math.max(0, (c.bottom - r.top) * (lienzo.height / c.height));
    },
    actualizar: function (dt) {
      this.t += dt;
      this.tm = (this.tm || 0) + dt;
      if (this.tm > 0.4 || this.reservado === undefined) { this.tm = 0; this.medirMenu(); }
      Es.actualizarAmbiente(this.esc, dt, Mo.W, Mo.H, this.t);
      for (let i = this.parts.length - 1; i >= 0; i--) {
        const p = this.parts[i]; p.vy += 70 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.t += dt;
        if (p.t > p.ttl) this.parts.splice(i, 1);
      }
      for (let i = this.burbujas.length - 1; i >= 0; i--) { this.burbujas[i].t += dt; if (this.burbujas[i].t > this.burbujas[i].ttl) this.burbujas.splice(i, 1); }
      if (this.saliendo) {
        this.saliendo.t += dt;
        if (this.saliendo.t >= 0.45 && this.saliendo.fn) { const f = this.saliendo.fn; this.saliendo.fn = null; f(); }
      }
    },
    dibujar: function (c) {
      const g = this.geom(), W = g.W, H = g.H, t = this.t, at = this.esc.atlas;
      c.imageSmoothingEnabled = false;
      Es.dibujarFondo(this.esc, c, 40 + t * 4, W, H, t);
      // suelo
      for (let x = 0; x < W; x += 16) { c.drawImage(at.top[0], x, g.gy); c.drawImage(at.cuerpo[0], x, g.gy + 16); }
      // personajes
      c.fillStyle = 'rgba(10,0,20,0.4)'; c.fillRect(g.ax - 5, g.gy, 10, 1); c.fillRect(g.rx - 6, g.gy, 12, 1);
      Sp.persona(c, Sp.ana.idle[Math.floor(t * 2) % 2], g.ax, g.gy, false);
      const rs = Sp.rolly[Math.floor(t * 5) % 2];
      c.save(); c.translate(g.rx, 0); c.scale(-1, 1); c.drawImage(rs, -rs.width / 2, g.gy - rs.height + 1); c.restore();
      Es.dibujarAmbiente(this.esc, c, W, H, t);

      // título: se acomoda en el espacio libre que dejan los botones HTML de abajo
      const t1 = D.titulo.split(' ');                               // ["Nuestro","primer","año"]
      const l1 = t1.slice(0, 2).join(' '), l2 = t1.slice(2).join(' ');
      const libre = Math.max(50, H - (this.reservado || H * 0.38) - 8);
      let s1 = 1, s2 = 2, ss = 1, total = 0;
      for (s2 = 6; s2 >= 2; s2--) {
        s1 = Math.max(1, Math.min(3, Math.ceil(s2 / 2)));
        while (s1 > 1 && F.medir(l1, s1) > W - 30) s1--;
        ss = (s2 >= 4 && W >= 360) ? 2 : 1;
        total = 9 * s1 + 6 + 7 * s2 + 10 + 7 * ss;
        if (F.medir(l2, s2) <= W * 0.5 && total <= libre) break;
      }
      const base = Math.max(4, Math.round((libre - total) * 0.4) + 4);
      const y1 = base + Math.round(Math.sin(t * 2) * 1.5);
      const y2 = base + 9 * s1 + 6 + Math.round(Math.sin(t * 2 + 1) * 1.5);
      F.dibujar(c, l1, W / 2, y1, { escala: s1, color: '#fff1e0', borde: '#5b2a86', sombra: '#2a1238', alinear: 'centro' });
      F.dibujar(c, l2, W / 2, y2, { escala: s2, color: '#ffd36e', borde: '#8e2f7a', sombra: '#2a1238', alinear: 'centro' });
      const ys = base + 9 * s1 + 6 + 7 * s2 + 10;
      F.dibujar(c, D.dedicatoria, W / 2, ys, { escala: ss, color: '#ffc2d0', borde: '#2a1238', alinear: 'centro' });
      // destellos junto al título
      for (let i = 0; i < 6; i++) {
        const on = Math.sin(t * 3 + i * 1.7);
        if (on > 0.3) {
          const sx = Math.round(W / 2 + Math.cos(i * 2.1 + 0.4) * (W * 0.38)), sy = Math.round(y1 + 10 + ((i * 29) % Math.max(20, (ys - y1))));
          c.drawImage(Sp.chispa(i % 2 ? '#fff1b8' : '#ffffff'), sx, sy);
        }
      }

      // partículas y burbujas
      for (let i = 0; i < this.parts.length; i++) {
        const p = this.parts[i], a = p.t > p.ttl - 0.3 ? Math.max(0, (p.ttl - p.t) / 0.3) : 1;
        c.globalAlpha = a; c.drawImage(Sp.corazon7(p.col), Math.round(p.x) - 3, Math.round(p.y) - 3); c.globalAlpha = 1;
      }
      for (let i = 0; i < this.burbujas.length; i++) Mo.burbujaUna(c, this.burbujas[i]);

      if (this.saliendo) { c.globalAlpha = Math.min(1, this.saliendo.t / 0.4); c.fillStyle = '#1a0a26'; c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
    },
    toque: function (lx, ly) {
      const g = this.geom();
      if (Math.abs(lx - g.ax) < 13 && ly > g.gy - 30 && ly < g.gy + 3) {
        Au.desbloquear(); Au.corazon(3);
        this.burbujas.push({ texto: '¡' + D.detalles.apodoElla + '!', x: g.ax, y: g.gy - 26, t: 0, ttl: 2 });
        this.corazones(g.ax, g.gy - 20, 8);
      } else if (Math.abs(lx - g.rx) < 13 && ly > g.gy - 18 && ly < g.gy + 3) {
        Au.desbloquear(); Au.guau();
        this.burbujas.push({ texto: '¡Guau!', x: g.rx, y: g.gy - 14, t: 0, ttl: 1.6 });
        this.corazones(g.rx, g.gy - 12, 6);
      }
    }
  };

  function actualizarMenu() {
    const hayProgreso = progreso.max > 0 && !progreso.final;
    const sig = Math.min(progreso.max, TOTAL);
    $('btn-continuar').hidden = !hayProgreso;
    $('btn-continuar').textContent = sig >= TOTAL ? 'Continuar (final)' : 'Continuar (nivel ' + (sig + 1) + ')';
    $('btn-recuerdos').hidden = progreso.max < 1;
    $('btn-ver-carta').hidden = !progreso.final;
  }

  function irATitulo() {
    $('tarjeta').classList.add('oculto'); $('carta').classList.add('oculto'); $('abrir').classList.add('oculto'); $('galeria').classList.add('oculto');
    Titulo.saliendo = null;
    irA('titulo');
    actualizarMenu();
  }

  /* ------------------------------ FLUJO DE NIVELES ------------------------------ */
  function empezarNivel(i) {
    Titulo.saliendo = null;
    irA('juego');
    document.body.classList.remove('sin-control');
    Mo.cargarNivel(i);
    if (i === 0) {                                   // pista de controles en el primer nivel
      const msg = document.body.classList.contains('tactil')
        ? 'Mueve con las flechas y salta con el botón'
        : 'Flechas o A/D para moverte - Espacio para saltar';
      setTimeout(function () { if (estado === 'juego' && Mo.idx === 0) Mo.toast(msg, 6, '#fff1e0'); }, 2400);
    }
  }
  function iniciarJuego(desde) {
    Au.desbloquear(); Au.clic(); precargarFotos();
    Titulo.saliendo = { t: 0, fn: function () { empezarNivel(desde); } };
  }

  Mo.alPlatano = function (idx) {
    if (progreso.bananas.indexOf(idx) < 0) { progreso.bananas.push(idx); guardarProgreso(); }
  };
  Mo.alTerminar = function (stats) {
    progreso.max = Math.max(progreso.max, stats.idx + 1);
    guardarProgreso();
    mostrarTarjeta(stats.idx, stats, false);
  };
  Mo.alSobre = function () {
    irA('sobre');
    $('abrir').classList.remove('oculto');
    $('btn-abrir-carta').focus({ preventScroll: true });
  };

  /* ------------------------------ TARJETA DE RECUERDO ------------------------------ */
  function mostrarTarjeta(idx, stats, desdeGaleria) {
    tarjetaDesdeGaleria = !!desdeGaleria;
    const r = D.recuerdos[idx];
    irA('tarjeta');
    const pips = [];
    for (let i = 0; i < TOTAL; i++) pips.push('<i class="pip' + (i < idx ? ' on' : (i === idx ? ' ahora' : '')) + '"></i>');
    $('t-progreso').innerHTML = '<span>Recuerdo ' + (idx + 1) + ' de ' + TOTAL + '</span>' + pips.join('');
    $('t-titulo').textContent = r.titulo;
    $('t-fecha').textContent = r.fecha;
    $('t-lugar').textContent = '• ' + r.lugar;
    $('t-texto').innerHTML = html(r.texto);
    let st = '';
    if (stats) {
      st = '<i class="corazon"></i> ' + stats.corazones + '/' + stats.total + ' corazones';
      if (stats.platano) st += ' &nbsp;•&nbsp; <span style="color:#ffd23f">¡plátano dorado!</span>';
    }
    $('t-stats').innerHTML = st;
    const marco = document.querySelector('#tarjeta .foto-marco');
    cargarFoto($('t-foto'), r.foto, marco);
    const btn = $('btn-continuar-tarjeta');
    btn.textContent = desdeGaleria ? 'Volver' : (idx >= TOTAL - 1 ? 'Siguiente → nivel final' : 'Continuar');
    // reiniciar animaciones de entrada
    const art = document.querySelector('#tarjeta .carta-recuerdo');
    art.style.animation = 'none'; marco.style.animation = 'none';
    void art.offsetWidth;
    art.style.animation = ''; marco.style.animation = '';
    $('tarjeta').classList.remove('oculto');
    Au.tarjeta();
    setTimeout(function () { btn.focus({ preventScroll: true }); }, 50);
  }

  function continuarTarjeta() {
    Au.clic();
    $('tarjeta').classList.add('oculto');
    if (tarjetaDesdeGaleria) { tarjetaDesdeGaleria = false; abrirGaleria(galeriaVuelta); return; }
    const idx = Mo.idx;
    empezarNivel(idx + 1);          // el recuerdo 8 lleva al nivel final (índice 8)
  }

  /* ------------------------------ GALERÍA ------------------------------ */
  function abrirGaleria(vuelta) {
    galeriaVuelta = vuelta || irATitulo;
    irA('galeria');
    const rej = $('rejilla'); rej.textContent = '';
    D.recuerdos.forEach(function (r, i) {
      if (i < progreso.max) {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'mini';
        const im = document.createElement('img'); im.alt = r.titulo; im.draggable = false; cargarFoto(im, r.foto, null);
        const sp = document.createElement('span'); sp.textContent = fechaCorta(r.fecha) + ' · ' + r.titulo;
        b.appendChild(im); b.appendChild(sp);
        b.addEventListener('click', function () { Au.clic(); $('galeria').classList.add('oculto'); mostrarTarjeta(i, null, true); });
        rej.appendChild(b);
      } else {
        const d = document.createElement('div'); d.className = 'mini bloqueado';
        d.innerHTML = '<div class="candado">?</div><span>Recuerdo ' + (i + 1) + '</span>';
        rej.appendChild(d);
      }
    });
    $('galeria').classList.remove('oculto');
    $('btn-cerrar-galeria').focus({ preventScroll: true });
  }
  function cerrarGaleria() {
    Au.clic();
    $('galeria').classList.add('oculto');
    const v = galeriaVuelta; galeriaVuelta = null;
    (v || irATitulo)();
  }

  /* ------------------------------ CARTA (máquina de escribir) ------------------------------ */
  let letras = [], idxLetra = 0, temporizador = null, rapido = false, cursor = null, cartaVuelta = null;

  function prepararCarta() {
    const cont = $('texto-carta'); cont.textContent = '';
    letras = [];
    D.carta.forEach(function (par) {
      const p = document.createElement('p');
      par.replace(/<3>?/g, '❤').split('**').forEach(function (parte, k) {
        const neg = k % 2 === 1;
        Array.from(parte).forEach(function (u) {
          if (u === '️') return;
          const s = document.createElement('span');
          s.className = 'c' + (neg ? ' neg' : '');
          if (u === '❤') { s.className += ' corazon'; s.setAttribute('aria-label', 'corazón'); } else s.textContent = u;
          p.appendChild(s); letras.push({ el: s, ch: u });
        });
      });
      if (letras.length) letras[letras.length - 1].finPar = true;
      cont.appendChild(p);
    });
    cursor = document.createElement('span'); cursor.className = 'cursor';
    idxLetra = 0; rapido = false;
  }
  function seguirCursor() {
    const papel = $('papel'), r = cursor.getBoundingClientRect(), p = papel.getBoundingClientRect();
    const margen = 46;
    if (r.bottom > p.bottom - margen) papel.scrollTop += r.bottom - (p.bottom - margen);
  }
  function pasoCarta() {
    if (idxLetra >= letras.length) { terminarCarta(); return; }
    const l = letras[idxLetra++];
    l.el.classList.add('v');
    l.el.after(cursor);
    if (idxLetra % 3 === 0) Au.tecla();
    seguirCursor();
    let d = 31;
    if ('.!?'.indexOf(l.ch) >= 0) d = 230; else if (',;:'.indexOf(l.ch) >= 0) d = 115; else if (l.ch === ' ') d = 26;
    if (l.finPar) d += 430;
    if (rapido) d = Math.max(4, d / 5);
    temporizador = setTimeout(pasoCarta, d);
  }
  function terminarCarta() {
    clearTimeout(temporizador); temporizador = null;
    letras.forEach(function (l) { l.el.classList.add('v'); });
    if (cursor && cursor.parentNode) cursor.parentNode.removeChild(cursor);
    $('btn-saltar').classList.add('oculto');
    const regalo = String(D.regaloFisico || '').trim();
    if (regalo && !/^(no\s*hay|ninguno|n\/a|-)$/i.test(regalo)) {
      $('pista-texto').textContent = regalo; $('pista').classList.remove('oculto'); Au.destello();
    }
    $('pie-carta').classList.remove('oculto');
    progreso.final = true; guardarProgreso();
    const papel = $('papel');
    setTimeout(function () { papel.scrollTo ? papel.scrollTo({ top: papel.scrollHeight, behavior: 'smooth' }) : (papel.scrollTop = papel.scrollHeight); }, 120);
    setTimeout(function () { $('btn-carta-inicio').focus({ preventScroll: true }); }, 400);
  }
  function abrirCarta(vuelta) {
    Au.abrir();
    cartaVuelta = vuelta || null;
    $('abrir').classList.add('oculto');
    if (estado !== 'sobre') { /* viene del menú: el lienzo queda con el título */ }
    irA('carta');
    $('pista').classList.add('oculto'); $('pie-carta').classList.add('oculto'); $('btn-saltar').classList.remove('oculto');
    prepararCarta();
    const papel = $('papel'); papel.scrollTop = 0;
    const art = papel; art.style.animation = 'none'; void art.offsetWidth; art.style.animation = '';
    $('carta').classList.remove('oculto');
    clearTimeout(temporizador);
    temporizador = setTimeout(pasoCarta, 900);
  }
  function cerrarCarta() {
    clearTimeout(temporizador); temporizador = null;
    $('carta').classList.add('oculto');
  }

  /* ------------------------------ sonido / pantalla completa ------------------------------ */
  function iconoSonido() {
    $('ondas').style.display = Au.activo ? '' : 'none';
    $('equis').style.display = Au.activo ? 'none' : '';
    $('btn-sonido').setAttribute('aria-label', Au.activo ? 'Silenciar' : 'Activar sonido');
    $('btn-sonido').title = Au.activo ? 'Silenciar' : 'Activar sonido';
  }
  function pantallaCompleta() {
    const el = document.documentElement;
    const activo = document.fullscreenElement || document.webkitFullscreenElement;
    if (!activo) {
      const f = el.requestFullscreen || el.webkitRequestFullscreen;
      if (f) {
        const p = f.call(el);
        const bloquear = function () { try { screen.orientation.lock('landscape').catch(function () {}); } catch (e) {} };
        if (p && p.then) p.then(bloquear).catch(function () {}); else bloquear();
      }
    } else {
      (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    }
  }

  /* ------------------------------ bucle principal ------------------------------ */
  function bucle(ts) {
    requestAnimationFrame(bucle);
    const dt = Math.min(0.033, Math.max(0, (ts - ultimo) / 1000));
    ultimo = ts;
    if (pausaGiro || estado === 'cargando') return;
    if (estado === 'titulo') { Titulo.actualizar(dt); Titulo.dibujar(ctx); }
    else if (estado === 'juego' || estado === 'sobre' || estado === 'carta') {
      Mo.actualizar(dt); Mo.dibujar(ctx);
      document.body.classList.toggle('sin-control', Mo.estado !== 'jugando');
    }
  }

  /* ------------------------------ arranque ------------------------------ */
  function iniciar() {
    lienzo = $('lienzo');
    Sp.iniciar(); Au.init(); En.init();
    cargarProgreso();
    Titulo.iniciar();

    if ((window.matchMedia && matchMedia('(pointer: coarse)').matches) || /[?&]tactil/.test(location.search)) document.body.classList.add('tactil');
    document.addEventListener('touchstart', function () { document.body.classList.add('tactil'); En.tactil = true; revisarOrientacion(); }, { passive: true, once: true });
    document.addEventListener('touchmove', function (e) { if (!e.target.closest || !e.target.closest('.scroll')) e.preventDefault(); }, { passive: false });
    ['contextmenu', 'dragstart'].forEach(function (ev) { document.addEventListener(ev, function (e) { if (e.target.closest && e.target.closest('#lienzo,#controles,.foto-marco')) e.preventDefault(); }); });

    ajustarLienzo();
    window.addEventListener('resize', ajustarLienzo);
    window.addEventListener('orientationchange', function () { setTimeout(ajustarLienzo, 250); });
    if (window.visualViewport) window.visualViewport.addEventListener('resize', ajustarLienzo);

    // botones
    $('btn-jugar').addEventListener('click', function () { iniciarJuego(0); });
    $('btn-continuar').addEventListener('click', function () { iniciarJuego(Math.min(progreso.max, TOTAL)); });
    $('btn-recuerdos').addEventListener('click', function () { Au.desbloquear(); Au.clic(); abrirGaleria(irATitulo); });
    $('btn-ver-carta').addEventListener('click', function () { Au.desbloquear(); abrirCarta(irATitulo); });
    $('btn-cerrar-galeria').addEventListener('click', cerrarGaleria);
    $('btn-continuar-tarjeta').addEventListener('click', continuarTarjeta);
    $('btn-abrir-carta').addEventListener('click', function () { abrirCarta(irATitulo); });
    $('btn-saltar').addEventListener('click', function () { Au.clic(); terminarCarta(); });
    $('btn-carta-recuerdos').addEventListener('click', function () { Au.clic(); cerrarCarta(); abrirGaleria(irATitulo); });
    $('btn-carta-inicio').addEventListener('click', function () { Au.clic(); cerrarCarta(); irATitulo(); });
    $('papel').addEventListener('pointerdown', function (e) { if (!e.target.closest('button')) rapido = true; });
    $('btn-sonido').addEventListener('click', function () { Au.desbloquear(); Au.alternar(); iconoSonido(); });
    iconoSonido();
    if (document.fullscreenEnabled || document.webkitFullscreenEnabled) { $('btn-pantalla').hidden = false; $('btn-pantalla').addEventListener('click', pantallaCompleta); }

    // toques en el lienzo (pantalla de inicio: Ana y Rolly)
    lienzo.addEventListener('pointerdown', function (e) {
      if (estado !== 'titulo') return;
      const r = lienzo.getBoundingClientRect();
      Titulo.toque((e.clientX - r.left) * lienzo.width / r.width, (e.clientY - r.top) * lienzo.height / r.height);
    });

    // teclado: Enter para empezar, M para silenciar, F para pantalla completa
    window.addEventListener('keydown', function (e) {
      if (e.code === 'KeyM' && !e.ctrlKey && !e.metaKey) { Au.alternar(); iconoSonido(); }
      else if (e.code === 'KeyF' && !e.ctrlKey && !e.metaKey && (document.fullscreenEnabled || document.webkitFullscreenEnabled)) pantallaCompleta();
      else if (e.code === 'Escape') {
        if (estado === 'galeria') cerrarGaleria();
      }
    });

    actualizarMenu();
    irA('titulo');
    revisarOrientacion();
    requestAnimationFrame(function (ts) { ultimo = ts; bucle(ts); });

    // ---- ayudas para probar (solo con ?debug) ----
    if (depurar) {
      window.__app = {
        Mo: Mo, Titulo: Titulo, progreso: function () { return progreso; },
        estado: function () { return estado; },
        irANivel: function (i) { Au.desbloquear(); empezarNivel(i); },
        tp: function (px) { Mo.j.x = px; Mo.j.y = Mo.nivel.inicio.y - 20; Mo.j.vy = 0; Mo.cam = Math.max(0, px - Mo.W * 0.4); },
        completar: function () { const m = Mo.nivel.meta; this.tp(m.x - 20); },
        tarjeta: function (i) { progreso.max = Math.max(progreso.max, i + 1); mostrarTarjeta(i, { corazones: 17, total: 20, platano: true }, false); },
        galeria: function () { abrirGaleria(irATitulo); },
        carta: function () { abrirCarta(irATitulo); },
        progresoMax: function (n) { progreso.max = n; actualizarMenu(); }
      };
      const m = /[?&]nivel=(\d+)/.exec(location.search);
      if (m) { progreso.max = Math.max(progreso.max, +m[1] - 1); setTimeout(function () { window.__app.irANivel(+m[1] - 1); }, 50); }
    }
  }

  App.Principal = { iniciar: iniciar };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})(window.App = window.App || {});
