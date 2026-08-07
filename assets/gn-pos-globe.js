/* ==========================================================================
   GOnama · landing new-pos · Globo del hero
   Globo en three.js: la tierra son las costas dibujadas con línea fina, sin
   relleno, sobre un cuerpo sombreado y una atmósfera que se enciende en el
   contorno. Los mercados van como pines con halo y las rutas como arcos que
   se animan por shader. Nada de esto toca la CPU por frame salvo la rotación.

   El módulo se carga con un import map declarado en gn-pos-hero.liquid, así
   three.js y sus addons viven en assets del tema y no dependen de un CDN.
   ========================================================================== */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
/* La geometría entra por import estático y no por import() dinámico: Shopify
   minifica los .js del tema y en el camino convierte el import() en un
   require(), que en el navegador no existe. El especificador se resuelve en
   el import map de gn-pos-hero.liquid. */
import LAND_TOPOLOGY from 'gn-globe-land';

/* ------------------------------------------------------------------ Datos */

/* Mercados de GOnama. lat y lng reales de cada ciudad, en el mismo idioma que
   el resto de la página. El núcleo es Latinoamérica y el resto son los hubs
   con los que conecta. Solo unos pocos llevan etiqueta: con las veinticinco
   juntas el Caribe y Europa quedan ilegibles. */
var MARKETS = [
  /* Latinoamérica */
  /* Montevideo es la casa, asi que lleva la etiqueta y el pin mas grande.
     Buenos Aires queda a menos de dos grados: con las dos etiquetas puestas
     se pisan, y por eso va sin ella. */
  { city: 'Montevideo', lat: -34.9011, lng: -56.1645, size: 1.35, label: true },
  { city: 'Buenos Aires', lat: -34.6037, lng: -58.3816, size: 1.1 },
  { city: 'Santiago', lat: -33.4489, lng: -70.6693, size: 1.1, label: true },
  { city: 'São Paulo', lat: -23.5505, lng: -46.6333, size: 1.25, label: true },
  { city: 'Asunción', lat: -25.2637, lng: -57.5759, size: 1 },
  { city: 'Lima', lat: -12.0464, lng: -77.0428, size: 1.1, label: true },
  { city: 'Bogotá', lat: 4.711, lng: -74.0721, size: 1.1, label: true },
  { city: 'Quito', lat: -0.1807, lng: -78.4678, size: 1 },
  { city: 'Panama City', lat: 8.9824, lng: -79.5199, size: 1 },
  { city: 'San José', lat: 9.9281, lng: -84.0907, size: 1 },
  { city: 'Mexico City', lat: 19.4326, lng: -99.1332, size: 1.25, label: true },

  /* Norteamérica */
  { city: 'Miami', lat: 25.7617, lng: -80.1918, size: 1.1, label: true },
  { city: 'New York', lat: 40.7128, lng: -74.006, size: 1.25, label: true },
  { city: 'Los Angeles', lat: 34.0522, lng: -118.2437, size: 1.1 },
  { city: 'Toronto', lat: 43.6532, lng: -79.3832, size: 1 },

  /* Europa, África y Medio Oriente */
  { city: 'Madrid', lat: 40.4168, lng: -3.7038, size: 1.1, label: true },
  { city: 'Lisbon', lat: 38.7223, lng: -9.1393, size: 1 },
  { city: 'London', lat: 51.5074, lng: -0.1278, size: 1.25, label: true },
  { city: 'Amsterdam', lat: 52.3676, lng: 4.9041, size: 1 },
  { city: 'Dubai', lat: 25.2048, lng: 55.2708, size: 1.1 },
  { city: 'Johannesburg', lat: -26.2041, lng: 28.0473, size: 1 },

  /* Asia y Oceanía */
  { city: 'Singapore', lat: 1.3521, lng: 103.8198, size: 1.1 },
  { city: 'Shanghai', lat: 31.2304, lng: 121.4737, size: 1.1 },
  { city: 'Tokyo', lat: 35.6762, lng: 139.6503, size: 1.1 },
  { city: 'Sydney', lat: -33.8688, lng: 151.2093, size: 1 }
];

/* Rutas entre mercados. Cada par es un arco que sale y vuelve a entrar. La
   malla es densa a propósito: de lejos lo que se lee es la red, no el tramo. */
