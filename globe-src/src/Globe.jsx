import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const R = 1;

/** Distribución de Fibonacci: puntos parejos sobre la esfera, sin acumularse en los polos. */
function fibonacciSphere(count, radius) {
  const pos = new Float32Array(count * 3);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const th = golden * i;
    pos[i * 3] = Math.cos(th) * r * radius;
    pos[i * 3 + 1] = y * radius;
    pos[i * 3 + 2] = Math.sin(th) * r * radius;
  }
  return pos;
}

/* --------------------------------------------------------------------------
   Cuerpo: vidrio oscuro con fresnel. Casi negro de frente y azul apenas
   encendido en el limbo. Opaco a propósito, para que oculte lo que pasa por
   detrás y la esfera se lea como volumen.
   -------------------------------------------------------------------------- */

const bodyVert = /* glsl */ `
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vN = normalize(mat3(modelMatrix) * normal);
    vV = normalize(cameraPosition - wp.xyz);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const bodyFrag = /* glsl */ `
  uniform vec3 uDeep;
  uniform vec3 uRim;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    float f = 1.0 - clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0);
    float rim = pow(f, 3.2);
    vec3 c = mix(uDeep, uRim, rim * 0.55);
    // Un realce corto justo en el borde, que es lo que da el vidrio.
    c += uRim * pow(f, 11.0) * 0.42;
    gl_FragColor = vec4(c, 1.0);
  }
