# GOnama · contexto del proyecto

Documento para retomar el trabajo en otra conversación. Estado al 6 de agosto de 2026.

---

## Qué es esto

El tema de Shopify de **gonama.com**, conectado a GitHub. Se edita el código en el repo
y Shopify actualiza el tema solo.

- **Repo:** `github.com/Jinkanna/gonama-landing`
- **Local:** `/Users/belu/Desktop/GoNama/gonama-landing`
- **Tienda:** `gonamauy.myshopify.com`
- **Tema base:** Umino 2.7.0 (comprado, no es de Shopify)

### Cómo funciona la conexión

Cada rama de GitHub puede conectarse como un tema distinto en Shopify:
**Online Store → Themes → Add theme → Connect from GitHub**. Cada tema conectado es
un Draft independiente; solo uno puede estar publicado.

Al pushear, Shopify actualiza ese tema en un par de minutos. No hace falta hacer nada más.

---

## Ramas

| Rama | Qué tiene |
|---|---|
| `develop` | El tema tal como estaba en producción, sin tocar |
| `feature/landing-2026` | Primera landing, 9 secciones con prefijo `gn-`. Abandonada |
| `feature/new-line` | **La rama activa.** Landing basada en unitedcarriers.com |
| `feature/new-pos` | Duplicado de new-line por un cambio de nombre. Se puede borrar |

Trabajar sobre **`feature/new-line`**.

```bash
cd /Users/belu/Desktop/GoNama/gonama-landing && git checkout feature/new-line && git pull
```

---

## La landing actual

Nueve secciones, prefijo `gn-pos`, clases CSS `gnp`:

```
intro → hero → statement → services → reliability → edge → partners → faq → close
```

| Sección | Archivo | Contenido |
|---|---|---|
| Entrada | `gn-pos-intro` | Pantalla de carga de 1,96s |
| Hero | `gn-pos-hero` | Building the infrastructure behind the autonomous economy |
| The shift | `gn-pos-statement` | Commerce is changing |
| Capacidades | `gn-pos-services` | One infrastructure, 6 pilares |
| Global Checkout | `gn-pos-reliability` | 4 capacidades |
| Imagine Code | `gn-pos-edge` | 5 pasos numerados |
| Industrias | `gn-pos-partners` | 6 industrias con sub-verticales |
| Corporate | `gn-pos-faq` | 4 políticas en acordeón |
| Cierre | `gn-pos-close` | The future is autonomous + formulario |

Más `gn-pos-header` y `gn-pos-footer`, que **no van en el template JSON**: se insertan
desde `layout/theme.liquid` con `{% section %}`, condicionados a la home.

Archivos compartidos: `assets/gn-pos.css`, `assets/gn-pos.js`,
`snippets/gn-pos-assets.liquid`, `snippets/gn-pos-foot-link.liquid`.

Todo el contenido es editable desde el editor visual de Shopify.

---

## Marca

| Color | Hex | Uso |
|---|---|---|
| GO blue | `#44B7E8` | Acento en fondo oscuro |
| Ocean | `#178DBE` | Acento en fondo claro |
| Sky | `#D9F4FC` | Bloques suaves |
| Panda 1 | `#0F172A` | Fondo oscuro / texto en claro |
| Panda 2 | `#F7F9FC` | Fondo claro / texto en oscuro |
| Mint | `#2DD4BF` | Solo hovers |

**Tipografía:** Inter. Tamaños fijos por corte, nunca `clamp()` fluido. Tracking
`-0.031em` en todos los títulos, proporcional al tamaño.

**Alternancia de tonos:** cada sección declara `gnp--a` (tono base) o `gnp--b`
(invertido), y el par se da vuelta según el modo claro u oscuro del navegador. Así la
alternancia se mantiene en los dos modos.

---

## Trampas del tema Umino

Cinco cosas que rompieron el trabajo y ya están resueltas. Si algo se comporta raro,
empezar por acá.

**1. `html { font-size: 62.5% }` en `assets/reset.css`.** `1rem` son 10px, no 16.
Por eso el CSS de la landing está todo en px. No usar rem.

**2. `h1..h6 { font-family; color }` y `a { color }` con selectores de elemento.**
Le ganan a la herencia. Hay un bloque de reset en `gn-pos.css` que los neutraliza.

**3. `b, strong { color: var(--heading-color) }`.** Deja las negritas ilegibles sobre
fondo oscuro. También está neutralizado.

