/* ==========================================================================
   GOnama · landing new-pos
   Reveal al scroll, marquesinas, contadores y acordeón de FAQ.
   Todo se apaga si el sistema pide menos movimiento.
   ========================================================================== */

(function () {
  'use strict';

  if (window.__gnPosReady) return;
  window.__gnPosReady = true;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function onEnter(el, cb, threshold) {
    if (!el) return;
    if (!('IntersectionObserver' in window)) {
      cb();
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          io.unobserve(e.target);
          cb(e.target);
        });
      },
      { threshold: threshold || 0.2 }
    );
    io.observe(el);
  }

  /* ---------------------------------------------------------------- Reveal */

  function initReveal() {
    var items = document.querySelectorAll('.gnp-rv, .gnp-line');
    if (!items.length) return;

    if (reduced || !('IntersectionObserver' in window)) {
      items.forEach(function (el) {
        el.classList.add('is-in');
      });
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          // Las líneas de un mismo titular entran escalonadas.
          var delay = parseFloat(e.target.getAttribute('data-gnp-delay') || 0);
          setTimeout(function () {
            e.target.classList.add('is-in');
          }, delay);
          io.unobserve(e.target);
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -6% 0px' }
    );

    items.forEach(function (el) {
      io.observe(el);
    });
  }

  /**
   * Escalona las líneas de cada display para que entren una tras otra.
   */
  function stageLines() {
    document.querySelectorAll('[data-gnp-lines]').forEach(function (wrap) {
      var lines = wrap.querySelectorAll('.gnp-line');
      lines.forEach(function (line, i) {
        line.setAttribute('data-gnp-delay', i * 90);
      });
    });
  }

  /* ------------------------------------------------------------- Marquesina */

  /**
   * Duplica el contenido hasta cubrir el ancho visible dos veces, para que el
   * bucle no muestre huecos en pantallas anchas.
   */
  function initMarquee(track) {
    var group = track.querySelector('.gnp-ticker__group');
    if (!group) return;

    // Duplicar hasta cubrir dos veces el ancho visible. Se corta si el ancho
    // deja de crecer: si el CSS no cargó, el grupo no es una fila y duplicar
    // no sirve de nada (llegó a generar 150.000 nodos en una prueba).
    var needed = track.offsetWidth * 2;
    var guard = 0;
    var prev = -1;
    while (group.scrollWidth < needed && guard < 6) {
      if (group.scrollWidth === prev) break;
      prev = group.scrollWidth;
      group.innerHTML += group.innerHTML;
      guard++;
    }

    if (group.scrollWidth < needed) return;

    var clone = group.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    track.appendChild(clone);

    // La velocidad se fija por distancia, no por tiempo: así todas las filas
    // se mueven al mismo ritmo aunque tengan distinta cantidad de ítems.
    var pxPerSecond = parseFloat(track.getAttribute('data-gnp-speed') || 55);

    function setSpeed() {
      var duration = group.scrollWidth / pxPerSecond;
      group.style.setProperty('--speed', duration + 's');
      clone.style.setProperty('--speed', duration + 's');
    }

    setSpeed();

    // El ancho del grupo cambia con el corte: si la duración se calcula una
    // sola vez, al redimensionar la marquesina deja de ir a los px/s pedidos.
    var resizeTimer = null;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(setSpeed, 180);
    });

    /* Frenado suave -------------------------------------------------------
     * Antes esto era animation-play-state:paused en CSS, que corta la
     * marquesina en seco al entrar y la devuelve a velocidad plena al salir.
     * Se reemplaza por una rampa sobre playbackRate: la fila desacelera
     * hasta parar y vuelve a arrancar sin saltos.
     */
    var target = 1;
    var current = 1;
    var frame = null;

    function anims() {
      if (!group.getAnimations) return [];
      return group.getAnimations().concat(clone.getAnimations());
    }

    function tick() {
      // 0.16 por cuadro da medio segundo de frenado a 60fps.
      current += (target - current) * 0.16;
      if (Math.abs(target - current) < 0.004) current = target;
      anims().forEach(function (a) {
        a.playbackRate = current;
      });
      frame = current === target ? null : window.requestAnimationFrame(tick);
    }

    function ramp(to) {
      target = to;
      if (frame === null) frame = window.requestAnimationFrame(tick);
    }

    track.addEventListener('pointerenter', function () {
      ramp(0);
    });
    track.addEventListener('pointerleave', function () {
      ramp(1);
    });
    // Equivalente para teclado, que antes cubria :focus-within.
    track.addEventListener('focusin', function () {
      ramp(0);
    });
    track.addEventListener('focusout', function () {
      ramp(1);
    });
  }

  /* ------------------------------------------------------------- Contadores */

  function initCounter(el) {
    var target = parseFloat(el.getAttribute('data-gnp-count'));
    if (isNaN(target)) return;

    var decimals = (el.getAttribute('data-gnp-decimals') || '0') | 0;

    if (reduced) {
      el.textContent = target.toFixed(decimals);
      return;
    }

    onEnter(
      el,
      function () {
        var start = null;
        var dur = 1500;

        function step(ts) {
          if (start === null) start = ts;
          var p = Math.min((ts - start) / dur, 1);
          // easeOutExpo: arranca rápido y frena, se lee mejor que lineal.
          var eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
          el.textContent = (target * eased).toFixed(decimals);
          if (p < 1) window.requestAnimationFrame(step);
        }

        window.requestAnimationFrame(step);
      },
      0.6
    );
  }

  /* ----------------------------------------------------------------- FAQ */

  function initFaq(root) {
    var items = root.querySelectorAll('.gnp-faq__item');

    items.forEach(function (item) {
      var btn = item.querySelector('.gnp-faq__q');
      var panel = item.querySelector('.gnp-faq__a');
      if (!btn || !panel) return;

      btn.addEventListener('click', function () {
        var open = item.classList.contains('is-open');

        // Acordeón: se cierra el resto.
        items.forEach(function (other) {
          if (other === item) return;
          other.classList.remove('is-open');
          var p = other.querySelector('.gnp-faq__a');
          var b = other.querySelector('.gnp-faq__q');
          if (p) p.style.height = '0px';
          if (b) b.setAttribute('aria-expanded', 'false');
        });

        if (open) {
          panel.style.height = '0px';
          item.classList.remove('is-open');
          btn.setAttribute('aria-expanded', 'false');
        } else {
          var inner = panel.firstElementChild;
          panel.style.height = (inner ? inner.offsetHeight : 0) + 'px';
          item.classList.add('is-open');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });

    // Si cambia el ancho, el panel abierto se remide.
    window.addEventListener('resize', function () {
      var open = root.querySelector('.gnp-faq__item.is-open .gnp-faq__a');
      if (!open) return;
      var inner = open.firstElementChild;
      open.style.height = (inner ? inner.offsetHeight : 0) + 'px';
    });
  }

  /* --------------------------------------------------------------- Header */

  /**
   * El menu desplegable se saco del header. Lo unico que queda es el
   * comportamiento de la barra al scrollear, que antes vivia despues de un
   * "if (!btn || !panel) return": sin el boton, esa guarda se llevaba puesto
   * tambien el auto-hide.
   */
  function initNav(root) {
    // El header se esconde al bajar y vuelve al subir.
    var last = window.pageYOffset;
    var ticking = false;

    function update() {
      var y = window.pageYOffset;
      var delta = y - last;

      if (y <= 90) {
        root.classList.remove('is-hidden');
      } else if (delta > 6) {
        root.classList.add('is-hidden');
      } else if (delta < -6) {
        root.classList.remove('is-hidden');
      }

      root.classList.toggle('is-solid', y > 90);
      last = y;
      ticking = false;
    }

    window.addEventListener(
      'scroll',
      function () {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(update);
      },
      { passive: true }
    );

    // Si la pagina se abre ya scrolleada, con un ancla en la URL o al volver
    // atras, el estado tiene que estar bien desde el primer cuadro.
    update();
  }

  /* --------------------------------------------------------------- Intro */

  /**
   * La animación de salida es CSS, así que la pantalla se retira sola aunque
   * esto no corra. Acá solo se evita repetirla dentro de la misma sesión y se
   * saca el nodo del DOM cuando terminó.
   */
  function initIntro(el) {
    var KEY = 'gn-intro-seen';
    var seen = false;
    try { seen = sessionStorage.getItem(KEY) === '1'; } catch (e) {}

    if (seen) {
      el.setAttribute('data-seen', '');
      return;
    }

    try { sessionStorage.setItem(KEY, '1'); } catch (e) {}

    el.addEventListener('animationend', function (ev) {
      if (ev.animationName !== 'gnpIntroOut') return;
      if (el.parentNode) el.parentNode.removeChild(el);
    });
  }

  /* --------------------------------------------------------------- Anclas */

  /**
   * El tema declara .bls-wrapper{overflow-x:hidden}. Con un eje en hidden y el
   * otro en visible, el visible computa a auto: el wrapper pasa a ser un
   * contenedor con scroll y el navegador intenta desplazarlo a el en vez de al
   * documento. Como crece con su contenido, no se mueve nada y los enlaces del
   * menu y del footer parecen muertos.
   *
   * Se resuelve tomando el click y desplazando la ventana a mano, que ademas
   * permite descontar la altura del header fijo.
   */
  var anchorsReady = false;

  /**
   * El behavior:'smooth' del navegador tarda mas o menos lo mismo sea cual sea
   * la distancia: unos 400ms. Del hero al contacto hay varios miles de pixeles
   * y ese recorrido en 400ms se ve como un tiron, no como un desplazamiento.
   *
   * Este reemplazo hace durar el viaje segun lo lejos que quede, con un tope.
   * La curva es solo de salida: arranca a fondo y frena al llegar. Con una
   * curva de entrada y salida el arranque se arrastraba. Si la persona toca
   * la rueda o la pantalla en el medio, se cancela y le devuelve el control.
   */
  function scrollSuave(destino) {
    var desde = window.pageYOffset;
    var tramo = destino - desde;
    if (Math.abs(tramo) < 2) return;

    // 0.30ms por pixel, entre 420ms y 1.1s.
    var dur = Math.min(1100, Math.max(420, Math.abs(tramo) * 0.3));
    var t0 = null;
    var cancelado = false;

    function cancelar() {
      cancelado = true;
    }

    window.addEventListener('wheel', cancelar, { passive: true, once: true });
    window.addEventListener('touchstart', cancelar, { passive: true, once: true });

    function paso(ts) {
      if (cancelado) return;
      if (t0 === null) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur);
      // easeOutQuad: velocidad maxima al principio, cero al llegar.
      var e = 1 - (1 - p) * (1 - p);
      window.scrollTo(0, desde + tramo * e);
      if (p < 1) window.requestAnimationFrame(paso);
      else {
        window.removeEventListener('wheel', cancelar);
        window.removeEventListener('touchstart', cancelar);
      }
    }

    window.requestAnimationFrame(paso);
  }

  function initAnchors() {
    // boot() corre de nuevo con cada shopify:section:load. Sin esta guarda se
    // apilaba un listener por recarga y el pushState se repetia.
    if (anchorsReady) return;
    anchorsReady = true;

    document.addEventListener('click', function (ev) {
      var link = ev.target.closest && ev.target.closest('a[href^="#"]');
      if (!link) return;

      var hash = link.getAttribute('href');
      if (!hash || hash.length < 2) return;

      var target;
      try {
        target = document.querySelector(hash);
      } catch (e) {
        return;
      }
      if (!target) return;

      ev.preventDefault();

      // Sincronico a proposito. Antes esto vivia dentro de un
      // requestAnimationFrame para esperar a que el menu devolviera el scroll,
      // pero el menu ya no lo bloquea y rAF no dispara en pestanas ocultas ni
      // con el ahorro de energia, asi que el enlace quedaba mudo.
      var header = document.querySelector('.gnp-nav');
      var offset = header ? header.offsetHeight : 0;
      var y = target.getBoundingClientRect().top + window.pageYOffset - offset - 8;

      if (reduced) {
        window.scrollTo(0, Math.max(0, y));
      } else {
        scrollSuave(Math.max(0, y));
      }

      if (window.history && window.history.pushState) {
        window.history.pushState(null, '', hash);
      }
    });
  }

  /* ----------------------------------------------------------------- Boot */

  function each(selector, fn) {
    document.querySelectorAll(selector).forEach(function (el) {
      if (el.hasAttribute('data-gnp-ready')) return;
      el.setAttribute('data-gnp-ready', '');
      fn(el);
    });
  }

  function boot() {
    stageLines();
    initReveal();
    initAnchors();
    each('[data-gn-intro]', initIntro);
    each('[data-gnp-nav]', initNav);
    each('[data-gnp-marquee]', initMarquee);
    each('[data-gnp-count]', initCounter);
    each('[data-gnp-faq]', initFaq);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  document.addEventListener('shopify:section:load', boot);
})();
