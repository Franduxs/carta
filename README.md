# Una carta para Yadi

Jardín interactivo en tonos lavanda y rosa, con siete flores 3D de inspiración peonía, pequeñas flores perladas, follaje y una carta de Franduxs.

Sitio: https://franduxs.github.io/flores-moradas/

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
