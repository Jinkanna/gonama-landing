/**
 * Punto de entrada del globo 3D.
 *
 * Monta React solo cuando el contenedor entra en pantalla, y no monta nada si
 * el navegador no tiene WebGL o si el sistema pide menos movimiento. Eso
 * mantiene el costo fuera del camino critico de carga.
 */
import { StrictMode, Suspense, lazy, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import Globe from './Globe.jsx';

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) {
    return false;
  }
}

/** Lee la paleta del CSS, para que el globo siga al tema y no duplique colores. */
function readPalette(el) {
  const cs = getComputedStyle(el);
  const v = (name, fallback) => (cs.getPropertyValue(name) || '').trim() || fallback;
  return {
    deep: v('--gn3d-deep', '#080d1a'),
    rim: v('--gn3d-rim', '#2a6ea8'),
    wire: v('--gn3d-wire', '#44b7e8'),
    dust: v('--gn3d-dust', '#9fd8f2'),
    node: v('--gn3d-node', '#2dd4bf'),
    arc: v('--gn3d-arc', '#44b7e8')
  };
}

function Scene({ palette }) {
  return (
    <>
      <Globe palette={palette} reduced={REDUCED} />
      {/* Bloom corto y de umbral alto: solo encienden los nodos y los arcos,
          no la esfera entera. Es lo que separa lo cinematografico del neon. */}
      <EffectComposer disableNormalPass multisampling={0}>
        <Bloom intensity={0.62} luminanceThreshold={0.42} luminanceSmoothing={0.28} mipmapBlur radius={0.62} />
      </EffectComposer>
    </>
  );
}

function App({ palette }) {
  const [ready, setReady] = useState(false);

  // Un cuadro de espera antes de crear el contexto WebGL, para no competir
  // con la pintura del hero.
  useEffect(() => {
    const id = window.requestAnimationFrame(() => setReady(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  if (!ready) return null;

  return (
    <Canvas
      dpr={[1, 1.75]}
      gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
      camera={{ position: [0, 0, 4.4], fov: 30, near: 0.1, far: 14 }}
      frameloop={REDUCED ? 'demand' : 'always'}
      style={{ width: '100%', height: '100%', display: 'block' }}
    >
      <Suspense fallback={null}>
        <Scene palette={palette} />
      </Suspense>
    </Canvas>
  );
}

function mount(el) {
  if (el.dataset.gn3dReady) return;
  el.dataset.gn3dReady = '1';

  if (!hasWebGL()) {
    el.setAttribute('data-gn3d-unsupported', '');
    return;
  }

  const palette = readPalette(el);
  createRoot(el).render(
    <StrictMode>
      <App palette={palette} />
    </StrictMode>
  );
}

function boot() {
  document.querySelectorAll('[data-gn-globe3d]').forEach((el) => {
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(
        (entries) => {
          if (!entries[0].isIntersecting) return;
          io.disconnect();
          mount(el);
        },
        { rootMargin: '200px' }
      );
      io.observe(el);
    } else {
      mount(el);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
document.addEventListener('shopify:section:load', boot);
