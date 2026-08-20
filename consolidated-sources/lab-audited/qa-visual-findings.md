# QA visual — ciclo 10/10

## Captura desktop 1280 × 720

La apertura ya presenta una jerarquía editorial clara: marca pequeña, titular dominante, imagen material muy oscura y haz vertical con separación suficiente. El fondo ya no es una superficie completamente plana; aparece una estructura arquitectónica real del archivo aportado sin competir con el texto. La interacción de entrada se lee como gesto textual y no como botón convencional. El balance izquierdo/derecho es intencional, aunque el área derecha podría ganar una segunda capa material más legible en capítulos posteriores.

## Captura móvil 390 × 844

La cabecera mantiene la marca y el indicador de profundidad sin desbordamiento. El titular ocupa el campo con buen impacto y el texto descriptivo conserva lectura. El haz vertical se mantiene como eje de navegación. El logotipo fantasma de la imagen de origen aparece en la parte baja de la composición: debe conservarse solo si funciona como huella del material aportado y no como ruido accidental. La siguiente validación debe revisar el primer capítulo, la lista de estaciones y el archivo en móvil, además de confirmar que los botones visualmente planos no aparecen en ninguna zona.

## Decisiones de la siguiente iteración

1. Mantener negro absoluto, blanco mineral y piedra fría; no reintroducir color saturado.
2. Mantener dos familias tipográficas únicas: Space Grotesk e Inter.
3. Revisar la carga y el recorte de todas las imágenes del archivo, no solo la hero.
4. Verificar que la profundidad no cause solapamientos, scroll horizontal ni pérdida de foco.
5. Comprobar el texto de todas las estaciones y eliminar cualquier resto de lenguaje de interfaz de software que debilite la narrativa física.

## Verificaciones técnicas adicionales

Las 14 rutas de imagen de `mediaAssets.ts` responden como imágenes válidas después de seguir la redirección del almacenamiento. La compilación TypeScript y el build de producción completan sin errores. La eliminación de los proveedores de UI heredados reduce el JavaScript principal a aproximadamente 468 KB sin comprimir y 137 KB gzip; Vite ya no emite el aviso de chunk mayor de 500 KB. La experiencia inicial permanece sin audio automático: el motor opcional está silenciado por defecto y no forma parte del recorrido principal.

## Revisión visual independiente aplicada

La revisión confirmó que el negro atmosférico, los titulares ligeros, el ritmo asimétrico, las imágenes orbitales y la voz solemne son los puntos más fuertes. Se aplicó una pasada holística para reforzar el núcleo central, repetir la A orbital en hero, máquina y footer, y alternar el vacío con micro-telemetría mineral en cada capítulo. Se rechazó explícitamente la recomendación de introducir azul eléctrico o naranja porque contradice la restricción vinculante del usuario y la decisión rectora actual: negro absoluto, piedra fría y blanco mineral.

Las capturas desktop y móvil posteriores muestran que la A orbital no tapa el titular, el haz central conserva su función de eje y el gesto de entrada sigue siendo legible. La marca funciona ahora como un sistema repetido sin convertir el recorrido en una interfaz de software.