var ROUTES = [
  /* Cono sur y Brasil */
  ['Montevideo', 'Buenos Aires'],
  ['Montevideo', 'São Paulo'],
  ['Montevideo', 'Santiago'],
  ['Montevideo', 'Asunción'],
  ['Montevideo', 'Lima'],
  ['Buenos Aires', 'Santiago'],
  ['Buenos Aires', 'São Paulo'],
  ['Santiago', 'Lima'],
  ['Santiago', 'São Paulo'],
  ['Asunción', 'São Paulo'],

  /* Andes, Centroamérica y Caribe */
  ['Lima', 'Quito'],
  ['Lima', 'Bogotá'],
  ['Quito', 'Bogotá'],
  ['Bogotá', 'Panama City'],
  ['Bogotá', 'Mexico City'],
  ['Panama City', 'San José'],
  ['San José', 'Mexico City'],
  ['Panama City', 'Miami'],

  /* Norteamérica */
  ['Mexico City', 'Miami'],
  ['Mexico City', 'Los Angeles'],
  ['Miami', 'New York'],
  ['New York', 'Toronto'],
  ['Los Angeles', 'New York'],
  ['São Paulo', 'Miami'],
  ['Montevideo', 'Miami'],
  ['Bogotá', 'New York'],

  /* Cruces del Atlántico */
  ['Montevideo', 'Madrid'],
  ['São Paulo', 'Lisbon'],
  ['Miami', 'Madrid'],
  ['New York', 'London'],
  ['Mexico City', 'Madrid'],
  ['São Paulo', 'Johannesburg'],

  /* Europa y su salida al este */
  ['Madrid', 'London'],
  ['Lisbon', 'Madrid'],
  ['London', 'Amsterdam'],
  ['Amsterdam', 'Dubai'],
  ['London', 'Dubai'],
  ['Dubai', 'Singapore'],
  ['Dubai', 'Johannesburg'],

  /* Asia y Pacífico */
  ['Singapore', 'Shanghai'],
  ['Shanghai', 'Tokyo'],
  ['Singapore', 'Sydney'],
  ['Tokyo', 'Los Angeles'],
  ['Sydney', 'Santiago']
];

var DEFAULTS = {
  /* Paso de muestreo de la costa, en grados. Mas chico dibuja mas fino y pesa
     mas; a 0.5 los anillos ya se ven curvos y no poligonales. */
  coastStep: 0.5,
  coastColor: '#dcf0fa',
  coastOpacity: 0.92,
  pinColor: '#44b7e8',
  arcColor: '#44b7e8',
  pinSize: 0.006,
  pinAltitude: 0.008,
  haloScale: 7.5,
  showArcs: true,
  arcThickness: 0.002,
  arcAltBase: 0.02,
  arcAltMultiplier: 0.01,
  cameraZ: 2.9,
  /* Cuerpo y atmosfera. La camara va mas lejos que la esfera sola porque el
     cascaron de la atmosfera sobresale y si no se corta contra el canvas. */
  bodyLit: '#153a52',
  bodyShade: '#050912',
  bodyRim: '#178dbe',
  atmoLit: '#6fd2d8',
  atmoShade: '#2a7cb4',
  atmoStrength: 0.8,
  globeRotationX: 0.15,
  globeRotationZ: 0.05,
  enableControls: true,
  showLabels: true
};

/* ------------------------------------------------------- TopoJSON mínimo */
/* Solo lo necesario para sacar los polígonos de tierra de world-atlas. */

function topoTransform(topology) {
  if (!topology.transform) return function (p) { return p; };
  var kx = topology.transform.scale[0];
  var ky = topology.transform.scale[1];
  var dx = topology.transform.translate[0];
  var dy = topology.transform.translate[1];
  var x = 0;
  var y = 0;
  return function (point, i) {
    if (!i) { x = 0; y = 0; }
    return [(x += point[0]) * kx + dx, (y += point[1]) * ky + dy];
  };
}

function topoPolygons(topology, object) {
  var decode = topoTransform(topology);
  var arcs = topology.arcs;

  function arcPoints(index) {
    var arc = arcs[index < 0 ? ~index : index];
    var points = arc.map(decode);
    if (index < 0) points = points.slice().reverse();
    return points;
  }

  function ring(indexes) {
    var out = [];
    for (var i = 0; i < indexes.length; i++) {
      var points = arcPoints(indexes[i]);
      // El último punto de un arco es el primero del siguiente.
      if (i > 0) points = points.slice(1);
      out = out.concat(points);
    }
    return out;
  }

  var geometries = object.type === 'GeometryCollection' ? object.geometries : [object];
  var polygons = [];

  geometries.forEach(function (geom) {
    if (geom.type === 'Polygon') {
      polygons.push(geom.arcs.map(ring));
    } else if (geom.type === 'MultiPolygon') {
      geom.arcs.forEach(function (poly) {
        polygons.push(poly.map(ring));
      });
    }
  });

  return polygons;
}

/* El worker recibe los anillos como pares lon/lat planos, que es lo que puede
   viajar barato a otro hilo. */
function prepareLand(topology) {
  var polys = topoPolygons(topology, topology.objects.land);
  var flatPolygons = [];
  var geoPolygons = [];

  polys.forEach(function (rings) {
    flatPolygons.push(
      rings.map(function (r) {
        var out = new Float32Array((r.length + 1) * 2);
        var k = 0;
        for (var i = 0; i < r.length; i++) {
          out[k++] = r[i][0];
          out[k++] = r[i][1];
        }
        out[k++] = r[0][0];
        out[k++] = r[0][1];
        return out;
      })
    );
    geoPolygons.push({ type: 'Polygon', coordinates: rings });
  });

  return { polygons: flatPolygons, geoPolygons: geoPolygons };
}

