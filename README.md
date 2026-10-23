# Una carta para Yadi

Jardín interactivo en tonos lavanda y rosa, con siete flores 3D de inspiración peonía, pequeñas flores perladas, follaje y una carta de Franduxs.

Sitio: https://franduxs.github.io/flores-moradas/

## Carta con foto y video

La carta de Yadi incluye la fotografía facilitada por el usuario, presentada como una impresión sobre papel marfil. El panel se puede ampliar para leer sin prisa; Escape vuelve al jardín.

«Pequeños instantes para ti» descubre cuatro videos con selector y un solo reproductor, sin reproducción automática. El primer archivo se prepara al abrir el detalle; los otros se cargan al seleccionarlos. Ocultar el video o plegar la carta detiene la reproducción.

### A Little Death — The Neighbourhood

Por elección del usuario, se sustituyó la música sintetizada por el reproductor oficial de YouTube. No se descarga ni se aloja una copia de la canción. El reproductor se muestra al principio de la carta e intenta iniciar con sonido al cargar. Cuando el navegador bloquea autoplay, se reintenta con el primer gesto del usuario y se destaca el botón de música. No se puede garantizar autoplay con sonido sin interacción. Tras una pausa deliberada no se reinicia por toques casuales. El controlador pausa la canción cuando empieza un clip y la continúa después si estaba sonando; cerrar el apartado o esconder la página la pausa.

Comprobación: las publicaciones oficiales devolvieron error 150 en localhost, pero `bRfMwoIizTQ` sí se reprodujo desde el dominio público GitHub Pages. Se verificaron los estados de reproducción, pausa al iniciar un clip y continuación al pausarlo. YouTube mostró publicidad antes de la canción; sus controles y disponibilidad dependen del proveedor. Ante errores se oculta el marco fallido y se conserva el enlace oficial. No hace falta un archivo local para esta versión. Referencia: [API oficial de YouTube](https://developers.google.com/youtube/iframe_api_reference).

Archivos en `assets/`: fotografía original JPEG (195.218 bytes), video web H.264/AAC (2.722.603 bytes, 478×270, 30 fps, 12,985 s) y póster. El video de origen medía 9.026.515 bytes y 478×850; la copia web retira únicamente sus franjas negras superiores/inferiores, detectadas a lo largo del clip. Los originales en Downloads no se modificaron.

Verificación: imagen cargada a 1600 px, reproducción real del MP4, controles visibles en móvil, carga diferida y coordinación de audio comprobadas con Playwright; cuatro tamaños sin desbordamiento; cero errores/avisos de consola. Texto visible sin referencias a Moni.

Referencias: [video HTML según MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/video) y [carga diferida de video en web.dev](https://web.dev/articles/lazy-loading-video?hl=en).

### Tres videos añadidos

Las fuentes HDR10+ HEVC 4K se conservaron en sus rutas originales. Las copias web usan H.264/AAC, color SDR BT.709 mediante zscale/tonemap, 30 fps y faststart. Se respeta la orientación y no se recorta la imagen. Se excluyen las pistas de datos del teléfono.

| Copia web | Orientación y tamaño | Duración | Bytes |
| --- | --- | --- | --- |
| instante-2.mp4 | Vertical, 720×1280 | 14,33 s | 7.077.600 |
| instante-3.mp4 | Horizontal, 1280×720 | 10,30 s | 5.355.815 |
| instante-4.mp4 | Horizontal, 1280×720 | 6,87 s | 2.588.447 |

Las tres copias suman 15.021.862 bytes frente a 301.803.979 de origen. Playwright comprobó reproducción real de los cuatro clips, cambio de archivo, una sola instancia de video y suspensión musical durante cada clip. Cuatro tamaños sin desbordamiento, cero errores/avisos. Referencia de conversión: [FFmpeg Filters](https://ffmpeg.org/ffmpeg-filters.html).

## Experiencia

- Floración progresiva, giro táctil y acordes al tocar las flores.
- Apartado musical para A Little Death con reproductor/enlace oficial de YouTube y alternativa cuando se restringe su inserción.
- Carta abierta al entrar, desplazamiento interno en móvil y abrazo animado.
- Composición lateral en escritorio; ramo sobre la carta en móvil.
- Three.js local r128, sin compilación. Google Fonts necesita conexión.

## Verificación del rediseño (2026-10-22)

Playwright: 360x640, 390x844, 844x390 y 1440x900 sin desbordamiento horizontal ni errores JavaScript. Selector musical y abrazo comprobados. Consola sin avisos. Sintaxis de los cinco archivos JavaScript y git diff --check correctos.

Se reutilizan geometrías; estambres y flores perladas usan InstancedMesh. En la misma escena de prueba, las llamadas de dibujo bajaron de 877 a 443 (no es una medición de FPS ni de dispositivos físicos).

Referencias de investigación: [peonías RHS](https://www.rhs.org.uk/plants/peony?type=0), [material físico Three.js](https://threejs.org/docs/pages/MeshPhysicalMaterial.html). Las APIs se contrastaron con la copia r128 local.

La versión original de Moni permanece en el historial Git anterior a db24604.
