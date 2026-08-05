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
    var duration = group.scrollWidth / pxPerSecond;
    group.style.setProperty('--speed', duration + 's');
    clone.style.setProperty('--speed', duration + 's');
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