var landPromise = null;

/* El armado de polígonos se hace una sola vez y se comparte entre instancias. */
function loadLand() {
  if (!landPromise) {
    landPromise = Promise.resolve()
      .then(function () {
        if (!LAND_TOPOLOGY || !LAND_TOPOLOGY.objects) {
          throw new Error('No se pudo cargar la geometría de tierra');
        }
        return prepareLand(LAND_TOPOLOGY);
      })
      .catch(function (err) {
        landPromise = null;
        throw err;
      });
  }
  return landPromise;
}

/* ---------------------------------------------------------------- Workers */

/* Costas: recorre cada anillo, lo re-muestrea a un paso fijo en grados y
   devuelve los pares de puntos de cada tramo, listos para dibujar como
   segmentos. El re-muestreo no es por prolijidad: los anillos de world-atlas
   traen tramos largos y una recta en el espacio entre dos puntos lejanos se
   hunde por debajo de la esfera. */
var COAST_WORKER = `
function wrapLon(lon){ return ((lon + 540) % 360) - 180; }
function sampleRing(ring, maxDegStep){
  var out = [];
  var currentDist = 0;
  if (ring.length >= 2) out.push(wrapLon(ring[0]), ring[1]);
  for (var i = 0; i < ring.length - 2; i += 2){
    var lon1 = ring[i], lat1 = ring[i+1];
    var lon2 = ring[i+2], lat2 = ring[i+3];
    var dLon = lon2 - lon1;
    var cortado = Math.abs(dLon) > 180;
    if (cortado){ dLon += dLon > 0 ? -360 : 360; }
    var dLat = lat2 - lat1;
    var cosLat = Math.cos((lat1 + lat2) * 0.5 * Math.PI / 180);
    var segLen = Math.sqrt((dLon * cosLat) * (dLon * cosLat) + dLat * dLat);
    if (!segLen) continue;
    var remain = segLen;
    var t = 0;
    while (currentDist + remain >= maxDegStep){
      var move = maxDegStep - currentDist;
      t += move / segLen;
      out.push(wrapLon(lon1 + dLon * t), lat1 + dLat * t);
      remain -= move;
      currentDist = 0;
    }
    currentDist += remain;
    out.push(wrapLon(lon2), lat2);
    currentDist = 0;
  }
  return out;
}
function vec3(lon, lat){
  var phi = (90 - lat) * Math.PI / 180;
  var th = (lon + 180) * Math.PI / 180;
  return [-Math.sin(phi) * Math.cos(th), Math.cos(phi), Math.sin(phi) * Math.sin(th)];
}
onmessage = function(e){
  var paso = e.data.paso;
  var polysIn = e.data.polysIn;
  var out = [];
  for (var p = 0; p < polysIn.length; p++){
    var poly = polysIn[p];
    for (var r = 0; r < poly.length; r++){
      var s = sampleRing(poly[r], paso);
      for (var i = 0; i + 3 < s.length; i += 2){
        var lonA = s[i], latA = s[i+1], lonB = s[i+2], latB = s[i+3];
        /* El tramo que cruza el antimeridiano daria una recta que atraviesa
           el globo de lado a lado. Se descarta. */
        if (Math.abs(lonB - lonA) > 180) continue;
        var a = vec3(lonA, latA), b = vec3(lonB, latB);
        out.push(a[0], a[1], a[2], b[0], b[1], b[2]);
      }
    }
  }
  var arr = new Float32Array(out);
  postMessage({ ok: true, line: arr }, [arr.buffer]);
};`;

/* Las costas, por paso de muestreo. Al cruzar un breakpoint el globo se rehace
   y sin esto el worker volveria a recorrer todos los anillos cada vez. El
   Float32Array se comparte: la geometría lo lee, no lo toca. */
var costaCache = {};

function costas(land, paso) {
  var clave = String(paso);
  if (!costaCache[clave]) {
    costaCache[clave] = runWorker(COAST_WORKER, { paso: paso, polysIn: land.polygons }).catch(
      function (err) {
        delete costaCache[clave];
        throw err;
      }
    );
  }
  return costaCache[clave];
}

function runWorker(source, payload) {
  return new Promise(function (resolve, reject) {
    var url = URL.createObjectURL(new Blob([source], { type: 'application/javascript' }));
    var worker = new Worker(url);
    worker.onmessage = function (e) {
      URL.revokeObjectURL(url);
      worker.terminate();
      if (e.data && e.data.ok) resolve(e.data);
      else reject(new Error('El worker del globo falló'));
    };
    worker.onerror = function (err) {
      URL.revokeObjectURL(url);
      worker.terminate();
      reject(err);
    };
    worker.postMessage(payload);
  });
}

/* --------------------------------------------------------------- Texturas */

