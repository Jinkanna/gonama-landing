/* ==========================================================================
   GOnama · landing new-pos · Globo del hero
   Globo de puntos en three.js: la tierra se dibuja como una grilla de puntos,
   los mercados como pines con halo y las rutas como arcos que se animan por
   shader. Nada de esto toca la CPU por frame salvo la rotación.

   El módulo se carga con un import map declarado en gn-pos-hero.liquid, así
   three.js y sus addons viven en assets del tema y no dependen de un CDN.
   ========================================================================== */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

/* ------------------------------------------------------------------ Datos */

/* Mercados de GOnama. lat y lng reales de cada ciudad. Solo los hubs llevan
   etiqueta: con las trece juntas el Caribe queda ilegible. */
var MARKETS = [
  { city: 'Buenos Aires', country: 'Argentina', lat: -34.6037, lng: -58.3816, size: 1.25, label: true },
  { city: 'Montevideo', country: 'Uruguay', lat: -34.9011, lng: -56.1645, size: 1 },
  { city: 'Santiago', country: 'Chile', lat: -33.4489, lng: -70.6693, size: 1.1, label: true },
  { city: 'São Paulo', country: 'Brasil', lat: -23.5505, lng: -46.6333, size: 1.25, label: true },
  { city: 'Asunción', country: 'Paraguay', lat: -25.2637, lng: -57.5759, size: 1 },
  { city: 'Lima', country: 'Perú', lat: -12.0464, lng: -77.0428, size: 1.1, label: true },
  { city: 'Bogotá', country: 'Colombia', lat: 4.711, lng: -74.0721, size: 1.1, label: true },
  { city: 'Quito', country: 'Ecuador', lat: -0.1807, lng: -78.4678, size: 1 },
  { city: 'Ciudad de Panamá', country: 'Panamá', lat: 8.9824, lng: -79.5199, size: 1 },
  { city: 'San José', country: 'Costa Rica', lat: 9.9281, lng: -84.0907, size: 1 },
  { city: 'Ciudad de México', country: 'México', lat: 19.4326, lng: -99.1332, size: 1.25, label: true },
  { city: 'Miami', country: 'Estados Unidos', lat: 25.7617, lng: -80.1918, size: 1.1, label: true },
  { city: 'Madrid', country: 'España', lat: 40.4168, lng: -3.7038, size: 1.1, label: true }
];

/* Rutas entre mercados. Cada par es un arco que sale y vuelve a entrar. */
var ROUTES = [
  ['Buenos Aires', 'Santiago'],
  ['Buenos Aires', 'Montevideo'],
  ['Buenos Aires', 'São Paulo'],
  ['Buenos Aires', 'Madrid'],
  ['Buenos Aires', 'Asunción'],
  ['Santiago', 'Lima'],
  ['Santiago', 'Ciudad de México'],
  ['São Paulo', 'Bogotá'],
  ['São Paulo', 'Miami'],
  ['Lima', 'Quito'],
  ['Lima', 'Ciudad de México'],
  ['Bogotá', 'Ciudad de Panamá'],
  ['Bogotá', 'Miami'],
  ['Ciudad de Panamá', 'San José'],
  ['Ciudad de México', 'Miami'],
  ['Miami', 'Madrid'],
  ['San José', 'Ciudad de México']
];

