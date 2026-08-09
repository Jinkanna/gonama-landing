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

  /* ------------------------------------------------------- Seccion clavada */

  /**
   * La seccion mide una pantalla por bloque. Mientras se la recorre, el
   * escenario se queda quieto y el bloque activo va cambiando.
   *
   * En unitedcarriers esto es position:sticky. Aca no sirve: el tema declara
   * .bls-wrapper{overflow-x:hidden} y con un eje en hidden el otro computa a
   * auto, con lo que ese div pasa a ser el contenedor de scroll de los sticky
   * y nunca se activan. Medido sobre el sitio publicado: tras bajar 800px el
   * elemento seguia a 8850px del tope. Se resuelve con position:fixed, que es
   * lo que ya usa el header.
   */
  function initPin(section) {
    var stage = section.querySelector('[data-gnp-pin-stage]');
    if (!stage) return;

    var items = section.querySelectorAll('[data-gnp-pin-item]');
    var dots = section.querySelectorAll('[data-gnp-pin-dot]');
    var fill = section.querySelector('[data-gnp-pin-progress]');
    if (!items.length) return;

    var estado = '';
    var activo = -1;
    var ticking = false;

    function update() {
      ticking = false;
      if (reduced) return;

      var r = section.getBoundingClientRect();
      var vh = window.innerHeight;

      var nuevo;
      if (r.top > 0) nuevo = 'start';
      else if (r.bottom < vh) nuevo = 'end';
      else nuevo = 'fixed';

      if (nuevo !== estado) {
        estado = nuevo;
        stage.setAttribute('data-state', nuevo);
      }

      // Recorrido util: todo lo que sobra despues de la primera pantalla.
      var total = section.offsetHeight - vh;
      var p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
      // La linea de avance se actualiza siempre, no solo al cambiar de bloque:
      // es lo que da la sensacion de que la pagina sigue respondiendo.
      if (fill) fill.style.transform = 'scaleX(' + p + ')';

      // El ultimo bloque tiene que alcanzarse justo al final, de ahi el 0.999.
      var pos = p * 0.999 * items.length;
      var i = Math.floor(pos);

      /* El encendido no es binario: cada bloque recibe su peso segun a que
         distancia esta del centro de su tramo. Cerca del centro vale uno, y
         hacia el borde baja con una curva suave, asi el que se va y el que
         llega se cruzan en vez de saltar de golpe. El corrimiento vertical es
         chico y va en la misma direccion del scroll: es lo que hace que el
         cambio se lea como movimiento y no como un encendido. */
      for (var w = 0; w < items.length; w++) {
        var dist = Math.abs(pos - (w + 0.5));
        var t = Math.min(1, Math.max(0, (dist - 0.3) / 0.45));
        var suave = t * t * (3 - 2 * t);
        items[w].style.setProperty('--gnp-w', (1 - suave).toFixed(3));
        items[w].style.setProperty('--gnp-y', ((pos - (w + 0.5)) * -7).toFixed(1) + 'px');
      }

      if (i !== activo) {
        activo = i;
        for (var k = 0; k < items.length; k++) {
          items[k].classList.toggle('is-active', k === i);
        }
        for (var d = 0; d < dots.length; d++) {
          dots[d].classList.toggle('is-active', d === i);
        }
      }
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

    window.addEventListener('resize', update);
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

  /* ----------------------------------------------------------- Salida hero */

  /**
   * El hero no se corta contra la seccion siguiente: se retira mientras se lo
   * deja atras. El globo se apaga y se oscurece, y el cielo se desvanece
   * creciendo apenas, todo atado a la posicion del scroll y no a una duracion.
   *
   * Los valores estan medidos sobre unitedcarriers, que resuelve el pasaje asi
   * mismo: el recorrido arranca cuando el hero subio un quinto de pantalla y
   * termina cuando su centro llega al tope. Sobre el final de ese recorrido su
   * globo queda en opacidad 0.196 con brightness 0.357 y el cielo en scale
   * 1.08, que es lo que reproducen estas cuentas.
   */
  function initHeroExit(hero) {
    if (!hero.querySelector('[data-gnp-globe]')) return;

    var ticking = false;

    function update() {
      ticking = false;
      if (reduced) return;

      var r = hero.getBoundingClientRect();
      var inicio = -0.2 * window.innerHeight;
      /* Ellos terminan cuando el centro del hero llega al tope, pero su hero
         mide 2395px y el nuestro 718: con la misma proporcion la salida se
         resolvia en 257px de scroll y se sentia de golpe. Estirado a cuatro
         quintos del alto queda un recorrido parecido al de ellos en pantalla,
         que es lo que importa. */
      var fin = -r.height * 0.8;
      if (fin >= inicio) return;

      var p = (r.top - inicio) / (fin - inicio);
      hero.style.setProperty('--gnp-salida', Math.min(1, Math.max(0, p)).toFixed(3));
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

    window.addEventListener('resize', update);
    update();

  }

  /**
   * La contracara de la salida del hero, aplicada a toda la pagina: ninguna
   * seccion espera a estar en cuadro para aparecer de golpe, todas suben y se
   * encienden mientras uno baja. Asi el pasaje entre dos se lee como un solo
   * movimiento y no como bloques que se turnan.
   *
   * Un solo listener para todas: cada seccion con el suyo eran diez callbacks
   * por evento de scroll. Primero se miden todas y despues se escribe, para no
   * intercalar lecturas y escrituras de layout.
   *
   * Quedan afuera el hero, que tiene su propia salida, la cabecera, la pantalla
   * de entrada y la seccion clavada. Esta ultima sobre todo: el transform de
   * esta animacion crea un contenedor de posicionamiento y le rompe el
   * position:fixed del escenario.
   */
  function initEntradas() {
    var lista = Array.prototype.slice.call(
      document.querySelectorAll(
        '.gnp:not(.gnp-hero):not(.gnp-nav):not(.gnp-intro):not([data-gnp-pin])'
      )
    ).filter(function (el) {
      /* El tema tiene elementos sueltos que arrastran la clase gnp sin ser
         secciones. Se los reconoce porque no tienen contenedor adentro. */
      return el.querySelector('.gnp__in');
    });
    if (!lista.length) return;

    lista.forEach(function (el) {
      el.setAttribute('data-gnp-entrada', '');
    });

    var ticking = false;

    function update() {
      ticking = false;
      if (reduced) return;

      var vh = window.innerHeight;
      var medidas = lista.map(function (el) {
        return el.getBoundingClientRect().top;
      });

      medidas.forEach(function (top, i) {
        /* Arranca cuando el tope asoma por abajo y termina cuando subio tres
           cuartos de pantalla, o sea bastante antes de quedar centrada: si
           terminara al llegar arriba, uno la leeria todavia entrando. */
        var p = (vh - top) / (vh * 0.75);
        lista[i].style.setProperty('--gnp-entrada', Math.min(1, Math.max(0, p)).toFixed(3));
      });
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

    window.addEventListener('resize', update);
    update();
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
    each('[data-gnp-pin]', initPin);
    each('.gnp-hero--globe', initHeroExit);
    initEntradas();
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