function haloTexture(size) {
  size = size || 128;
  var canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  var ctx = canvas.getContext('2d');
  var grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(255,255,255,0.4)');
  grad.addColorStop(0.35, 'rgba(255,255,255,0.1)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  var tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}

/* --------------------------------------------------------------- Material */

/* Los puntos de la cara de atrás se descartan en el fragment shader: sin eso
   la silueta se ensucia y se ven los continentes del otro lado. */
/* Los segmentos de la cara de atrás se descartan en el fragment: sin eso la
   silueta se ensucia y se ven las costas del otro lado. El cuerpo ya tapa por
   profundidad, pero el recorte deja el filo limpio. */
function lineMaterial(color, opacity) {
  var mat = new THREE.LineBasicMaterial({
    color: new THREE.Color(color),
    transparent: true,
    opacity: opacity,
    depthWrite: false
  });

  mat.onBeforeCompile = function (shader) {
    shader.uniforms.uCamPos = { value: new THREE.Vector3() };

    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        '#include <common>\nvarying vec3 vWorldPos;'
      )
      .replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nvWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;'
      );

    var recorte =
      '{\n' +
      '  vec3 viewDir = normalize(uCamPos - vWorldPos);\n' +
      '  if (dot(viewDir, normalize(vWorldPos)) <= 0.0) discard;\n' +
      '}\n';

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      '#include <common>\nvarying vec3 vWorldPos;\nuniform vec3 uCamPos;'
    );

    ['opaque_fragment', 'output_fragment'].some(function (chunk) {
      var tag = '#include <' + chunk + '>';
      if (shader.fragmentShader.indexOf(tag) === -1) return false;
      shader.fragmentShader = shader.fragmentShader.replace(tag, recorte + tag);
      return true;
    });

    mat.userData.shader = shader;
  };

  return mat;
}

function latLngToVec3(lat, lng, radius) {
  var r = radius === undefined ? 1 : radius;
  var phi = (90 - lat) * (Math.PI / 180);
  var theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
}

/* ------------------------------------------------------------- El globo */

