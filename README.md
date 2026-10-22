# Una carta para Yadi

Jardín interactivo en tonos lavanda y rosa, con siete flores 3D de inspiración peonía, pequeñas flores perladas, follaje y una carta de Franduxs.

Sitio: https://franduxs.github.io/flores-moradas/

## Carta con foto y video

La carta de Yadi incluye la fotografía facilitada por el usuario, presentada como una impresión sobre papel marfil. El panel se puede ampliar para leer sin prisa; Escape vuelve al jardín.

«Un instante para ti» descubre el video, sin reproducción automática. Su archivo se carga solo al abrir el detalle. La reproducción suspende el contexto musical, conservando su posición; al pausar vuelve al estado musical anterior. Ocultar el video o plegar la carta detiene la reproducción.

Archivos en `assets/`: fotografía original JPEG (195.218 bytes), video web H.264/AAC (2.722.603 bytes, 478×270, 30 fps, 12,985 s) y póster. El video de origen medía 9.026.515 bytes y 478×850; la copia web retira únicamente sus franjas negras superiores/inferiores, detectadas a lo largo del clip. Los originales en Downloads no se modificaron.

Verificación: imagen cargada a 1600 px, reproducción real del MP4, controles visibles en móvil, carga diferida y coordinación de audio comprobadas con Playwright; cuatro tamaños sin desbordamiento; cero errores/avisos de consola. Texto visible sin referencias a Moni.

Referencias: [video HTML según MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/video) y [carga diferida de video en web.dev](https://web.dev/articles/lazy-loading-video?hl=en).

## Experiencia

- Floración progresiva, giro táctil y acordes al tocar las flores.
- Tres melodías procedurales con Web Audio; selector y pausa.
- Carta abierta al entrar, desplazamiento interno en móvil y abrazo animado.
- Composición lateral en escritorio; ramo sobre la carta en móvil.
- Three.js local r128, sin compilación. Google Fonts necesita conexión.

## Verificación del rediseño (2026-10-22)

Playwright: 360x640, 390x844, 844x390 y 1440x900 sin desbordamiento horizontal ni errores JavaScript. Selector musical y abrazo comprobados. Consola sin avisos. Sintaxis de los cinco archivos JavaScript y git diff --check correctos.

Se reutilizan geometrías; estambres y flores perladas usan InstancedMesh. En la misma escena de prueba, las llamadas de dibujo bajaron de 877 a 443 (no es una medición de FPS ni de dispositivos físicos).

Referencias de investigación: [peonías RHS](https://www.rhs.org.uk/plants/peony?type=0), [material físico Three.js](https://threejs.org/docs/pages/MeshPhysicalMaterial.html). Las APIs se contrastaron con la copia r128 local.

La versión original de Moni permanece en el historial Git anterior a db24604.