`;

function Body({ deep, rim }) {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: bodyVert,
        fragmentShader: bodyFrag,
        uniforms: {
          uDeep: { value: new THREE.Color(deep) },
          uRim: { value: new THREE.Color(rim) }
        }
      }),
    [deep, rim]
  );

  return (
    <mesh material={mat}>
      <sphereGeometry args={[R * 0.995, 64, 48]} />
    </mesh>
  );
}

/* --------------------------------------------------------------------------
   Wireframe: apenas insinuado.
   -------------------------------------------------------------------------- */

function Wire({ color }) {
  const geo = useMemo(() => new THREE.IcosahedronGeometry(R * 1.001, 4), []);
  return (
    <lineSegments>
      <wireframeGeometry args={[geo]} />
      <lineBasicMaterial
        color={color}
        transparent
        opacity={0.03}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </lineSegments>
  );
}

/* --------------------------------------------------------------------------
   Partículas sobre la superficie. El alfa sale del ángulo con la cámara, así
   las del hemisferio de atrás se apagan solas.
   -------------------------------------------------------------------------- */

const dustVert = /* glsl */ `
  uniform float uSize;
  uniform float uTime;
  attribute float aSeed;
  varying float vFade;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vec3 n = normalize(mat3(modelMatrix) * normalize(position));
    vec3 v = normalize(cameraPosition - wp.xyz);
    vFade = smoothstep(-0.05, 0.45, dot(n, v));
    // Respiración muy corta, distinta para cada punto.
    float pulse = 0.86 + 0.14 * sin(uTime * 0.7 + aSeed * 6.283);
    vec4 mv = viewMatrix * wp;
    gl_PointSize = uSize * pulse * (1.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

const dustFrag = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vFade;
  void main() {
    vec2 d = gl_PointCoord - 0.5;
    float m = 1.0 - smoothstep(0.32, 0.5, length(d));
    if (m <= 0.001 || vFade <= 0.001) discard;
    gl_FragColor = vec4(uColor, m * vFade * uOpacity);
  }
`;

function Dust({ count, color, size, opacity }) {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(fibonacciSphere(count, R * 1.004), 3));
    const seed = new Float32Array(count);
    for (let i = 0; i < count; i++) seed[i] = Math.random();
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    return g;
  }, [count]);

  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: dustVert,
        fragmentShader: dustFrag,
        uniforms: {
          uColor: { value: new THREE.Color(color) },
          uSize: { value: size },
          uOpacity: { value: opacity },
          uTime: { value: 0 }
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      }),
    [color, size, opacity]
  );

  useFrame((state) => {
    mat.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return <points geometry={geo} material={mat} />;
}

/* --------------------------------------------------------------------------
   Nodos y conexiones.

   Las conexiones no son fijas: hay un grupo de arcos que nacen, viven unos
   segundos y mueren, y al morir eligen otro par de nodos. Todos comparten una
   sola geometría, así que el conjunto es una única llamada de dibujo por más
   arcos que haya.
   -------------------------------------------------------------------------- */

const NODES = 26;
const ARCS = 16;
const SEG = 40;

function Network({ nodeColor, arcColor }) {
  const nodes = useMemo(() => {
    const raw = fibonacciSphere(NODES, R * 1.012);
    const list = [];
    for (let i = 0; i < NODES; i++) {
      list.push(new THREE.Vector3(raw[i * 3], raw[i * 3 + 1], raw[i * 3 + 2]));
    }
    return list;
  }, []);

  const nodeGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const p = new Float32Array(NODES * 3);
    const s = new Float32Array(NODES);
    nodes.forEach((v, i) => {
      p[i * 3] = v.x;
      p[i * 3 + 1] = v.y;
      p[i * 3 + 2] = v.z;
      s[i] = Math.random();
    });
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(s, 1));
    return g;
  }, [nodes]);

  const nodeMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: dustVert,
        fragmentShader: dustFrag,
        uniforms: {
          uColor: { value: new THREE.Color(nodeColor) },
          uSize: { value: 150 },
          uOpacity: { value: 1 },
          uTime: { value: 0 }
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      }),
    [nodeColor]
  );

  // Una geometría para todos los arcos. Cada arco ocupa SEG segmentos.
  const arcGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ARCS * SEG * 2 * 3), 3));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(ARCS * SEG * 2 * 3), 3));
    return g;
  }, []);

  const arcMat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      }),
    []
  );

  const state = useRef(
    Array.from({ length: ARCS }, () => ({ born: -1, life: 0, a: 0, b: 0 }))
  );
  const base = useMemo(() => new THREE.Color(arcColor), [arcColor]);

  /** Elige un par de nodos y escribe el arco en la geometría compartida. */
  function spawn(i, now) {
    const s = state.current[i];
    s.a = Math.floor(Math.random() * NODES);
    do {
      s.b = Math.floor(Math.random() * NODES);
    } while (s.b === s.a);
    s.born = now;
    s.life = 3.4 + Math.random() * 3.2;

    const from = nodes[s.a];
    const to = nodes[s.b];
    const mid = from.clone().add(to).multiplyScalar(0.5);
    // El arco se levanta según lo lejos que estén los extremos.
    const lift = 1 + from.distanceTo(to) * 0.19;
    mid.setLength(R * lift);

    const curve = new THREE.QuadraticBezierCurve3(from, mid, to);
    const pts = curve.getPoints(SEG);
    const pos = arcGeo.attributes.position.array;
    let o = i * SEG * 2 * 3;
    for (let k = 0; k < SEG; k++) {
      const p0 = pts[k];
      const p1 = pts[k + 1];
      pos[o++] = p0.x; pos[o++] = p0.y; pos[o++] = p0.z;
      pos[o++] = p1.x; pos[o++] = p1.y; pos[o++] = p1.z;
    }
    arcGeo.attributes.position.needsUpdate = true;
  }

  useFrame((frame) => {
    const now = frame.clock.elapsedTime;
    nodeMat.uniforms.uTime.value = now;

    const col = arcGeo.attributes.color.array;
    let dirty = false;

    for (let i = 0; i < ARCS; i++) {
      const s = state.current[i];
      if (s.born < 0) {
        // Nacimiento escalonado, para que no aparezcan todos juntos.
        s.born = now - Math.random() * 4;
        spawn(i, s.born);
      }
      const age = now - s.born;
      if (age > s.life) {
        spawn(i, now);
        continue;
      }

      const t = age / s.life;
      // Entra, se sostiene y se va. Sin rebotes.
      const env = Math.min(1, t / 0.22) * Math.min(1, (1 - t) / 0.3);
      // Un pulso corto recorre el arco mientras vive.
      const head = t * 1.35 - 0.18;

      let o = i * SEG * 2 * 3;
      for (let k = 0; k < SEG; k++) {
        const u = k / SEG;
        const trail = Math.exp(-Math.pow((u - head) * 5.5, 2));
        const a = env * (0.16 + trail * 0.95);
        for (let e = 0; e < 2; e++) {
          col[o++] = base.r * a;
          col[o++] = base.g * a;
          col[o++] = base.b * a;
        }
      }
      dirty = true;
    }

    if (dirty) arcGeo.attributes.color.needsUpdate = true;
  });

  return (
    <group>
      <points geometry={nodeGeo} material={nodeMat} />
      <lineSegments geometry={arcGeo} material={arcMat} />
    </group>
  );
}

/* -------------------------------------------------------------------------- */

export default function Globe({ palette, reduced }) {
  const group = useRef();

  useFrame((_, delta) => {
    if (!group.current || reduced) return;
    // Casi imperceptible: una vuelta cada tres minutos y medio.
    group.current.rotation.y += delta * 0.03;
  });

  return (
    <group ref={group} rotation={[0.36, 2.1, 0.14]}>
      <Body deep={palette.deep} rim={palette.rim} />
      <Wire color={palette.wire} />
      <Dust count={4200} color={palette.dust} size={82} opacity={0.3} />
      <Network nodeColor={palette.node} arcColor={palette.arc} />
    </group>
  );
}
