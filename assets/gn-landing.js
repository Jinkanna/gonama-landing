/* ==========================================================================
   GOnama landing 2026
   Solo tres comportamientos: reveal al scroll, secuencia del diagrama del hero
   y consola de Imagine Code. Todo se apaga si el sistema pide menos movimiento.
   ========================================================================== */

(function () {
  'use strict';

  // Cada sección incluye este script, así que puede aparecer varias veces en la
  // página. Solo el primero hace algo.
  if (window.__gnLandingReady) return;
  window.__gnLandingReady = true;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /**
   * Ejecuta un callback la primera vez que el elemento entra en pantalla.
   */
  function onEnter(el, cb, threshold) {
    if (!el) return;

    if (!('IntersectionObserver' in window)) {
      cb();
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          io.unobserve(entry.target);
          cb();
        });
      },
      { threshold: threshold || 0.25 }
    );

    io.observe(el);
  }

  /* ---------------------------------------------------------------- Reveal */

  function initReveal() {
    var items = document.querySelectorAll('.gn-reveal');
    if (!items.length) return;

    if (reduced || !('IntersectionObserver' in window)) {
      items.forEach(function (el) {
        el.classList.add('is-visible');
      });
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );

    items.forEach(function (el) {
      io.observe(el);
    });
  }

  /* ------------------------------------------------- Diagrama del hero */

  function initArch(root) {
    var nodes = root.querySelectorAll('[data-gn-node]');
    var lines = root.querySelectorAll('[data-gn-line]');
    var labels = root.querySelectorAll('[data-gn-label]');
    var branches = root.querySelectorAll('[data-gn-branch]');
    var chat = root.querySelector('[data-gn-chat]');
    var chatText = root.querySelector('[data-gn-chat-text]');
    var dot = root.querySelector('[data-gn-dot]');
    var phrase = root.getAttribute('data-gn-phrase') || '';

    function activateNodes(step) {
      root.querySelectorAll('[data-gn-node="' + step + '"]').forEach(function (n) {
        n.classList.add('is-on');
      });
    }

    function showAll() {
      nodes.forEach(function (n) {
        n.classList.add('is-on');
      });
      lines.forEach(function (l) {
        l.classList.add('is-on');
      });
      labels.forEach(function (l) {
        l.classList.add('is-on');
      });
      branches.forEach(function (b) {
        b.classList.add('is-on');
      });
      if (chat) chat.classList.add('is-on');
      if (dot) dot.classList.add('is-on');
      if (chatText) chatText.textContent = phrase;
    }

    if (reduced) {
      showAll();
      return;
    }

    function typePhrase() {
      if (!chatText) return;
      chatText.textContent = '';
      var i = 0;
      var timer = setInterval(function () {
        if (i < phrase.length) {
          chatText.textContent += phrase.charAt(i);
          i++;
        } else {
          clearInterval(timer);
        }
      }, 42);
    }

    var steps = [
      function () {
        if (labels[0]) labels[0].classList.add('is-on');
        activateNodes(0);
      },
      function () {
        activateNodes(1);
        if (lines[0]) lines[0].classList.add('is-on');
      },
      function () {
        if (lines[1]) lines[1].classList.add('is-on');
        if (branches[0]) branches[0].classList.add('is-on');
        activateNodes(2);
      },
      function () {
        if (lines[2]) lines[2].classList.add('is-on');
        if (chat) chat.classList.add('is-on');
        typePhrase();
      },
      function () {
        if (lines[3]) lines[3].classList.add('is-on');
        if (dot) dot.classList.add('is-on');
        if (labels[1]) labels[1].classList.add('is-on');
      },
      function () {
        activateNodes(4);
      },
      function () {
        if (lines[4]) lines[4].classList.add('is-on');
        if (branches[1]) branches[1].classList.add('is-on');
        activateNodes(5);
      },
      function () {
        if (lines[5]) lines[5].classList.add('is-on');
        activateNodes(6);
      }
    ];

    onEnter(
      root,
      function () {
        var i = 0;
        (function next() {
          if (i >= steps.length) return;
          steps[i]();
          i++;
          setTimeout(next, 620);
        })();
      },
      0.2
    );
  }

  /* --------------------------------------------- Barras de velocidad */

  function initVelocity(root) {
    var human = root.querySelector('[data-gn-bar="human"]');
    var agent = root.querySelector('[data-gn-bar="agent"]');
    if (!human || !agent) return;

    function fill() {
      human.style.width = human.getAttribute('data-gn-width') || '22%';
      agent.style.width = agent.getAttribute('data-gn-width') || '100%';
    }

    if (reduced) {
      fill();
      return;
    }

    onEnter(
      root,
      function () {
        setTimeout(fill, 120);
      },
      0.35
    );
  }

  /* ------------------------------------------ Consola de Imagine Code */

  function initConsole(root) {
    var typed = root.querySelector('[data-gn-typed]');
    var steps = Array.prototype.slice.call(root.querySelectorAll('[data-gn-step]'));
    var prompts = [];

    try {
      prompts = JSON.parse(root.getAttribute('data-gn-prompts') || '[]');
    } catch (e) {
      prompts = [];
    }

    if (!typed || !prompts.length) return;

    if (reduced) {
      typed.textContent = prompts[0];
      steps.forEach(function (s) {
        s.classList.add('is-done');
      });
      return;
    }

    function clearSteps() {
      steps.forEach(function (s) {
        s.classList.remove('is-on', 'is-done');
      });
    }

    function runPipeline() {
      var i = 0;
      (function next() {
        if (i > 0 && steps[i - 1]) {
          steps[i - 1].classList.remove('is-on');
          steps[i - 1].classList.add('is-done');
        }
        if (i < steps.length) {
          steps[i].classList.add('is-on');
          i++;
          setTimeout(next, 650);
        }
      })();
    }

    function typePrompt(str, done) {
      typed.textContent = '';
      clearSteps();
      var i = 0;
      var timer = setInterval(function () {
        if (i < str.length) {
          typed.textContent += str.charAt(i);
          i++;
        } else {
          clearInterval(timer);
          runPipeline();
          setTimeout(done, steps.length * 650 + 900);
        }
      }, 26);
    }

    onEnter(
      root,
      function () {
        var index = 0;
        (function loop() {
          typePrompt(prompts[index % prompts.length], function () {
            index++;
            setTimeout(loop, 600);
          });
        })();
      },
      0.3
    );
  }

  /* ------------------------------------------------------------- Holdings */

  function initHoldings(root) {
    var btn = root.querySelector('[data-gn-holdings-trigger]');
    var panel = root.querySelector('[data-gn-holdings-panel]');
    if (!btn || !panel) return;

    btn.addEventListener('click', function () {
      var open = panel.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) {
        panel.querySelectorAll('.gn-reveal').forEach(function (el) {
          el.classList.add('is-visible');
        });
      }
    });
  }

  /* ----------------------------------------------------------------- Boot */

  /**
   * boot() vuelve a correr cada vez que el editor de temas recarga una sección,
   * así que cada elemento se inicializa una sola vez.
   */
  function each(selector, fn) {
    document.querySelectorAll(selector).forEach(function (el) {
      if (el.hasAttribute('data-gn-ready')) return;
      el.setAttribute('data-gn-ready', '');
      fn(el);
    });
  }

  function boot() {
    initReveal();

    each('[data-gn-arch]', initArch);
    each('[data-gn-velocity]', initVelocity);
    each('[data-gn-console]', initConsole);
    each('[data-gn-holdings]', initHoldings);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // El editor de temas de Shopify recarga secciones sin refrescar la página.
  document.addEventListener('shopify:section:load', boot);
})();