**4. `.bls-wrapper { overflow-x: hidden }`.** Por especificación, con un eje en `hidden`
y el otro en `visible`, el visible computa a `auto`: ese div pasa a ser contenedor con
scroll y los enlaces internos no mueven el documento. **`gn-pos.js` intercepta los
clicks de anclas y desplaza la ventana a mano.** No sacar eso.

**5. `position: sticky` no funciona**, por lo mismo del punto 4. El header usa `fixed`.

---

## Cosas que aprendí y conviene no repetir

**Las secciones no pueden llevar la misma clase que sus tarjetas internas.** Pasó con
`.gnp-serv`, `.gnp-rel`, `.gnp-edge` y `.gnp-part`: la sección heredaba estilos de
celda y quedaba destruida. Las secciones llevan sufijo `-sec`.

**Los campos `richtext` de Shopify devuelven `<p>...</p>`.** No meterlos dentro de otro
`<p>` o el navegador cierra el de afuera y el contenido pierde los estilos. Usar `<div>`.

**Desde `templates/index.json` el header y el footer no renderizaban.** Nunca supe por
qué. Se resolvió insertándolos con `{% section %}` desde `layout/theme.liquid`, que es
el mismo mecanismo que el tema usa para su barra de anuncios.

**Hay un generador de preview** en el scratchpad (`build_pos.py`) que arma un HTML
estático leyendo `templates/index.json`. Es útil pero **se desincroniza del Liquid**:
más de una vez di algo por bueno mirando un markup que no era el real. Si se usa, hay
que mantenerlo al día.

---

## Decisiones tomadas

- **Sin guiones largos (—)** en ningún texto ni en las respuestas.
- **Sin testimonios ni sección de insights.**
- **Sin globo 3D.** Se construyó dos veces, en canvas y en React Three Fiber con
  pipeline de build, y las dos se descartaron. El bundle de R3F pesaba 275KB
  comprimidos contra 44KB de toda la landing.
- **Sin React, Tailwind ni Framer Motion.** No hay pipeline de build en el tema.
- El copy sale del HTML del jefe, extraído en [CONTENT.md](CONTENT.md).

---

## Pendientes

**Datos sin confirmar, que hoy son afirmaciones inventadas en una página que van a ver
inversores:**

- **`8+` años** operando e-commerce uruguayo. Número puesto por mí.
- **Las 6 industrias** de la sección Ecosystem salen del HTML original, pero nunca se
  confirmó si son las reales.
- Antes hubo que corregir menciones a **Argentina** y a "Latin America": la operación
  es Uruguay. Revisar que no vuelvan a aparecer.

**Del contenido:**

- El HTML del jefe dice **"Emagine Code"** en el hero e **"Imagine Code"** en su propia
  sección. Sin resolver cuál es el correcto.
- Quedó afuera del mapeo, disponible en `CONTENT.md`: las barras de velocidad, la
  comparación Traditional vs Autonomous, los 6 principios de liderazgo y el bloque de
  cultura.

**Técnicos:**

- **Logo para fondo oscuro.** El SVG de marca tiene "nama" en gris oscuro y no se lee
  sobre Panda 1. Hoy se usa el wordmark en texto. Hay una ranura en el editor para
  subir la versión clara.
- **Logos de partners.** Hoy son texto. Los campos ya aceptan imagen.
- **Widget "Chat with us".** Es una app embebida, no código del tema. Para sacarlo de la
  home hay que ir a la configuración de esa app.
- **Shopify CLI no funciona.** `shopify theme dev` rebota con "you don't have access to
  this dev store": el CLI está autenticado como `belen@gonama.com` en la organización
  de Partners **Jinkanna**, pero `gonamauy` no figura ahí. Se resuelve con un **Theme
  Access token**, que el owner genera instalando la app Theme Access.
- **Lighthouse sin medir.**

---

## Cómo verificar antes de pushear

Hay un patrón que funcionó y conviene mantener: **validar el Liquid y el CSS con un
script antes de cada push**, en vez de confiar en el render.

Lo que se chequea: JSON de cada schema, etiquetas Liquid balanceadas, HTML balanceado,
que cada setting del template exista en su schema, que las anclas apunten a IDs que
existen, llaves de CSS parejas, clases usadas sin estilo, y que ninguna sección
comparta clase con sus tarjetas.

Para ver el resultado real hay que mirarlo en el preview de Shopify. El panel de
preview local escala la página y aplana los detalles.
