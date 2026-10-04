# 📖 Editor de Libros estilo Minecraft

Un editor de texto con el aspecto de un **libro con tapa de cuero** de Minecraft. Escribes en un libro de dos páginas, el texto fluye solo de una hoja a la siguiente con animación de giro, y puedes guardar, importar y exportar tu historia. Funciona en el navegador, sin instalación ni servidor.

> *Tu historia, en tus términos.*

---

## Índice

1. [Características](#características)
2. [Cómo ejecutarlo](#cómo-ejecutarlo)
3. [Estructura del proyecto](#estructura-del-proyecto)
4. [Guía de uso](#guía-de-uso)
5. [Cómo funciona por dentro](#cómo-funciona-por-dentro)
6. [Guardado: cómo decide la ruta](#guardado-cómo-decide-la-ruta)
7. [Idiomas y Minecraftiano](#idiomas-y-minecraftiano)
8. [Personalización](#personalización)
9. [Compatibilidad](#compatibilidad)
10. [Limitaciones conocidas](#limitaciones-conocidas)
11. [Solución de problemas](#solución-de-problemas)
12. [Ideas futuras](#ideas-futuras)
13. [Créditos](#créditos)

---

## Características

**Escritura**
- Libro de **dos páginas visibles** con rótulo "Página X de Y".
- **Paginación automática**: cuando una página se llena, el texto pasa a la siguiente; si no existe, se crea una nueva. El cursor viaja con el texto.
- **Giro de hoja animado** al cambiar de página.
- Navegación con flechas laterales y teclado (ver [Guía de uso](#guía-de-uso)).
- Tipografía pixelada y escalado automático: el libro se adapta al ancho **y** al alto de la ventana.

**Archivos**
- **Guardar** en un archivo `.txt` (sobrescribe el mismo archivo en los guardados siguientes).
- **Importar** archivos de texto (`.txt`, `.md`) y repartirlos por páginas.
- **Exportar** a **PDF** o **TXT**.
- **Nuevo libro** con confirmación si hay cambios sin guardar.
- Indicador de estado: `✓ Guardado` / `● Cambios sin guardar`, con el nombre del archivo.
- Copia de seguridad automática en el navegador.

**Personalización**
- **6 fondos** incluidos, con vista previa del libro antes de aplicar, más la opción de **subir tu propia imagen**.
- **4 idiomas**: Català, Castellano, English y **Minecraftiano** (alfabeto galáctico).
- Pantalla de **Créditos** con enlaces.

---

## Cómo ejecutarlo

No necesita instalación. Solo hace falta un navegador moderno.

1. Descarga o descomprime el proyecto en una carpeta.
2. Abre `index.html` con el navegador (doble clic).

> ⚠️ Mantén **todos los archivos juntos** tal y como están. Si falta `script.js` o `style.css`, la página se verá vacía o sin estilo.

**Requisitos de red:** las tipografías (Google Fonts) y la librería de PDF (jsPDF) se cargan desde internet. Sin conexión, el editor funciona pero se verá con una fuente de reserva y **Exportar → PDF no estará disponible**.

---

## Estructura del proyecto

```
libro_minecraft/
├── index.html        → estructura de la página
├── style.css         → estilos
├── script.js         → toda la lógica
├── README.md
├── elementos/
│   ├── libro.png           → marco y páginas del libro
│   └── boton_ajustes.png   → icono del engranaje
└── fondos/
    ├── fondo_1.webp
    ├── fondo_2.jpg
    ├── fondo_3.jpg
    ├── fondo_4.jpg
    ├── fondo_5.jpg
    └── fondo_6.jpg
```

Las imágenes se cargan con rutas relativas (`./elementos/...`, `./fondos/...`) mediante etiquetas `<img src>`.

---

## Guía de uso

### Escribir y cambiar de página

| Acción | Cómo |
|---|---|
| Escribir | Haz clic en una página y teclea |
| Hoja siguiente / anterior | Flechas laterales del libro, `AvPág` / `RePág`, o `Alt` + `→` / `←` |
| Cruzar de página con el cursor | `→` al final del texto o `←` al inicio |
| Unir con la página anterior | `Retroceso` al inicio de una página |
| Guardar | Botón **Guardar** o `Ctrl+S` (`Cmd+S` en Mac) |
| Cerrar una ventana | `Esc` o clic fuera de ella |

### Botones inferiores

- **Guardar** → ver [cómo decide la ruta](#guardado-cómo-decide-la-ruta).
- **Importar** → abre un `.txt` y reparte su contenido por páginas. Sustituye el libro actual.
- **Exportar** → elige **PDF** o **TXT** y el nombre del archivo.

### Menú de ajustes (⚙)

- **Nuevo libro** → vacía el libro. Si hay cambios sin guardar, pide confirmación.
- **Cambiar fondo** → elige entre los 6 fondos con vista previa, o sube una imagen propia y pulsa **Aplicar**.
- **Cambiar idioma** → se aplica al instante.
- **Créditos** → autor y redes.

---

## Cómo funciona por dentro

### Paginación automática

El libro no cuenta caracteres: **mide**. Un `textarea` oculto (`#M`) tiene exactamente el tamaño y la tipografía de una página. Cuando el texto desborda, la función `fit()` busca por **bisección** el máximo prefijo que cabe y corta preferentemente tras un espacio o salto de línea. El sobrante se antepone a la página siguiente y se repite en cascada (`reflow()`), trasladando también la posición del cursor.

El corte se hace *después* del espacio, así que al unir todas las páginas se obtiene el texto original exacto. Por eso al exportar o guardar a `.txt` no se pierde ni se añade nada, y al reimportar las páginas se vuelven a repartir igual.

### Escalado

El libro es un contenedor con `container-type: inline-size`. Todo su contenido (texto, rótulos, flechas) usa unidades `cqw`, así que **todo se escala en proporción** con el tamaño del libro. Su ancho es `min(94vw, 1100px, alto disponible × proporción de la imagen)`, por lo que nunca se corta por arriba.

### Estado

El texto vive en un array `P` (una cadena por página). Cada cambio se copia en `localStorage`, que sirve como copia de seguridad automática (texto, idioma, fondo y estado de guardado).

---

## Guardado: cómo decide la ruta

El botón **Guardar** sigue este orden:

1. **El libro ya tiene archivo** (porque lo guardaste antes o lo importaste con el selector del sistema) → se **sobrescribe** directamente, sin preguntar.
2. **Sin archivo, y el navegador permite elegir ruta** → abre el diálogo **"Guardar como"** del sistema y recuerda la ruta.
3. **El navegador no permite rutas** → la primera vez pide el nombre en una ventana propia y descarga el archivo; los guardados siguientes **descargan de nuevo con ese mismo nombre**, sin preguntar (el navegador no puede sobrescribir el anterior).

Detalles:
- **Nuevo libro** olvida el archivo: el siguiente Guardar pedirá ruta.
- **Importar** asocia el libro al archivo abierto: Guardar escribe sobre él.
- La ruta se recuerda aunque recargues la página. Si el navegador lo pide, te preguntará una vez por el permiso de escritura.
- Si el archivo ya no existe o no se puede escribir, vuelve a pedir ruta.

> La copia de `localStorage` **no es tu archivo**: es solo una red de seguridad. El archivo `.txt` solo se actualiza cuando pulsas Guardar.

---

## Idiomas y Minecraftiano

| Idioma | Código |
|---|---|
| Castellano | `es` (por defecto) |
| Català | `ca` |
| English | `en` |
| Minecraftiano | `mc` |

**Minecraftiano** traduce toda la interfaz al alfabeto galáctico de Minecraft. Ignora las tildes y respeta números y signos. **El texto del libro no se transforma**, para que lo que escribes siga siendo legible.

| | | | | | | | |
|---|---|---|---|---|---|---|---|
| A ᔑ | B ʖ | C ᓵ | D ↸ | E ᒷ | F ⎓ | G ⊣ | H ⍑ |
| I ╎ | J ⋮ | K ꖌ | L ꖎ | M ᒲ | N リ | O 𝙹 | P !¡ |
| Q ᑑ | R ∷ | S ᓭ | T ℸ̣ | U ⚍ | V ⍊ | W ∴ | X ̇/ |
| Y ‖ | Z ⨅ | | | | | | |

Estos símbolos no están en la fuente pixelada del libro, por lo que el navegador usa las fuentes de tu sistema (Segoe UI Symbol, Ebrima, Cambria Math, Noto Sans Symbols…). Si algún símbolo sale como un cuadrado vacío, falta esa fuente en tu equipo.

### Añadir un idioma

1. En `script.js`, copia un bloque del objeto `L` (por ejemplo `en`) y traduce sus valores.
2. Añade una fila en `langScreen()` y su bandera en el objeto `FL`.

---

## Personalización

### Cambiar o añadir fondos

Los fondos se buscan en `fondos/` con el patrón `fondo_N`. Para **sustituir** uno, reemplaza el archivo conservando el nombre. El programa prueba las extensiones `.jpg`, `.webp`, `.jpeg`, `.png`, `.JPG` y `.jfif`, y también acepta `fondo 1` o `fondo-1`.

Para **añadir un séptimo fondo** hay que editar `script.js`:
- Añade `"f7"` al array `TH`.
- Añade su ruta al objeto `B` y su nombre en la clave `th` de cada idioma.
- Amplía el bucle de `findBg()` (`n <= 6` → `n <= 7`).

### Colores y tamaños

En `style.css`, el bloque `:root` define los colores principales:

```css
--ink:#3b2a1a;   /* tinta */
--par:#ecdcb0;   /* pergamino */
--red:#9c2a1e;   /* marco rojo */
--fs:17px;       /* tamaño base de letra */
```

El tamaño de letra del texto del libro es `2.25cqw` en las reglas `.ta` y `.tx`.

### Imágenes del libro

`elementos/libro.png` es el marco. Si lo cambias por otro con **otra proporción**, ajusta el `aspect-ratio` de `.bk` y los porcentajes de posición de `.pn`, `.ta` y `.tx`.

---

## Compatibilidad

| Función | Chrome / Edge | Firefox | Safari |
|---|:---:|:---:|:---:|
| Escribir, paginar, giro de hoja | ✅ | ✅ | ✅ |
| Importar archivos | ✅ | ✅ | ✅ |
| Guardar con ruta recordada | ✅ | ➖ descarga | ➖ descarga |
| Exportar PDF / TXT | ✅ | ✅ | ✅ |

La tabla refleja cómo está diseñado el código según las funciones que ofrece cada navegador, no una batería de pruebas en cada uno. El guardado con ruta usa la **File System Access API**, que de momento está pensada para navegadores basados en Chromium. En el resto se usa la descarga con nombre fijo.

---

## Limitaciones conocidas

- **Sin internet** no se cargan las tipografías de Google ni jsPDF (no se puede exportar a PDF).
- **Formatos de exportación:** solo PDF y TXT. No hay DOCX ni PNG.
- **Texto plano:** no hay negrita, cursiva ni imágenes dentro del libro.
- **Pensado para escritorio.** En móvil el texto queda pequeño; no hay todavía vista de una sola página.
- **Almacenamiento:** `localStorage` tiene un límite aproximado de 5 MB. Una imagen de fondo propia muy pesada puede no guardarse (el fondo propio se reduce a 1600 px y se comprime, pero no se garantiza).
- **El PDF** usa las fuentes estándar de jsPDF: reproduce tildes y la eñe, pero no los símbolos del Minecraftiano.

---

## Solución de problemas

| Síntoma | Causa probable | Solución |
|---|---|---|
| La página se ve sin texto en los botones, con las dos flechas visibles | `script.js` no se está cargando | Comprueba que está junto a `index.html` y que se llama exactamente `script.js`. Abre la consola (`F12`) para ver el error |
| La página se ve sin estilo | Falta `style.css` | Misma comprobación |
| El fondo es un degradado naranja/morado | No se encuentran las imágenes de `fondos/` | Revisa que la carpeta se llame `fondos` y los archivos `fondo_1`…`fondo_6` |
| El libro no aparece | Falta `elementos/libro.png` | Revisa la carpeta `elementos` |
| Exportar → PDF no hace nada | Sin conexión, o la CDN está bloqueada | Conéctate a internet o aloja jsPDF en local |
| Guardar siempre pide nombre / descarga archivos | El navegador no permite rutas | Usa Chrome o Edge abriendo la página desde tu carpeta |
| Se perdió el texto al volver a abrir | Se borraron los datos del navegador o se usó modo privado | Guarda con **Guardar** / `Ctrl+S` con regularidad |
| Símbolos del Minecraftiano como cuadrados | Falta una fuente en el sistema | Instala una fuente con símbolos (p. ej. Noto Sans Symbols) |

Los errores no se muestran en la página: aparecen solo en la **consola del navegador** (`F12` → *Console*).

---

## Ideas futuras

- Vista de **una sola página** para móvil y empaquetado como **app Android** (por ejemplo con Capacitor).
- Incluir jsPDF y las tipografías dentro del proyecto para funcionar **100 % sin conexión**.
- Exportación a **DOCX** y a **PNG**.
- Más fondos y selector de color de la tapa del libro.
- Búsqueda de texto dentro del libro y contador de palabras.

---

## Créditos

**Hecho por Alexey Tenllado León.** Proyecto libre y autodidacta.

- GitHub: [ContactAlexey](https://github.com/ContactAlexey)
- YouTube: [@AlexeyTechSec](https://www.youtube.com/@AlexeyTechSec)
- Instagram: [@alexeytechsec](https://www.instagram.com/alexeytechsec/)
- TikTok: [@alexeytechsec](https://www.tiktok.com/@alexeytechsec)

Tecnologías: HTML, CSS y JavaScript sin frameworks · [jsPDF](https://github.com/parallax/jsPDF) para exportar a PDF · tipografías [Pixelify Sans](https://fonts.google.com/specimen/Pixelify+Sans) y [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P) de Google Fonts.

*Minecraft es una marca de Mojang / Microsoft. Este proyecto es independiente y no está afiliado a ellos.*

*Gracias por apoyar el proyecto.*