export function createGlobe(canvas, options) {
  var opt = Object.assign({}, DEFAULTS, options || {});
  var disposed = false;

  var maxDpr = canvas.clientWidth < 768 ? 1.5 : 2;
  var renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: false,
    powerPreference: 'low-power'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
  renderer.setClearColor(0x000000, 0);

  var width = canvas.clientWidth || canvas.offsetWidth || 800;
  var height = canvas.clientHeight || canvas.offsetHeight || width;
  renderer.setSize(width, height, false);

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 100);
  camera.position.set(0, 0, opt.cameraZ);

  var labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(width, height);
  labelRenderer.domElement.className = 'gnp-globe__labels';
  labelRenderer.domElement.style.position = 'absolute';
  labelRenderer.domElement.style.top = '0px';
  labelRenderer.domElement.style.left = '0px';
  labelRenderer.domElement.style.pointerEvents = 'none';
  canvas.parentNode.appendChild(labelRenderer.domElement);

  var controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.enabled = opt.enableControls;

  var dragging = false;
  var prevCursor = canvas.style.cursor;
  if (controls.enabled) canvas.style.cursor = 'grab';

  function setCursor(isDown) {
    if (!controls.enabled) return;
    canvas.style.cursor = isDown ? 'grabbing' : 'grab';
    canvas.classList.toggle('is-dragging', isDown);
  }
  var onStart = function () { dragging = true; setCursor(true); };
  var onEnd = function () { dragging = false; setCursor(false); };
  controls.addEventListener('start', onStart);
  controls.addEventListener('end', onEnd);

  var group = new THREE.Group();
  group.rotation.x = opt.globeRotationX;
  group.rotation.z = opt.globeRotationZ;
  scene.add(group);

  /* --- Cuerpo y atmósfera ---

     El volumen no se dibuja con sombras planas encima del canvas: son dos
     esferas de verdad en la escena. El cuerpo se sombrea por el ángulo con una
     luz fija, y la atmósfera es un cascarón un poco más grande que solo se
     enciende en el borde, donde la superficie se aleja de la cámara. Al girar
     el globo la luz se queda quieta y el terminador se mueve solo. */

  var luz = new THREE.Vector3(-0.35, 0.82, 0.45).normalize();

  var cuerpo = new THREE.Mesh(
    new THREE.SphereGeometry(0.995, 64, 64),
    new THREE.ShaderMaterial({
      uniforms: {
        uLuz: { value: luz },
        uIluminado: { value: new THREE.Color(opt.bodyLit) },
        uSombra: { value: new THREE.Color(opt.bodyShade) },
        uBorde: { value: new THREE.Color(opt.bodyRim) }
      },
      vertexShader: [
        'varying vec3 vNormal;',
        'varying vec3 vHaciaCamara;',
        'void main() {',
        '  vec4 mv = modelViewMatrix * vec4(position, 1.0);',
        '  vNormal = normalize(normalMatrix * normal);',
        '  vHaciaCamara = normalize(-mv.xyz);',
        '  gl_Position = projectionMatrix * mv;',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform vec3 uLuz;',
        'uniform vec3 uIluminado;',
        'uniform vec3 uSombra;',
        'uniform vec3 uBorde;',
        'varying vec3 vNormal;',
        'varying vec3 vHaciaCamara;',
        'void main() {',
        '  vec3 n = normalize(vNormal);',
        /* El terminador es suave a propósito: un corte duro parece una pelota
           de plástico y no un planeta. */
        '  float difusa = smoothstep(-0.45, 0.9, dot(n, normalize(uLuz)));',
        '  vec3 col = mix(uSombra, uIluminado, difusa);',
        /* El borde toma un poco de color aunque esté en sombra, que es lo que
           lo despega del fondo negro. */
        '  float borde = pow(1.0 - max(dot(n, normalize(vHaciaCamara)), 0.0), 3.0);',
        '  col += uBorde * borde * 0.55;',
        '  gl_FragColor = vec4(col, 1.0);',
        '}'
      ].join('\n')
    })
  );
  cuerpo.renderOrder = -1;
  group.add(cuerpo);

  var atmosfera = new THREE.Mesh(
    new THREE.SphereGeometry(1.06, 64, 64),
    new THREE.ShaderMaterial({
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        uLuz: { value: luz },
        uAlta: { value: new THREE.Color(opt.atmoLit) },
        uBaja: { value: new THREE.Color(opt.atmoShade) },
        uFuerza: { value: opt.atmoStrength }
      },
      vertexShader: [
        'varying vec3 vNormal;',
        'varying vec3 vHaciaCamara;',
        'varying vec3 vMundo;',
        'void main() {',
        '  vec4 mv = modelViewMatrix * vec4(position, 1.0);',
        '  vNormal = normalize(normalMatrix * normal);',
        '  vHaciaCamara = normalize(-mv.xyz);',
        '  vMundo = normalize(position);',
        '  gl_Position = projectionMatrix * mv;',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform vec3 uLuz;',
        'uniform vec3 uAlta;',
        'uniform vec3 uBaja;',
        'uniform float uFuerza;',
        'varying vec3 vNormal;',
        'varying vec3 vHaciaCamara;',
        'varying vec3 vMundo;',
        'void main() {',
        /* El cascaron se dibuja por dentro, asi que la normal apunta al lado
           contrario de la camara casi en toda su superficie y un producto
           escalar comun daria cero. Con el valor absoluto el brillo queda
           donde la normal es perpendicular a la vista, o sea el contorno.
           Lo de adentro del disco lo tapa el cuerpo, que si escribe
           profundidad, y por eso solo se ve el anillo. */
        '  float halo = pow(1.0 - abs(dot(normalize(vNormal), normalize(vHaciaCamara))), 3.2);',
        /* La luz se mide contra la normal en espacio de vista, no en el del
           objeto: asi se queda quieta mientras el globo gira debajo. */
        '  float lado = smoothstep(-0.15, 0.95, dot(normalize(vNormal), normalize(uLuz)));',
        '  vec3 col = mix(uBaja, uAlta, lado);',
        '  gl_FragColor = vec4(col, halo * uFuerza * (0.28 + 0.72 * lado));',
        '}'
      ].join('\n')
    })
  );
  group.add(atmosfera);

  /* --- Costas ---

     Una sola capa: el contorno de cada masa de tierra como línea continua,
     sin relleno. Las líneas de WebGL siempre miden un píxel, y para este
     dibujo eso juega a favor. */

  var capasConCamara = [];

  loadLand()
    .then(function (land) {
      if (disposed) return null;
      var costaMat = lineMaterial(opt.coastColor, opt.coastOpacity);
      capasConCamara.push(costaMat);

      return costas(land, opt.coastStep).then(function (res) {
        if (disposed) return;
        var geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(res.line, 3));
        group.add(new THREE.LineSegments(geo, costaMat));
        canvas.classList.add('is-ready');
      });
    })
    .catch(function (err) {
      console.error('Globo GOnama:', err);
    });

  /* --- Pines de mercado --- */

  var halo = haloTexture(128);
  var pins = [];
  var pinGeo = new THREE.CylinderGeometry(opt.pinSize, opt.pinSize, opt.pinAltitude, 12, 1, false);
  pinGeo.rotateX(Math.PI / 2);
  pinGeo.translate(0, 0, opt.pinAltitude / 2);

  var pinMat = new THREE.MeshBasicMaterial({ color: opt.pinColor });
  var haloMat = new THREE.SpriteMaterial({
    color: opt.pinColor,
    map: halo,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  (opt.markets || MARKETS).forEach(function (market) {
    var node = new THREE.Group();
    node.userData.market = market;

    var pos = latLngToVec3(parseFloat(market.lat), parseFloat(market.lng), 1.002);
    node.position.copy(pos);
    node.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), pos.clone().normalize());

    var pin = new THREE.Mesh(pinGeo, pinMat);
    var s = market.size || 1;
    pin.scale.set(s, s, 1);
    node.add(pin);

    var glow = new THREE.Sprite(haloMat);
    var gs = opt.pinSize * opt.haloScale;
    glow.scale.set(gs, gs, 1);
    node.add(glow);

    if (opt.showLabels && market.label) {
      /* El punto de anclaje queda en el pin y la fila cuelga arriba a la
         derecha, atada por una linea fina. El contenedor mide cero para que el
         renderer lo centre en el pin sin arrastrar el texto. */
      var wrap = document.createElement('div');
      wrap.className = 'gnp-globe__label';
      var row = document.createElement('span');
      row.className = 'gnp-globe__row';
      var leader = document.createElement('span');
      leader.className = 'gnp-globe__leader';
      var text = document.createElement('span');
      text.className = 'gnp-globe__name';
      text.textContent = market.city || '';
      row.appendChild(leader);
      row.appendChild(text);
      wrap.appendChild(row);
      var label = new CSS2DObject(wrap);
      node.add(label);
      node.userData.labelObject = label;
      node.userData.labelVisible = null;
    }

    /* Anillo que pulsa cuando le llega un arco. */
    var ring = new THREE.Mesh(
      new THREE.RingGeometry(0.95, 1, 32),
      new THREE.MeshBasicMaterial({
        color: opt.pinColor,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false
      })
    );
    node.add(ring);
    node.userData.ringMesh = ring;

    group.add(node);
    pins.push(node);
  });

  /* --- Arcos de ruta --- */

  var arcMeshes = [];
  var time = 3.8;
  var timeUniform = { value: time };
  var arcMaterial = null;
  var labelsHidden = false;

  if (opt.showArcs) {
    var byCity = {};
    (opt.markets || MARKETS).forEach(function (m) {
      byCity[m.city] = m;
    });

    var routes = (opt.routes || ROUTES)
      .map(function (pair) {
        var from = byCity[pair[0]];
        var to = byCity[pair[1]];
        if (!from || !to) return null;
        return { from: from, to: to };
      })
      .filter(Boolean);

    arcMaterial = new THREE.MeshBasicMaterial({
      color: opt.arcColor,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    /* El avance del arco es puro shader: cada vértice sabe su progreso por
       uv.x y su desfase por aOffset, y se descarta lo que queda fuera de la
       ventana que barre uTime. Cero trabajo de CPU por frame. */
    arcMaterial.onBeforeCompile = function (shader) {
      shader.uniforms.uTime = timeUniform;
      shader.vertexShader = shader.vertexShader
        .replace(
          '#include <common>',
          '#include <common>\nattribute float aOffset;\nvarying float vProgress;\nvarying float vOffset;'
        )
        .replace(
          '#include <begin_vertex>',
          '#include <begin_vertex>\nvProgress = uv.x;\nvOffset = aOffset;'
        );
      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          '#include <common>\nvarying float vProgress;\nvarying float vOffset;\nuniform float uTime;'
        )
        .replace(
          '#include <color_fragment>',
          '#include <color_fragment>\n' +
            'float pr = mod(uTime * 2.0 + vOffset, 2.5);\n' +
            'float st = clamp(pr - 1.0, 0.0, 1.0);\n' +
            'float en = clamp(pr, 0.0, 1.0);\n' +
            'if (vProgress < st || vProgress > en) discard;\n' +
            'diffuseColor.a *= smoothstep(st, en + 0.001, vProgress);'
        );
    };

    /* Los desfases se reparten con la proporción áurea para que no arranquen
       todos juntos ni caigan en un patrón visible. */
    var arcInfo = routes.map(function (route, i) {
      var a = latLngToVec3(route.from.lat, route.from.lng, 1);
      var b = latLngToVec3(route.to.lat, route.to.lng, 1);
      return {
        route: route,
        offset: (i * 0.6180339887) % 1,
        delay: Math.min(0.08, (a.distanceTo(b) / 1.5) * 0.08)
      };
    });

    pins.forEach(function (node) {
      var market = node.userData.market;
      node.userData.arrivingArcs = arcInfo.filter(function (info) {
        return info.route.to.city === market.city;
      });
    });

    arcInfo.forEach(function (info, i) {
      var start = latLngToVec3(info.route.from.lat, info.route.from.lng, 1.002);
      var end = latLngToVec3(info.route.to.lat, info.route.to.lng, 1.002);
      var dist = start.distanceTo(end);
      var alt = opt.arcAltBase + Math.min(0.5, dist * opt.arcAltMultiplier);

      var points = [];
      for (var s = 0; s <= 32; s++) {
        var t = s / 32;
        var p = new THREE.Vector3().copy(start).lerp(end, t).normalize();
        p.multiplyScalar(1.002 + alt * 4 * t * (1 - t));
        points.push(p);
      }

      var tube = new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(points),
        32,
        opt.arcThickness,
        4,
        false
      );
      var count = tube.attributes.position.count;
      var offsets = new Float32Array(count);
      var value = ((i * 0.6180339887) % 1) * 2.5;
      for (var k = 0; k < count; k++) offsets[k] = value;
      tube.setAttribute('aOffset', new THREE.BufferAttribute(offsets, 1));

      var mesh = new THREE.Mesh(tube, arcMaterial);
      group.add(mesh);
      arcMeshes.push(mesh);
    });
  }

  /* --- Ciclo --- */

  var nodeWorld = new THREE.Vector3();
  var groupWorld = new THREE.Vector3();
  var toNode = new THREE.Vector3();
  var toCamera = new THREE.Vector3();

  function resize(w, h) {
    if (disposed) return;
    var rw = Math.max(1, Math.round(w || canvas.clientWidth || canvas.offsetWidth || 1));
    var rh = Math.max(1, Math.round(h || canvas.clientHeight || rw));
    /* El techo de densidad depende del ancho, así que se recalcula acá: si no,
       una ventana que arranca angosta y se agranda se queda en 1.5. */
    var dpr = Math.min(window.devicePixelRatio || 1, rw < 768 ? 1.5 : 2);
    if (renderer.getPixelRatio() !== dpr) renderer.setPixelRatio(dpr);
    renderer.setSize(rw, rh, false);
    camera.aspect = rw / rh;
    camera.updateProjectionMatrix();
    labelRenderer.setSize(rw, rh);
  }

  return {
    resize: resize,

    isInteracting: function () {
      return dragging;
    },

    setLabelsVisible: function (visible) {
      labelsHidden = !visible;
      pins.forEach(function (node) {
        var label = node.userData.labelObject;
        if (!label) return;
        if (visible) {
          node.userData.labelVisible = null;
        } else {
          node.userData.labelVisible = false;
          label.element.style.opacity = '0';
        }
      });
    },

    update: function (params) {
      if (disposed) return;
      var phi = params && params.phi;
      var deltaTime = params && params.deltaTime;
      var step = Number.isFinite(deltaTime) ? deltaTime / 16.666 : 0;

      time += 0.0015 * step;
      timeUniform.value = time;
      if (phi !== undefined) group.rotation.y = phi;

      group.getWorldPosition(groupWorld);

      pins.forEach(function (node) {
        var ring = node.userData.ringMesh;
        if (ring && node.userData.arrivingArcs) {
          var scale = 0;
          var progress = 0;
          node.userData.arrivingArcs.forEach(function (info) {
            var pr = (time * 2 + info.offset * 2.5) % 2.5;
            if (pr < 0) pr += 2.5;
            var hit = 1 + info.delay - 0.05;
            if (pr >= hit && pr <= hit + 0.5) {
              var e = 1 - Math.pow(1 - (pr - hit) / 0.5, 3);
              var v = e * 0.02;
              if (v > scale) {
                scale = v;
                progress = e;
              }
            }
          });
          if (scale > 0) {
            var s = 0.02 + scale;
            ring.scale.set(s, s, 1);
            ring.material.opacity = 1 - progress;
          } else {
            ring.material.opacity = 0;
          }
        }

        /* La etiqueta se apaga cuando el pin pasa a la cara de atrás. */
        if (!labelsHidden && node.userData.labelObject) {
          node.getWorldPosition(nodeWorld);
          toNode.subVectors(nodeWorld, groupWorld).normalize();
          toCamera.subVectors(camera.position, nodeWorld).normalize();
          var visible = toNode.dot(toCamera) > 0.05;
          if (node.userData.labelVisible !== visible) {
            node.userData.labelVisible = visible;
            node.userData.labelObject.element.style.opacity = visible ? '1' : '0';
            node.userData.labelObject.element.style.filter = visible ? 'blur(0px)' : 'blur(4px)';
          }
        }
      });

      capasConCamara.forEach(function (mat) {
        if (mat.userData.shader) mat.userData.shader.uniforms.uCamPos.value.copy(camera.position);
      });

      controls.update();
      renderer.render(scene, camera);
      labelRenderer.render(scene, camera);
    },

    destroy: function () {
      disposed = true;
      controls.removeEventListener('start', onStart);
      controls.removeEventListener('end', onEnd);
      controls.dispose();
      canvas.style.cursor = prevCursor;
      labelRenderer.domElement.remove();

      var seen = new Set();
      scene.traverse(function (obj) {
        if (obj.geometry) obj.geometry.dispose();
        var mats = obj.material ? (Array.isArray(obj.material) ? obj.material : [obj.material]) : [];
        mats.forEach(function (mat) {
          if (seen.has(mat)) return;
          seen.add(mat);
          Object.keys(mat).forEach(function (key) {
            var value = mat[key];
            if (value && value.isTexture) value.dispose();
          });
          mat.dispose();
        });
      });

      var gl = renderer.getContext();
      if (gl) {
        var lose = gl.getExtension('WEBGL_lose_context');
        if (lose) lose.loseContext();
      }
      renderer.dispose();
    }
  };
}

