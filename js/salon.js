/* Carta del salón: pantalla de idioma, carta, barra de categorías,
   menú de idiomas y panel de Contacto.
   Los datos se escriben siempre con textContent, nunca con innerHTML. */
'use strict';

(() => {
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));
  const SVG = 'http://www.w3.org/2000/svg';
  const sinMovimiento = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Guardado (puede estar bloqueado: nunca rompe la carta) ---------- */
  const guardado = {
    leer(clave, sesion) {
      try { return (sesion ? sessionStorage : localStorage).getItem(clave); } catch (e) { return null; }
    },
    guardar(clave, valor, sesion) {
      try { (sesion ? sessionStorage : localStorage).setItem(clave, valor); } catch (e) { /* sin guardado */ }
    },
  };

  /* ---------- Mesa: ?s=01 o /s/01, solo 01 a 33. No se muestra. ---------- */
  const leerMesa = () => {
    const porQuery = new URLSearchParams(location.search).get('s');
    const porRuta = (location.pathname.match(/\/s\/(\d{2})\/?$/) || [])[1];
    const mesa = porQuery || porRuta;
    if (mesa && /^\d{2}$/.test(mesa) && +mesa >= 1 && +mesa <= 33) {
      guardado.guardar(CONFIG.claves.mesa, mesa, true);
    }
  };

  /* ---------- Idioma ---------- */
  const idiomaGuardado = () => {
    const v = guardado.leer(CONFIG.claves.idioma);
    return IDIOMAS_SALON.includes(v) ? v : null;
  };
  const idiomaCelular = () => {
    const lista = navigator.languages || [navigator.language || ''];
    for (const l of lista) {
      const corto = String(l).slice(0, 2).toLowerCase();
      if (IDIOMAS_SALON.includes(corto)) return corto;
    }
    return null;
  };

  let idioma = idiomaGuardado() || idiomaCelular() || 'es';
  const t = () => TEXTOS[idioma];
  const textoDe = (clave, lng = idioma) => clave.split('.').reduce((o, k) => (o ? o[k] : undefined), TEXTOS[lng]);

  /* ---------- Creación segura de elementos ---------- */
  const el = (tag, attrs = {}, hijos = []) => {
    const nodo = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v === null || v === undefined || v === false) continue;
      if (/^on/i.test(k) || k === 'innerHTML') continue;
      if (k === 'class') nodo.className = v;
      else nodo.setAttribute(k, v === true ? '' : v);
    }
    for (const h of [].concat(hijos)) {
      if (h === null || h === undefined || h === false) continue;
      nodo.append(typeof h === 'string' ? document.createTextNode(h) : h);
    }
    return nodo;
  };
  const usoSvg = (id, clase) => {
    const svg = document.createElementNS(SVG, 'svg');
    svg.setAttribute('aria-hidden', 'true');
    if (clase) svg.setAttribute('class', clase);
    const use = document.createElementNS(SVG, 'use');
    use.setAttribute('href', `#${id}`);
    svg.append(use);
    return svg;
  };

  const formatoPrecio = (n) => n.toLocaleString('es-AR', { maximumFractionDigits: 0 });
  const precioTexto = (p) => (p.precioHasta
    ? `$ ${formatoPrecio(p.precio)} – ${formatoPrecio(p.precioHasta)}`
    : `$ ${formatoPrecio(p.precio)}`);
  const local = (obj) => (obj && (obj[idioma] || obj.es)) || '';

  /* ---------- Carta: qué secciones y en qué orden ---------- */
  const NAV_DE = {
    compartir: 'entradas', entradas: 'entradas', achuras: 'entradas',
    parrilla: 'parrilla', cocina: 'parrilla', pastas: 'parrilla', salsas: 'parrilla',
    minutas: 'guarniciones', ensaladas: 'guarniciones',
    bebidas: 'bebidas', postres: 'postres',
  };
  const ORDEN_COMIDAS = ['entradas', 'achuras', 'parrilla', 'cocina', 'pastas', 'salsas', 'minutas', 'ensaladas'];
  const catPorId = Object.fromEntries(CATEGORIAS.map((c) => [c.id, c]));
  const platosDe = (cat, sub) => PLATOS.filter((p) => p.categoria === cat && (!sub || p.subgrupo === sub)
    && Number.isInteger(p.precio) && p.precio > 0 && p.nombre);

  const etiquetas = (p) => [
    p.sinTacc ? el('span', { class: 'etq etq-tacc' }, t().sinTacc) : null,
    p.disponible === false ? el('span', { class: 'etq etq-stock' }, t().sinStock) : null,
  ];

  const filaPlato = (p) => el('li', { class: `plato${p.disponible === false ? ' plato-agotado' : ''}` }, [
    el('div', { class: 'plato-linea' }, [
      el('span', { class: 'plato-nombre', lang: 'es' }, p.nombre),
      el('span', { class: 'plato-precio num' }, precioTexto(p)),
    ]),
    ...etiquetas(p),
  ]);

  const tituloSeccion = (texto, kicker) => [
    el('h2', { class: 'sec-titulo' }, texto),
    kicker ? el('p', { class: 'sec-kicker' }, kicker) : null,
    el('div', { class: 'linea linea-izq linea-chica', 'aria-hidden': 'true' }),
  ];

  const decoracion = (src, clase, ancho, alto) => el('img', {
    class: clase, src, alt: '', width: ancho, height: alto, 'aria-hidden': 'true', loading: 'lazy', decoding: 'async',
  });

  const dibujarCarta = () => {
    const cont = $('#secciones');
    const partes = [];

    // Para compartir: los combos, con descripción.
    const combos = platosDe('menus');
    if (combos.length) {
      partes.push(el('section', { id: 'compartir', class: 'sec', 'data-nav': 'entradas' }, [
        ...tituloSeccion(t().paraCompartir),
        el('div', { class: 'combos' }, combos.map((p) => el('article', { class: 'combo' }, [
          el('div', { class: 'plato-linea' }, [
            el('h3', { class: 'combo-nombre', lang: 'es' }, p.nombre),
            el('span', { class: 'combo-precio num' }, precioTexto(p)),
          ]),
          p.descripcion ? el('p', { class: 'combo-desc' }, local(p.descripcion)) : null,
        ]))),
      ]));
    }

    for (const id of ORDEN_COMIDAS) {
      const platos = platosDe(id);
      if (!platos.length) continue;
      const esParrilla = id === 'parrilla';
      partes.push(el('section', { id, class: `sec${esParrilla ? ' sec-parrilla' : ''}`, 'data-nav': NAV_DE[id] }, [
        esParrilla ? decoracion('img/toro.webp', 'deco-toro', 820, 958) : null,
        esParrilla ? decoracion('img/costillar-brasas.webp', 'deco-banner deco-banner-sec', 820, 547) : null,
        ...tituloSeccion(local(catPorId[id].nombre).toUpperCase(), id === 'salsas' ? t().salsasKicker : null),
        el('ul', { class: 'platos' }, platos.map(filaPlato)),
      ]));
    }

    // Bodega
    partes.push(el('div', { id: 'bebidas', class: 'gran-titulo gran-bodega', 'data-nav': 'bebidas' }, [
      decoracion('img/bodegon-vino.webp', 'deco-banner', 820, 897),
      el('p', { class: 'kicker' }, t().bodegaKicker),
      el('h2', { class: 'gran-h' }, t().bodega),
      el('div', { class: 'linea', 'aria-hidden': 'true' }),
    ]));
    for (const sub of SUBGRUPOS) {
      const platos = platosDe('bodega', sub.id);
      if (!platos.length) continue;
      partes.push(el('section', { id: sub.id, class: 'sec sec-bodega', 'data-nav': 'bebidas' }, [
        ...tituloSeccion(local(sub.nombre).toUpperCase()),
        el('ul', { class: 'platos' }, platos.map(filaPlato)),
      ]));
    }

    // Postres
    const postres = platosDe('postres');
    partes.push(el('section', { id: 'postres', class: 'sec sec-postres', 'data-nav': 'postres' }, [
      el('div', { class: 'gran-titulo' }, [
        el('div', { class: 'separador', 'aria-hidden': 'true' }),
        decoracion('img/flan-caramelo.webp', 'deco-banner deco-flan', 820, 721),
        el('p', { class: 'kicker' }, t().postresKicker),
        el('h2', { class: 'gran-h' }, t().postres),
        el('div', { class: 'linea', 'aria-hidden': 'true' }),
      ]),
      el('ul', { class: 'platos' }, postres.map(filaPlato)),
    ]));

    cont.replaceChildren(...partes);
    observarSecciones();
  };

  /* ---------- Textos fijos ---------- */
  const aplicarTextos = () => {
    document.documentElement.lang = idioma;
    document.title = t().titulo;
    $$('#vista-carta [data-t], #contacto [data-t]').forEach((n) => {
      const v = textoDe(n.dataset.t);
      if (typeof v === 'string') n.textContent = v;
    });
    $$('[data-t-aria]').forEach((n) => n.setAttribute('aria-label', textoDe(n.dataset.tAria)));
    $('.moneda').hidden = !t().moneda;
    $('#barra').setAttribute('aria-label', t().navAria);
    $('#precio-cubierto').textContent = `$ ${formatoPrecio(NEGOCIO.cubierto)}`;

    $('#btn-idioma-bandera').setAttribute('href', `#b-${BANDERA[idioma]}`);
    $('#btn-idioma-codigo').textContent = idioma.toUpperCase();
    $('#btn-idioma').setAttribute('aria-label', t().idiomaAria.replace('{n}', NOMBRE_IDIOMA[idioma]));
    $('#menu-idiomas').setAttribute('aria-label', t().cambiarIdioma);
    dibujarMenuIdiomas();
  };

  /* ---------- Pantalla de idioma ---------- */
  const vistaIdioma = $('#vista-idioma');
  const vistaCarta = $('#vista-carta');

  const prepararPantallaIdioma = () => {
    const guardadoAntes = idiomaGuardado();
    const celular = idiomaCelular();
    $$('.idioma-op').forEach((b) => {
      const lng = b.dataset.idioma;
      const activo = lng === idioma;
      b.classList.toggle('activa', activo);
      if (activo) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
      let nota = '';
      if (activo && guardadoAntes === lng) nota = TEXTOS[lng].ultimo;
      else if (activo && celular === lng) nota = TEXTOS[lng].tuCelular;
      b.querySelector('.idioma-nota').textContent = nota;
    });
    const pie = $('.idioma-pie');
    pie.textContent = TEXTOS[idioma].podesCambiar;
    pie.lang = idioma;
  };

  const mostrarCarta = () => {
    vistaIdioma.hidden = true;
    vistaCarta.hidden = false;
    document.body.classList.add('en-carta');
  };
  const mostrarIdioma = () => {
    cerrarMenuIdiomas(false);
    vistaCarta.hidden = true;
    vistaIdioma.hidden = false;
    document.body.classList.remove('en-carta');
    prepararPantallaIdioma();
    window.scrollTo(0, 0);
  };

  let cartaDibujadaEn = null;
  const entrarConIdioma = (lng) => {
    idioma = lng;
    guardado.guardar(CONFIG.claves.idioma, lng);
    aplicarTextos();
    if (cartaDibujadaEn !== lng) { dibujarCarta(); cartaDibujadaEn = lng; }
    mostrarCarta();
    history.pushState({ vista: 'carta' }, '');
    window.scrollTo(0, 0);
    calcularSeccion();
    $('.carta-titulo').setAttribute('tabindex', '-1');
    $('.carta-titulo').focus({ preventScroll: true });
  };

  $$('.idioma-op').forEach((b) => b.addEventListener('click', () => entrarConIdioma(b.dataset.idioma)));

  /* ---------- Menú de idiomas (en la carta) ---------- */
  const btnIdioma = $('#btn-idioma');
  const menuIdiomas = $('#menu-idiomas');

  const dibujarMenuIdiomas = () => {
    const ops = IDIOMAS_SALON.filter((l) => l !== idioma).map((l) => {
      const b = el('button', { type: 'button', class: 'menu-op press', lang: l, 'data-idioma': l }, [
        usoSvg(`b-${BANDERA[l]}`, 'bandera'),
        el('span', { class: 'menu-op-nombre' }, NOMBRE_IDIOMA[l]),
        el('span', { class: 'menu-op-cod' }, l.toUpperCase()),
      ]);
      b.addEventListener('click', () => cambiarIdioma(l));
      return b;
    });
    $('#menu-opciones').replaceChildren(...ops);
  };

  const abrirMenuIdiomas = () => {
    menuIdiomas.hidden = false;
    btnIdioma.setAttribute('aria-expanded', 'true');
    btnIdioma.classList.add('abierto');
    const primero = menuIdiomas.querySelector('.menu-op');
    if (primero) primero.focus();
  };
  function cerrarMenuIdiomas(devolverFoco = true) {
    if (menuIdiomas.hidden) return;
    menuIdiomas.hidden = true;
    btnIdioma.setAttribute('aria-expanded', 'false');
    btnIdioma.classList.remove('abierto');
    if (devolverFoco) btnIdioma.focus();
  }

  btnIdioma.addEventListener('click', () => (menuIdiomas.hidden ? abrirMenuIdiomas() : cerrarMenuIdiomas()));
  document.addEventListener('click', (e) => {
    if (!menuIdiomas.hidden && !e.target.closest('.idioma-caja')) cerrarMenuIdiomas(false);
  });
  menuIdiomas.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); cerrarMenuIdiomas(); return; }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const ops = $$('.menu-op');
      const i = ops.indexOf(document.activeElement);
      const sig = e.key === 'ArrowDown' ? (i + 1) % ops.length : (i - 1 + ops.length) % ops.length;
      ops[sig].focus();
    }
  });
  btnIdioma.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') cerrarMenuIdiomas();
  });

  const cambiarIdioma = (lng) => {
    const visible = seccionActual;
    idioma = lng;
    guardado.guardar(CONFIG.claves.idioma, lng);
    cerrarMenuIdiomas();
    aplicarTextos();
    dibujarCarta();
    cartaDibujadaEn = lng;
    const destino = visible && document.getElementById(visible);
    if (destino && visible !== 'compartir') destino.scrollIntoView({ block: 'start' });
  };

  /* ---------- Barra de categorías ---------- */
  let seccionActual = null;
  const itemsBarra = $$('.nv-item');
  const tiraBarra = $('.nv-bar');

  /* Marca la categoría con aria-current (la "brasa encendida" del diseño).
     Solo toca los que cambian, para que la animación de encendido no se repita.
     En celular la barra se desliza de costado: se corre la tira (no la página)
     para que el ícono activo quede a la vista. */
  const marcarBarra = (nav) => {
    itemsBarra.forEach((a) => {
      const activo = a.dataset.nav === nav;
      if ((a.getAttribute('aria-current') === 'true') === activo) return;
      a.setAttribute('aria-current', activo ? 'true' : 'false');
      if (activo && tiraBarra.scrollWidth > tiraBarra.clientWidth) {
        const li = a.parentElement;
        const destino = li.offsetLeft - (tiraBarra.clientWidth - li.offsetWidth) / 2;
        tiraBarra.scrollTo({ left: Math.max(0, destino), behavior: sinMovimiento() ? 'auto' : 'smooth' });
      }
    });
  };

  /* Viaje a una sección: mientras la carta se desliza sola, queda encendido
     SOLO el botón tocado. El viaje termina cuando la carta LLEGÓ (se mide la
     posición, no el tiempo: en un celular que se traba, los avisos de scroll
     se demoran y antes el bloqueo se soltaba a mitad de camino).
     Se corta antes solo si el comensal toma el control (toca la carta, usa
     la rueda o el teclado), o por seguridad a los 6 s. */
  let navegando = false;
  let viaje = null; // { nav, nodo | null (= arriba de todo) }
  let seguridad = null;

  const llego = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (!viaje.nodo) return window.scrollY <= 1;
    const top = viaje.nodo.getBoundingClientRect().top;
    const margen = parseFloat(getComputedStyle(viaje.nodo).scrollMarginTop) || 0;
    if (Math.abs(top - margen) <= 3) return true;
    // No puede subir más la sección: la carta ya está al final.
    return window.scrollY >= max - 2 && top > margen;
  };

  const terminarViaje = (llegoBien) => {
    if (!navegando) return;
    const nav = viaje.nav;
    navegando = false;
    viaje = null;
    clearTimeout(seguridad);
    if (llegoBien) marcarBarra(nav); else calcularSeccion();
  };

  const vigilarViaje = () => {
    if (!navegando) return;
    if (llego()) { terminarViaje(true); return; }
    requestAnimationFrame(vigilarViaje);
  };

  const navegarA = (nav, nodo) => {
    marcarBarra(nav);
    seccionActual = nodo ? nodo.id : null;
    navegando = true;
    viaje = { nav, nodo };
    clearTimeout(seguridad);
    seguridad = setTimeout(() => terminarViaje(false), 6000);
    const comportamiento = sinMovimiento() ? 'auto' : 'smooth';
    if (nodo) nodo.scrollIntoView({ behavior: comportamiento, block: 'start' });
    else window.scrollTo({ top: 0, behavior: comportamiento });
    requestAnimationFrame(vigilarViaje);
  };

  // El comensal toma el control. Tocar la propia barra no cuenta: ahí
  // empieza otro viaje y no debe encenderse nada en el medio.
  const tomaControl = (e) => {
    if (!navegando) return;
    if (e.target && e.target.closest && e.target.closest('.nv-wrap, .hc-logo')) return;
    terminarViaje(false);
  };
  ['touchstart', 'wheel', 'keydown'].forEach((ev) => window.addEventListener(ev, tomaControl, { passive: true }));

  /* Qué sección está leyendo el comensal: la ÚLTIMA cuyo comienzo ya pasó
     por una línea fija, un cuarto de pantalla debajo del borde de arriba.
     (Antes se elegía la primera que asomaba en pantalla: al llegar a Postres
     ganaba el final de Bebidas, que todavía asomaba por arriba.)
     Al final de la carta, Postres, aunque su título no llegue a la línea. */
  let secciones = [];
  function calcularSeccion() {
    if (navegando || vistaCarta.hidden || !secciones.length) return;
    // El header no es fijo: cuando se va de pantalla, la línea se mide desde arriba.
    const cabecera = Math.max(0, $('.hc').getBoundingClientRect().bottom);
    const linea = cabecera + window.innerHeight * 0.25;
    const alFinal = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4;
    let activa = null;
    if (alFinal) {
      activa = secciones[secciones.length - 1];
    } else {
      for (const s of secciones) {
        if (s.getBoundingClientRect().top <= linea) activa = s; else break;
      }
    }
    seccionActual = activa ? activa.id : null;
    marcarBarra(activa ? activa.dataset.nav : 'entradas'); // arriba de todo: Entradas
  }

  let pendiente = false;
  const alMoverse = () => {
    if (navegando) return; // durante un viaje manda vigilarViaje
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(() => { pendiente = false; calcularSeccion(); });
  };
  window.addEventListener('scroll', alMoverse, { passive: true });
  window.addEventListener('resize', alMoverse, { passive: true });

  function observarSecciones() {
    secciones = $$('#secciones [data-nav]');
    calcularSeccion();
  }

  itemsBarra.forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    const destino = document.querySelector(a.getAttribute('href'));
    const id = a.dataset.nav === 'entradas' ? '#compartir' : a.getAttribute('href');
    const nodo = document.querySelector(id) || destino;
    if (!nodo) return;
    navegarA(a.dataset.nav, nodo);
  }));

  // El logo lleva arriba de todo: mismo viaje, con Entradas encendido.
  $('.hc-logo').addEventListener('click', (e) => {
    e.preventDefault();
    navegarA('entradas', null);
  });

  /* ---------- Panel de Contacto ---------- */
  const dialogo = $('#contacto');
  const btnContacto = $('#btn-contacto');

  const ponerEnlace = (id, url) => {
    const a = document.getElementById(id);
    if (!url) { a.hidden = true; return; }
    a.href = url;
  };
  ponerEnlace('c-resena', CONFIG.resenaUrl);
  ponerEnlace('c-instagram', CONFIG.instagram);
  ponerEnlace('c-whatsapp', CONFIG.whatsapp ? `https://wa.me/${CONFIG.whatsapp}` : '');
  ponerEnlace('c-telefono', CONFIG.telefono ? `tel:${CONFIG.telefono}` : '');
  ponerEnlace('c-web', CONFIG.webUrl ? urlWeb() : '');
  ponerEnlace('c-reservar', CONFIG.webUrl ? urlWeb(CONFIG.webPaginas.reservar) : '');
  ponerEnlace('c-shows', CONFIG.webUrl ? urlWeb(CONFIG.webPaginas.shows) : '');
  ponerEnlace('pie-web', CONFIG.webUrl ? urlWeb() : '');
  $('#c-instagram-usuario').textContent = CONFIG.instagramUsuario;
  $('#c-whatsapp-num').textContent = CONFIG.whatsappTexto;
  $('#c-telefono-num').textContent = CONFIG.whatsappTexto;

  const abrirContacto = () => {
    if (typeof dialogo.showModal !== 'function') { window.open(urlWeb(), '_blank', 'noopener'); return; }
    cerrarMenuIdiomas(false);
    dialogo.showModal();
    document.body.classList.add('sin-scroll');
    history.pushState({ vista: 'carta', contacto: true }, '');
  };
  const cerrarContacto = () => {
    if (!dialogo.open) return;
    if (history.state && history.state.contacto) history.back();
    else dialogo.close();
  };

  // El botón de Contacto salió del header; el panel queda listo para cuando
  // se ubique el botón nuevo (con id="btn-contacto").
  if (btnContacto) btnContacto.addEventListener('click', abrirContacto);
  $('#contacto-cerrar').addEventListener('click', cerrarContacto);
  dialogo.addEventListener('cancel', (e) => { e.preventDefault(); cerrarContacto(); });
  dialogo.addEventListener('click', (e) => { if (e.target === dialogo) cerrarContacto(); });
  dialogo.addEventListener('close', () => {
    document.body.classList.remove('sin-scroll');
    if (btnContacto) btnContacto.focus({ preventScroll: true });
  });

  /* ---------- Botón "atrás" del celular ---------- */
  window.addEventListener('popstate', (e) => {
    const estado = e.state || {};
    if (dialogo.open && !estado.contacto) { dialogo.close(); return; }
    if (estado.vista === 'carta') {
      if (cartaDibujadaEn !== idioma) { aplicarTextos(); dibujarCarta(); cartaDibujadaEn = idioma; }
      mostrarCarta();
      calcularSeccion();
    } else {
      mostrarIdioma();
    }
  });

  /* ---------- Arranque ---------- */
  leerMesa();
  history.replaceState(null, '');
  prepararPantallaIdioma();
})();
