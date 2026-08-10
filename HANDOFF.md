# GOnama · contexto del proyecto

Documento para retomar el trabajo en otra conversación. Estado al 7 de agosto de 2026.

---

## Qué es esto

El tema de Shopify de **gonama.com**.

- **Repo:** `github.com/Jinkanna/gonama-landing`
- **Local:** `/Users/belu/Desktop/GoNama/gonama-landing`
- **Tienda:** `gonamauy.myshopify.com`
- **Tema base:** Umino 2.7.0 (comprado, no es de Shopify)

### Cómo se despliega hoy: a mano, no por GitHub

**Esto cambió el 7 de agosto y es lo primero que hay que saber.** El tema que está en
vivo se sube por CLI y **no está conectado a GitHub**. Un push a la rama no actualiza el
sitio.

| Tema | ID | Estado |
|---|---|---|
| `new-line con globo` | `190538940704` | **En vivo.** Se sube por CLI, sin conexión |
| `gonama-landing/feature/new-line` | `190500045088` | Borrador, conectado a GitHub pero **desactualizado**: quedó en la versión previa a esta sesión |

Para publicar un cambio:

```bash
cd /Users/belu/Desktop/GoNama/gonama-landing
shopify theme push --theme 190538940704 --store gonamauy.myshopify.com --allow-live --force
```

`--allow-live` hace falta porque es el tema publicado, y `--force` saltea la
confirmación, que si no cuelga el comando. Para tocar un solo archivo y no pisar el
resto de producción, sumar `--only ruta/al/archivo`.

**Igual hay que commitear y pushear a `feature/new-line` siempre**, aunque no despliegue
nada: el repo es la fuente de verdad y así queda historia.

### Cómo volver a conectar GitHub

Pendiente, y no se puede hacer por CLI ni por código: hay que entrar al admin y
autorizar el acceso al repo desde la cuenta de GitHub.

**Online Store → Themes → Add theme → Connect from GitHub**, elegir
`Jinkanna/gonama-landing` y la rama `feature/new-line`. Eso crea un **tema nuevo**; no se
puede convertir uno existente, por eso el que está en vivo no se puede reconectar.
Después hay que verificar que el tema nuevo traiga los assets del globo y publicarlo.

La conexión anterior se había trabado por schemas inválidos, que ya están arreglados
(ver Trampas). Debería sincronizar bien.

---

## Ramas

| Rama | Qué tiene |
|---|---|
| `develop` | El tema tal como estaba en producción, sin tocar |
| `feature/landing-2026` | Primera landing, 9 secciones con prefijo `gn-`. Abandonada |
| `feature/new-line` | **La rama activa.** Landing basada en unitedcarriers.com |
| `feature/new-pos` | Duplicado de new-line por un cambio de nombre. Se puede borrar |

Todo el trabajo del globo y las transiciones está en **`feature/new-line`**, desde
`b70f9ae` (el último commit previo) hasta la punta. Son unos treinta commits, cada uno
con el porqué en el mensaje.

Trabajar sobre **`feature/new-line`**.

```bash
cd /Users/belu/Desktop/GoNama/gonama-landing && git checkout feature/new-line && git pull
```

---

## La landing actual

Diez secciones, prefijo `gn-pos`, clases CSS `gnp`:

```
intro → hero → statement → services → reliability → edge → partners → close → faq → about
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
| Misión | `gn-pos-about` | Mission, Vision e History, clavada al scrollear |

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

## El globo del hero

Está en `assets/gn-pos-globe.js`, un módulo ES que se carga solo si el hero tiene el
checkbox **Globo 3D** activado. Con el checkbox apagado el hero vuelve a como estaba.

### Qué dibuja

- **Costas con línea continua**, no grilla de puntos. La geometría es world-atlas
  (`assets/gn-land-110m.js`), remuestreada a medio grado en un Web Worker y dibujada
  como un solo `LineSegments`. Las costas se apagan al entrar en la noche.
- **Cuerpo y atmósfera**, dos esferas con shader propio. El cuerpo se sombrea por el
  ángulo con una luz fija en espacio de vista, con terminador corto y banda de amanecer.
  La atmósfera es un cascarón de radio 1.028 que solo se enciende en el contorno.
- **25 mercados** con pin, halo y anillo que late cuando le llega un arco. **17 llevan
  nombre**; los otros 8 están a menos de 2000 km de uno etiquetado y se pisarían.
- **43 rutas** como arcos animados por shader, sin trabajo de CPU por frame.
- Arranca centrado en Montevideo, meridiano 56.16 oeste.

### Dependencias, todas vendorizadas

`gn-three.min.js`, `gn-three.core.min.js`, `gn-three-orbit.js`, `gn-three-css2d.js`
(three.js r184) y `gn-land-110m.js`. Se resuelven con un **import map declarado en
`gn-pos-hero.liquid`**, que tiene que quedar antes de cualquier `script type=module` de
la página. Esa sección se renderiza antes que `scripts-tag`, por eso funciona ahí.

---

## Movimiento por scroll

Todo lo que reacciona al scroll pasa por **un solo ticker** en `gn-pos.js`
(`alScroll`). Antes había cuatro listeners con su propio `requestAnimationFrame` y las
actualizaciones caían en cuadros distintos, lo que se lee como tironeo aunque cada
animación sea suave. **No agregar listeners de scroll sueltos: colgarse de `alScroll`.**

Tres animaciones atadas a la posición del scroll, no a duraciones:

**Salida del hero** (`--gnp-salida`, de 0 a 1). El globo se apaga y se oscurece a la vez,
el cielo se desvanece creciendo, y el degradado del cierre entra. Valores copiados de
unitedcarriers, medidos en su página: al final del recorrido su globo queda en opacidad
0.196 con `brightness(0.357)` y su cielo en `scale(1.08)`.

**Entrada de cada sección** (`--gnp-entrada`). Ocho secciones suben y se encienden. El
efecto va en `.gnp__in` y **no en la sección**: con la opacidad sobre la sección entera
también baja la del fondo, y una sección oscura entrando sobre página clara se ve gris
sucio.

**Sección clavada** de Mission, Vision e History. El bloque activo se calcula por peso
continuo, no por umbral: cada uno recibe un valor según a qué distancia está del centro
de su tramo, así el que se va y el que llega se cruzan. Los tres títulos y los pasos
numerados del riel son botones que llevan a su bloque.

---

## Trampas nuevas, todas encontradas a los golpes

**1. `"default": ""` en un schema rompe la sincronización con GitHub.** Shopify rechaza
la sección entera con *Invalid schema: setting default can't be blank*. Había once
settings así en nueve secciones. Como `gn-pos-about.liquid` no subía, el
`templates/index.json` quedaba apuntando a una sección inexistente y **la sección de
misión no aparecía en el sitio**. Si algo deja de sincronizar, empezar por acá.

**2. Shopify minifica los `.js` del tema y rompe el `import()` dinámico**, lo convierte
en `require()`, que en el navegador no existe. Por eso la geometría del globo entra por
**import estático** vía import map. No volver a usar import dinámico en este tema.

**3. `assets/` no acepta `.json`.** Un archivo así corta la sincronización entera, no
solo ese archivo. La geometría es `gn-land-110m.js`, un módulo que exporta el objeto.

**4. El orden en el CSS importa más de lo que parece.** Un bloque dentro de una media
query escrito **antes** de la regla base pierde ante ella, porque tienen la misma
especificidad. Pasó dos veces: el `max-width` del footer y las reglas del canvas.

**5. Un contenedor `display: flex` encoge a su hijo al ancho del contenido.** La sección
clavada quedaba en una columna angosta en el medio de la pantalla. Se arregla con
`width: 100%` en `.gnp__in`.

**6. En sombras `inset` el color aparece del lado contrario al desplazamiento.** Con Y
negativa la luz sale abajo, no arriba.

**7. Un `transform` en un ancestro rompe el `position: fixed` de sus hijos.** Por eso la
sección clavada está excluida de la animación de entrada: le rompería el escenario.

**8. La animación de entrada tiene que estar acotada por el alto de la sección.** La
última sección nunca sube más que su propio alto porque abajo no queda página: el footer
mide 296px y se quedaba en 0.36 de opacidad para siempre.

**9. La caché de página de Shopify no se saltea con parámetros al azar.** Después de
pushear, el HTML público puede seguir mostrando la versión vieja varios minutos. Para
verificar de verdad: pedir el asset con un `?v=` inventado, o traerse el archivo con
`shopify theme pull --only ruta`.

**10. El panel de vista previa y las pestañas en segundo plano congelan
`requestAnimationFrame` y las transiciones CSS.** Más de una vez di por rota una
animación que estaba bien. Si algo parece no animarse, chequear `document.hidden`.

---

## Decisiones tomadas

- **Sin guiones largos (—)** en ningún texto ni en las respuestas.
- **Sin testimonios ni sección de insights.**
- **Hay globo 3D**, desde el 7 de agosto. Los dos intentos anteriores se habían
  descartado por peso; este funciona porque three.js va vendorizado en `assets/` y se
  carga solo en la home. Ver la sección del globo más abajo.
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
- **Reconectar el tema a GitHub.** Es lo único que quedó a medias. Ver arriba.
- **Lighthouse sin medir.** Ahora pesa más: el stack del globo son unos 865KB sin
  comprimir, casi todo three.js, y se carga solo en la home.
- **El arrastre del globo está apagado en teléfono** a propósito, para que no se pelee
  con el scroll. Si se quiere activar, hay que limitarlo al eje horizontal.
- **Las etiquetas del globo son nombres de ciudad.** Quedó preguntado si se prefieren
  nombres de país.

Resueltos en la sesión del 7 de agosto:

- ~~Widget "Chat with us"~~. Era un app embed de **Tidio Live Chat**; se apagó desde
  `config/settings_data.json`. La app sigue instalada: para volver a mostrarlo, poner
  `disabled` en `false`.
- ~~Shopify CLI no funciona~~. Se resolvió con `shopify auth logout` y volviendo a
  entrar con la cuenta dueña de la tienda. El CLI andaba autenticado en la organización
  de Partners equivocada.

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
