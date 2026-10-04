/*
 * Catálogo de materiales aportados por el usuario y subidos al almacenamiento webdev.
 * No se usan imágenes externas: esta historia visual se construye con el archivo real del proyecto.
 */
export const MEDIA_ASSETS = [
  { id: 'ref-01', src: '/manus-storage/file_00000000166081f4966442ebfdcd24bd_9793fbbd.png', label: 'SIGNAL / 01', caption: 'La primera variación del campo.' },
  { id: 'ref-02', src: '/manus-storage/file_00000000537481f4bcbad8c5f6791b13_74df4cf1.png', label: 'SIGNAL / 02', caption: 'Un borde de luz conserva la memoria de la forma.' },
  { id: 'ref-03', src: '/manus-storage/file_00000000772081f48db4875fb3e1a4a0_832f0926.png', label: 'SIGNAL / 03', caption: 'La geometría se vuelve atmósfera.' },
  { id: 'ref-04', src: '/manus-storage/file_00000000830c81f4ade841860e38c9b6_f7f85b5b.png', label: 'SIGNAL / 04', caption: 'El sistema no explica: deja aparecer.' },
  { id: 'ref-05', src: '/manus-storage/file_000000008d9481f482ef081f1d99d834_57efddc3.png', label: 'SIGNAL / 05', caption: 'Materia, vacío y un punto de decisión.' },
  { id: 'ref-06', src: '/manus-storage/file_00000000ae1881f4808812d03fb33ee1_88d0f55f.png', label: 'SIGNAL / 06', caption: 'La estructura permanece incompleta a propósito.' },
  { id: 'ref-07', src: '/manus-storage/file_00000000e6d881f4b90710223bc339aa_dfe0e558.png', label: 'SIGNAL / 07', caption: 'Un núcleo aislado sostiene el campo.' },
  { id: 'ref-08', src: '/manus-storage/file_00000000e9a881f4bda718d8e08ecc4f_88e6d080.png', label: 'SIGNAL / 08', caption: 'La luz vertical se comporta como arquitectura.' },
  { id: 'ref-09', src: '/manus-storage/file_00000000f73c824692a325ccf47b8544_b7facbbd.jpg', label: 'SIGNAL / 09', caption: 'Una interrupción mínima transforma la lectura.' },
  { id: 'ref-10', src: '/manus-storage/file_00000000fc8882438a6b864f8aeefba7_d680f0f9.png', label: 'SIGNAL / 10', caption: 'El símbolo aparece cuando el ruido desaparece.' },
  { id: 'threshold', src: '/manus-storage/gemini-2.5-flash-image_transforma_el_imagen_a_16._9_elimina_las_letras-0_44e27229.jpg', label: 'THRESHOLD / 01', caption: 'La verticalidad como origen y entrada.' },
  { id: 'archive-01', src: '/manus-storage/image_1785798712545_68761066.jpeg', label: 'ARCHIVE / 01', caption: 'Material de referencia del laboratorio.' },
  { id: 'orbital-mark', src: '/manus-storage/pasted_file_u112HT_image_afb8ddf7.png', label: 'MARK / A', caption: 'La A como umbral, no como inicial.' },
  { id: 'frame-01', src: '/manus-storage/videoframe_5875_753b4fa6.png', label: 'FRAME / 01', caption: 'Un fotograma guardado dentro del sistema.' },
] as const;

export type MediaAsset = (typeof MEDIA_ASSETS)[number];

export const FEATURED_ASSETS = MEDIA_ASSETS.filter((asset) =>
  ['threshold', 'orbital-mark', 'ref-05', 'ref-08', 'frame-01'].includes(asset.id)
);

export const ARCHIVE_ASSETS = MEDIA_ASSETS.filter((asset) => !FEATURED_ASSETS.some((featured) => featured.id === asset.id));