/* ---------------------------------------------------------------- Arranque */

function boot() {
  var host = document.querySelector('[data-gnp-globe]');
  if (!host) return;

  var canvas = host.querySelector('canvas');
  if (!canvas || !window.WebGLRenderingContext) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var globe = null;
  /* Arranca con Montevideo de frente, meridiano 56.16 oeste. Con rotación 0 el
     que queda al frente es el 90 oeste, así que el giro es -90 menos la
     longitud, en radianes y en el rango de una vuelta. */
  var phi = 5.6926;
  var visible = true;
  var last = 0;
  var frame = 0;

  function build() {
    var w = window.innerWidth;
    var mobile = w <= 767;
    var tablet = w <= 991 && w > 767;

    try {
      globe = createGlobe(canvas, {
          cameraZ: mobile ? 2.95 : tablet ? 3.0 : 2.45,
        coastStep: mobile ? 0.8 : 0.5,
        enableControls: !mobile && !reduced,
        showLabels: !mobile
      });
      globe.update({ phi: phi });
    } catch (err) {
      globe = null;
      console.error('Globo GOnama:', err);
    }
  }

  function tick(now) {
    /* Si el editor de Shopify recarga la sección, el nodo viejo se va del
       DOM y este ciclo tiene que morir con él. */
    if (!host.isConnected) {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(rebuildRaf);
      io.disconnect();
      ro.disconnect();
      cortes.forEach(function (mq) {
        if (mq.removeEventListener) mq.removeEventListener('change', onBreakpoint);
        else if (mq.removeListener) mq.removeListener(onBreakpoint);
      });
      if (globe) globe.destroy();
      globe = null;
      return;
    }

    frame = requestAnimationFrame(tick);
    if (!globe || !visible) {
      last = now;
      return;
    }
    var delta = last ? Math.min(now - last, 64) : 16.666;
    last = now;
    if (!reduced && !globe.isInteracting()) phi += 0.0015 * (delta / 16.666);
    globe.update({ phi: phi, deltaTime: reduced ? 0 : delta });
  }

  var io = new IntersectionObserver(
    function (entries) {
      visible = entries[0].isIntersecting;
    },
    { rootMargin: '100px' }
  );
  io.observe(host);

  var resizeRaf = 0;
  var ro = new ResizeObserver(function (entries) {
    var rect = entries[entries.length - 1].contentRect;
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(function () {
      if (globe) globe.resize(rect.width, rect.height);
    });
  });
  ro.observe(canvas);

  /* Los dos cortes que cambian como se arma el globo: 767 decide densidad de
     puntos, controles y etiquetas, y 991 decide la distancia de camara. Hay
     que escuchar los dos. Con uno solo, al pasar de tablet a escritorio la
     camara se quedaba en la distancia vieja y la esfera dejaba de coincidir
     con la bola del CSS, que si cambia en 991.

     Reconstruir es la unica salida porque esos valores se fijan al crear la
     escena. Al destruirla se pierde el contexto WebGL del canvas y ese canvas
     ya no sirve para uno nuevo, asi que se lo reemplaza por un clon limpio.
     El angulo de giro se conserva, no vuelve al inicio. */
  var cortes = [window.matchMedia('(max-width: 767px)'), window.matchMedia('(max-width: 991px)')];
  var rebuildRaf = 0;
  var onBreakpoint = function () {
    /* Si el arrastre de la ventana cruza los dos cortes casi al mismo tiempo,
       esto lo deja en una sola reconstruccion. */
    cancelAnimationFrame(rebuildRaf);
    rebuildRaf = requestAnimationFrame(function () {
      if (globe) globe.destroy();
      globe = null;

      var fresh = canvas.cloneNode(false);
      fresh.removeAttribute('width');
      fresh.removeAttribute('height');
      fresh.className = 'gnp-hero__canvas';
      canvas.parentNode.replaceChild(fresh, canvas);
      ro.unobserve(canvas);
      canvas = fresh;
      ro.observe(canvas);

      build();
    });
  };
  cortes.forEach(function (mq) {
    if (mq.addEventListener) mq.addEventListener('change', onBreakpoint);
    else if (mq.addListener) mq.addListener(onBreakpoint);
  });

  build();
  frame = requestAnimationFrame(tick);

  /* Al salir de la página se libera la memoria de la GPU, salvo que la página
     quede guardada para el botón de atrás: ahí el canvas se sigue usando. */
  window.addEventListener('pagehide', function (e) {
    if (e.persisted) return;
    cancelAnimationFrame(frame);
    if (globe) globe.destroy();
    globe = null;
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}

/* El editor de Shopify reinyecta el HTML de la sección, pero el navegador no
   vuelve a ejecutar un módulo ya cargado: hay que arrancarlo a mano. */
document.addEventListener('shopify:section:load', function (e) {
  if (e.target && e.target.querySelector('[data-gnp-globe]')) boot();
});