var DEFAULTS = {
  pointSize: 0.005,
  tileDeg: 1.2,
  edgeColor: '#ffffff',
  fillColor: '#d9f4fc',
  backOpacity: 0.15,
  pinColor: '#44b7e8',
  arcColor: '#44b7e8',
  killBack: true,
  pinSize: 0.006,
  pinAltitude: 0.008,
  haloScale: 7.5,
  showArcs: true,
  arcThickness: 0.002,
  arcAltBase: 0.02,
  arcAltMultiplier: 0.01,
  cameraZ: 2.9,
  globeRotationX: 0.15,
  globeRotationZ: 0.05,
  enableControls: true,
  showLabels: true,
  landUrl: ''
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

/* Los workers reciben dos formas del mismo dato: los contornos como pares
   lon/lat planos, y los polígonos como anillos de pares para el punto en
   polígono del relleno. */
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

function loadLand(url) {
  if (!landPromise) {
    landPromise = fetch(url, { cache: 'force-cache' })
      .then(function (res) {
        if (!res.ok) throw new Error('No se pudo cargar la geometría de tierra');
        return res.json();
      })
      .then(prepareLand)
      .catch(function (err) {
        landPromise = null;
        throw err;
      });
  }
  return landPromise;
}

/* ---------------------------------------------------------------- Workers */

/* Contornos: recorre cada anillo y suelta un punto cada tantos grados. */
var EDGE_WORKER = `
function wrapLon(lon){ return ((lon + 540) % 360) - 180; }
function sampleEdge(ring, maxDegStep){
  var out = [];
  var currentDist = 0;
  if (ring.length >= 2) out.push(wrapLon(ring[0]), ring[1]);
  for (var i = 0; i < ring.length - 2; i += 2){
    var lon1 = ring[i], lat1 = ring[i+1];
    var lon2 = ring[i+2], lat2 = ring[i+3];
    var dLon = lon2 - lon1;
    if (Math.abs(dLon) > 180){ dLon += dLon > 0 ? -360 : 360; }
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
  }
  return out;
}
function vec3(lon, lat){
  var phi = (90 - lat) * Math.PI / 180;
  var th = (lon + 180) * Math.PI / 180;
  return [-Math.sin(phi) * Math.cos(th), Math.cos(phi), Math.sin(phi) * Math.sin(th)];
}
onmessage = function(e){
  var densityDeg = e.data.densityDeg;
  var polysIn = e.data.polysIn;
  var out = [];
  for (var p = 0; p < polysIn.length; p++){
    var poly = polysIn[p];
    for (var r = 0; r < poly.length; r++){
      var sampled = sampleEdge(poly[r], densityDeg * 0.7);
      for (var i = 0; i < sampled.length; i += 2){
        var v = vec3(sampled[i], sampled[i+1]);
        out.push(v[0], v[1], v[2]);
      }
    }
  }
  var arr = new Float32Array(out);
  postMessage({ ok: true, edge: arr }, [arr.buffer]);
};`;

/* Relleno: grilla por filas de latitud, con el paso de longitud corregido
   por cos(lat) y las filas impares corridas media celda, para que el patrón
   quede parejo y no se apelotone cerca de los polos. */
var FILL_WORKER = `
var PI = Math.PI;
function wrap180(lon){ return ((lon + 540) % 360) - 180; }
function vec3(lon, lat){
  var phi = (90 - lat) * PI / 180;
  var th = (lon + 180) * PI / 180;
  return [-Math.sin(phi) * Math.cos(th), Math.cos(phi), Math.sin(phi) * Math.sin(th)];
}
function unwrapRing(ring, refLon){
  var out = new Array(ring.length), prev = null;
  for (var i = 0; i < ring.length; i++){
    var L = ring[i][0], A = ring[i][1];
    var d = L - refLon;
    if (d > 180) L -= 360; else if (d < -180) L += 360;
    if (prev){
      var step = L - prev[0];
      if (step > 180) L -= 360; else if (step < -180) L += 360;
    }
    out[i] = [L, A];
    prev = out[i];
  }
  return out;
}
function pointInRing(pt, ring){
  var x = pt[0], y = pt[1], inside = false, n = ring.length;
  for (var i = 0, j = n - 1; i < n; j = i++){
    var xi = ring[i][0], yi = ring[i][1];
    var xj = ring[j][0], yj = ring[j][1];
    var denom = yj - yi;
    if (denom === 0) continue;
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / denom + xi)) inside = !inside;
  }
  return inside;
}
function contains(poly, refLon, lon, lat){
  var rings = poly.coordinates;
  if (!rings || !rings.length) return false;
  var pt = [lon, lat];
  if (!pointInRing(pt, unwrapRing(rings[0], refLon))) return false;
  for (var k = 1; k < rings.length; k++){
    if (pointInRing(pt, unwrapRing(rings[k], refLon))) return false;
  }
  return true;
}
function bbox(r){
  var minLon = 1e9, maxLon = -1e9, minLat = 90, maxLat = -90;
  for (var i = 0; i < r.length; i++){
    var L = r[i][0], A = r[i][1];
    if (L < minLon) minLon = L;
    if (L > maxLon) maxLon = L;
    if (A < minLat) minLat = A;
    if (A > maxLat) maxLat = A;
  }
  return { minLon: minLon, maxLon: maxLon, minLat: minLat, maxLat: maxLat };
}
onmessage = function(e){
  var geos = e.data.geos;
  var step = Math.max(0.2, Math.min(6.0, e.data.tileDeg || 1.0));
  var out = [];
  for (var p = 0; p < geos.length; p++){
    var r0 = unwrapRing(geos[p].coordinates[0], 0);
    var bb = bbox(r0);
    var refLon = (bb.minLon + bb.maxLon) / 2;
    r0 = unwrapRing(geos[p].coordinates[0], refLon);
    bb = bbox(r0);
    var latStart = Math.floor((bb.minLat - 1) / step) * step;
    var latEnd = Math.ceil((bb.maxLat + 1) / step) * step;
    for (var lat = latStart; lat <= latEnd; lat += step){
      var odd = Math.round(Math.abs(lat / step)) % 2;
      var cosLat = Math.cos(lat * PI / 180);
      var lonStep = step / Math.max(0.15, cosLat);
      var lonStart = Math.floor((bb.minLon - 1) / lonStep) * lonStep + (odd ? lonStep * 0.5 : 0);
      var lonEnd = Math.ceil((bb.maxLon + 1) / lonStep) * lonStep;
      for (var lon = lonStart; lon <= lonEnd; lon += lonStep){
        var llLat = Math.max(-90, Math.min(90, lat));
        if (contains(geos[p], refLon, lon, llLat)){
          var v = vec3(wrap180(lon), llLat);
          out.push(v[0], v[1], v[2]);
        }
      }
    }
  }
  var arr = new Float32Array(out);
  postMessage({ ok: true, fill: arr }, [arr.buffer]);
};`;

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

function dotTexture(size) {
  size = size || 64;
  var canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  var ctx = canvas.getContext('2d');
  var r = size / 2;
  var grad = ctx.createRadialGradient(r, r, r * 0.82, r, r, r);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(r, r, r - 0.5, 0, Math.PI * 2);
  ctx.fill();
  var tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}

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
function dotMaterial(color, size, backOpacity, map, killBack) {
  var mat = new THREE.PointsMaterial({
    color: new THREE.Color(color),
    size: size,
    sizeAttenuation: true,
    depthWrite: false,
    transparent: true,
    map: map,
    alphaTest: 0,
    opacity: 1
  });

  mat.onBeforeCompile = function (shader) {
    shader.uniforms.uCamPos = { value: new THREE.Vector3() };
    shader.uniforms.uBackOpacity = { value: backOpacity };
    shader.defines = shader.defines || {};
    if (killBack) shader.defines.KILL_BACK = 1;

    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        '#include <common>\nvarying vec3 vWorldPos;\nuniform vec3 uCamPos;'
      )
      .replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nvWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;'
      )
      .replace(
        '#include <project_vertex>',
        '#include <project_vertex>\n' +
          'float ndv = dot(normalize(uCamPos - vWorldPos), normalize(vWorldPos));\n' +
          'gl_PointSize *= mix(0.6, 1.0, smoothstep(0.0, 0.25, ndv));'
      );

    /* El chunk final del fragment se llama opaque_fragment desde r152 y
       output_fragment en versiones viejas: se prueban los dos para que el
       recorte de la cara trasera no quede en silencio si cambia three. */
    var facing =
      '{\n' +
      '  vec3 viewDir = normalize(uCamPos - vWorldPos);\n' +
      '  vec3 normalDir = normalize(vWorldPos);\n' +
      '  float nd = dot(viewDir, normalDir);\n' +
      '  #ifdef KILL_BACK\n' +
      '    if (nd <= 0.0) discard;\n' +
      '  #else\n' +
      '    diffuseColor.a *= mix(uBackOpacity, 1.0, smoothstep(0.0, 0.25, nd));\n' +
      '  #endif\n' +
      '}\n';

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      '#include <common>\nvarying vec3 vWorldPos;\nuniform vec3 uCamPos;\nuniform float uBackOpacity;'
    );

    ['opaque_fragment', 'output_fragment'].some(function (chunk) {
      var tag = '#include <' + chunk + '>';
      if (shader.fragmentShader.indexOf(tag) === -1) return false;
      shader.fragmentShader = shader.fragmentShader.replace(tag, facing + tag);
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

  /* Esfera que no pinta color pero sí profundidad: tapa lo que queda detrás. */
  var occluder = new THREE.Mesh(
    new THREE.SphereGeometry(0.99, 32, 32),
    new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: true })
  );
  occluder.renderOrder = -1;
  group.add(occluder);

  /* --- Puntos de tierra, en dos capas: contorno y relleno --- */

  var dotMaterials = [];

  loadLand(opt.landUrl)
    .then(function (land) {
      if (disposed) return null;
      var sprite = dotTexture(64);
      var edgeMat = dotMaterial(opt.edgeColor, opt.pointSize, opt.backOpacity, sprite, opt.killBack);
      var fillMat = dotMaterial(
        opt.fillColor,
        Math.max(opt.pointSize * 0.75, 0.003),
        opt.backOpacity,
        sprite,
        opt.killBack
      );
      dotMaterials.push(edgeMat, fillMat);

      return Promise.all([
        runWorker(EDGE_WORKER, { densityDeg: opt.tileDeg, polysIn: land.polygons }),
        runWorker(FILL_WORKER, { tileDeg: opt.tileDeg, geos: land.geoPolygons })
      ]).then(function (res) {
        if (disposed) return;
        var edgeGeo = new THREE.BufferGeometry();
        edgeGeo.setAttribute('position', new THREE.BufferAttribute(res[0].edge, 3));
        group.add(new THREE.Points(edgeGeo, edgeMat));

        var fillGeo = new THREE.BufferGeometry();
        fillGeo.setAttribute('position', new THREE.BufferAttribute(res[1].fill, 3));
        group.add(new THREE.Points(fillGeo, fillMat));

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
      var wrap = document.createElement('div');
      wrap.className = 'gnp-globe__label';
      var text = document.createElement('span');
      text.className = 'gnp-globe__label-text';
      text.textContent = market.city || market.country || '';
      wrap.appendChild(text);
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

      dotMaterials.forEach(function (mat) {
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
  /* Arranca con el meridiano 60 oeste de frente, o sea Latinoamérica mirando
     a cámara. Con rotación 0 el que queda al frente es el 90 oeste. */
  var phi = 5.76;
  var visible = true;
  var last = 0;
  var frame = 0;

  function build() {
    var w = window.innerWidth;
    var mobile = w <= 767;
    var tablet = w <= 991 && w > 767;

    try {
      globe = createGlobe(canvas, {
        landUrl: host.getAttribute('data-land-url') || '',
        cameraZ: mobile ? 2.7 : tablet ? 2.8 : 2.23,
        tileDeg: mobile ? 1.5 : 1.2,
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
      io.disconnect();
      ro.disconnect();
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

  /* Al cruzar el breakpoint cambian la densidad de puntos y los controles,
     así que el globo se reconstruye en vez de escalarse. Al destruirlo se
     pierde el contexto WebGL del canvas y ese canvas ya no sirve para uno
     nuevo, así que se lo reemplaza por un clon limpio. */
  var mql = window.matchMedia('(max-width: 767px)');
  var onBreakpoint = function () {
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
  };
  if (mql.addEventListener) mql.addEventListener('change', onBreakpoint);
  else if (mql.addListener) mql.addListener(onBreakpoint);

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
