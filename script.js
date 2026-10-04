// ======================================================================
// EDITOR DE LIBROS ESTILO MINECRAFT — LÓGICA DE LA APLICACIÓN
// ======================================================================
// Este archivo contiene todo el comportamiento de la página:
//   1. Utilidades y datos (idiomas, fondos, alfabeto Minecraftiano)
//   2. Estado y persistencia (localStorage)
//   3. El libro: paginación automática, giro de hoja, teclado
//   4. Guardar / Importar / Exportar archivos
//   5. Ventanas emergentes (ajustes, fondo, idioma, créditos, nuevo libro)
//   6. Arranque de la aplicación

/** Atajo para document.querySelector. */
/** Escapa &, < y > para insertar texto de usuario dentro de HTML sin riesgos. */
const $ = (s) => document.querySelector(s),
  esc = (s) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
/** Identificadores de los fondos disponibles (se corresponden con fondos/fondo_N). */
const TH = ["f1", "f2", "f3", "f4", "f5", "f6"];
/**
 * Textos de la interfaz por idioma (es, ca, en). Las claves son iguales en todos:
 *   save/imp/exp  -> botones principales          set/bg/lang/cred/nb -> menú de ajustes
 *   page          -> "Página {a} de {b}"          ok/dirty            -> estado de guardado
 *   ph            -> texto de ayuda de la 1ª página  th               -> nombres de los fondos
 * El idioma "mc" (Minecraftiano) reutiliza el castellano y lo transforma con sga().
 */
const L = {
  es: {
    save: "Guardar",
    imp: "Importar",
    exp: "Exportar",
    set: "Configuración",
    bg: "Cambiar fondo",
    lang: "Cambiar idioma",
    cred: "Créditos",
    page: "Página {a} de {b}",
    ok: "✓ Guardado",
    dirty: "● Cambios sin guardar",
    ph: "Escribe aquí tu historia…",
    sel: "Selecciona un idioma",
    by: "Hecho por:",
    free: "Proyecto libre y autodidacta",
    follow: "Sígueme en:",
    thx: "Gracias por utilizar el proyecto.",
    fmt: "Formato de salida:",
    fn: "Nombre del archivo:",
    cancel: "Cancelar",
    apply: "Aplicar",
    cimg: "Imagen personalizada",
    up: "Sube tu propia imagen",
    sas: "Guardar como",
    th: { f1: "Aventura", f2: "Pradera", f3: "Nether", f4: "Montañas", f5: "Laguna", f6: "Jungla" },
    imported: "Libro importado",
    exported: "Exportado",
    nb: "Nuevo libro",
    nbq: "¿Crear un libro nuevo? Se borrará el contenido actual y los cambios sin guardar.",
    mk: "Crear",
    nbd: "Libro nuevo creado",
  },
  ca: {
    save: "Desar",
    imp: "Importar",
    exp: "Exportar",
    set: "Configuració",
    bg: "Canviar fons",
    lang: "Canviar idioma",
    cred: "Crèdits",
    page: "Pàgina {a} de {b}",
    ok: "✓ Desat",
    dirty: "● Canvis sense desar",
    ph: "Escriu aquí la teva història…",
    sel: "Selecciona un idioma",
    by: "Fet per:",
    free: "Projecte lliure i autodidacta",
    follow: "Segueix-me a:",
    thx: "Gràcies per fer servir el projecte.",
    fmt: "Format de sortida:",
    fn: "Nom del fitxer:",
    cancel: "Cancel·lar",
    apply: "Aplicar",
    cimg: "Imatge personalitzada",
    up: "Puja la teva pròpia imatge",
    sas: "Desar com",
    th: { f1: "Aventura", f2: "Prada", f3: "Nether", f4: "Muntanyes", f5: "Llacuna", f6: "Jungla" },
    imported: "Llibre importat",
    exported: "Exportat",
    nb: "Nou llibre",
    nbq: "Vols crear un llibre nou? S'esborrarà el contingut actual i els canvis sense desar.",
    mk: "Crear",
    nbd: "Llibre nou creat",
  },
  en: {
    save: "Save",
    imp: "Import",
    exp: "Export",
    set: "Settings",
    bg: "Change background",
    lang: "Change language",
    cred: "Credits",
    page: "Page {a} of {b}",
    ok: "✓ Saved",
    dirty: "● Unsaved changes",
    ph: "Write your story here…",
    sel: "Select a language",
    by: "Made by:",
    free: "Free, self-taught project",
    follow: "Follow me on:",
    thx: "Thanks for using the project.",
    fmt: "Output format:",
    fn: "File name:",
    cancel: "Cancel",
    apply: "Apply",
    cimg: "Custom image",
    up: "Upload your own image",
    sas: "Save as",
    th: { f1: "Adventure", f2: "Meadow", f3: "Nether", f4: "Mountains", f5: "Lagoon", f6: "Jungle" },
    imported: "Book imported",
    exported: "Exported",
    nb: "New book",
    nbq: "Create a new book? The current content and any unsaved changes will be erased.",
    mk: "Create",
    nbd: "New book created",
  },
};
L.mc = L.es;
/**
 * ESTADO GLOBAL
 *   P       array de páginas (cada elemento es el texto de una página)
 *   cur     índice del "spread" visible (0 = páginas 1-2, 1 = páginas 3-4, ...)
 *   bgId    fondo elegido ("f1".."f6" o "custom")      custom  imagen propia (data URL)
 *   lang    idioma activo                               dirty   hay cambios sin guardar
 *   handle  manejador del archivo en disco (File System Access API) o null
 *   named   el libro ya tiene nombre/ruta de guardado   canPick el navegador permite elegir ruta
 *   fname   nombre del archivo actual                   busy    animación de giro en curso
 *   B       mapa id de fondo -> ruta de la imagen
 */
let P = [""],
  cur = 0,
  bgId = "f4",
  custom = null,
  lang = "es",
  dirty = false,
  handle = null,
  named = false,
  canPick = !!window.showSaveFilePicker,
  fname = "Mi_libro.txt",
  busy = false,
  B = {};
/** Tabla del alfabeto galáctico (Minecraftiano): letra latina -> símbolo. */
const SG = {
  a: "ᔑ",
  b: "ʖ",
  c: "ᓵ",
  d: "↸",
  e: "ᒷ",
  f: "⎓",
  g: "⊣",
  h: "⍑",
  i: "╎",
  j: "⋮",
  k: "ꖌ",
  l: "ꖎ",
  m: "ᒲ",
  n: "リ",
  o: "𝙹",
  p: "!¡",
  q: "ᑑ",
  r: "∷",
  s: "ᓭ",
  t: "ℸ\u0323",
  u: "⚍",
  v: "⍊",
  w: "∴",
  x: "/\u0307",
  y: "‖",
  z: "⨅",
};
/** Convierte un texto a Minecraftiano. Ignora tildes y respeta los marcadores {a} y {b}. */
const sga = (s) =>
  s.replace(/\{[ab]\}|\p{L}/gu, (m) => (m.length > 1 ? m : SG[m.normalize("NFD")[0].toLowerCase()] || m));
/** Devuelve el texto traducido de la clave k en el idioma actual (con transformación si es 'mc'). */
const t = (k) => {
  const v = L[lang][k];
  if (lang !== "mc") return v;
  return typeof v === "string" ? sga(v) : Object.fromEntries(Object.entries(v).map(([a, b]) => [a, sga(b)]));
};
// ======================================================================
// FONDOS
// ======================================================================
B = {
  f1: "./fondos/fondo_1.webp",
  f2: "./fondos/fondo_2.jpg",
  f3: "./fondos/fondo_3.jpg",
  f4: "./fondos/fondo_4.jpg",
  f5: "./fondos/fondo_5.jpg",
  f6: "./fondos/fondo_6.jpg",
};
/** Extensiones que se prueban al buscar cada fondo (por si el archivo no es .jpg). */
const EX = [".jpg", ".webp", ".jpeg", ".png", ".JPG", ".jfif"],
  probe = (u) =>
    new Promise((r) => {
      const i = new Image();
      i.onload = () => r(true);
      i.onerror = () => r(false);
      i.src = u;
    });
/**
 * Busca en ./fondos/ la imagen de cada fondo (fondo_N, "fondo N", fondo-N, fondoN)
 * con cualquiera de las extensiones de EX. Rellena B y devuelve los que no encontró.
 */
async function findBg() {
  const miss = [];
  for (let n = 1; n <= 6; n++) {
    const c = [`fondo_${n}`, `fondo%20${n}`, `fondo-${n}`, `fondo${n}`].flatMap((x) => EX.map((e) => x + e)),
      ok = await Promise.all(c.map((x) => probe("./fondos/" + x))),
      k = ok.indexOf(true);
    k < 0 ? miss.push("fondo_" + n) : (B["f" + n] = "./fondos/" + c[k]);
  }
  return miss;
}
/** Pone en #bg la imagen del fondo elegido (o la personalizada). */
function applyBg() {
  const u = bgId === "custom" && custom ? custom : B[bgId] || B.f4;
  const e = $("#bg");
  e.onerror = () =>
    console.warn("No se encuentra " + (u.startsWith("data:") ? "la imagen personalizada" : u));
  e.src = u;
  e.style.imageRendering = "auto";
}
// ======================================================================
// PERSISTENCIA (localStorage)
// ======================================================================
/** Copia el estado (texto, idioma, fondo...) en localStorage como copia de seguridad automática. */
const persist = () => {
  try {
    localStorage.setItem("mcbook", JSON.stringify({ P, lang, bgId, custom, fname, named, dirty }));
  } catch (e) {}
};
// Al arrancar se recupera el estado guardado, si existe.
try {
  const d = JSON.parse(localStorage.getItem("mcbook") || "null");
  if (d) {
    P = d.P || [""];
    lang = d.lang || "es";
    bgId = B[d.bgId] || d.bgId === "custom" ? d.bgId : "f4";
    custom = d.custom;
    named = !!d.named;
    dirty = !!d.dirty;
    fname = d.fname || fname;
  }
} catch (e) {}
// ======================================================================
// EL LIBRO: paginación, giro de hoja y teclado
// ======================================================================
const book = $("#book"),
  TA = [...book.querySelectorAll(".ta:not(.m)")],
  PN = [...book.querySelectorAll(".pn")],
  M = $("#M"),
  leaf = $("#leaf"),
  AP = $(".ap"),
  AN = $(".an");
/**
 * Calcula cuántos caracteres de `tx` caben en una página.
 * Usa un textarea oculto (#M) con el mismo tamaño y tipografía, y busca por bisección
 * el máximo prefijo que no desborda. Corta preferentemente tras un espacio o salto de línea.
 * @param {string} tx texto a medir  @returns {number} posición de corte
 */
function fit(tx) {
  const ov = (s) => {
    M.value = s;
    return M.scrollHeight > M.clientHeight + 1;
  };
  if (!ov(tx)) return tx.length;
  let lo = 0,
    hi = tx.length;
  while (lo < hi) {
    const m = (lo + hi + 1) >> 1;
    ov(tx.slice(0, m)) ? (hi = m - 1) : (lo = m);
  }
  const w = Math.max(tx.lastIndexOf(" ", lo), tx.lastIndexOf("\n", lo - 1));
  return Math.max(1, w > lo - 40 && w > 0 && tx[lo] !== " " && tx[lo] !== "\n" ? w + 1 : lo);
}
/** Actualiza los rótulos 'Página X de Y' y muestra/oculta las flechas laterales. */
function labels() {
  PN.forEach((p, s) => {
    const i = cur * 2 + s;
    p.textContent =
      i < P.length
        ? t("page")
            .replace("{a}", i + 1)
            .replace("{b}", P.length)
        : "";
  });
  AP.hidden = cur == 0;
  AN.hidden = cur * 2 + 2 >= P.length;
}
/** Vuelca en los dos textareas el texto de las páginas del spread actual. */
function render() {
  TA.forEach((ta, s) => {
    const i = cur * 2 + s;
    ta.value = P[i] ?? "";
    ta.placeholder = i == 0 ? t("ph") : "";
  });
  labels();
}
/** Da el foco a la página absoluta `p` y coloca el cursor en la posición `pos`. */
function foc(p, pos) {
  const ta = TA[p % 2];
  ta.focus();
  ta.setSelectionRange(pos, pos);
}
/**
 * Anima el giro de hoja (d = 1 avanzar, -1 retroceder) y ejecuta `mid` a mitad de la animación,
 * que es cuando se cambia el contenido de las páginas.
 */
function flip(d, mid) {
  if (busy || matchMedia("(prefers-reduced-motion:reduce)").matches) {
    mid();
    return;
  }
  busy = true;
  leaf.className = d > 0 ? "fw" : "bw";
  const a = leaf.animate([{ transform: "rotateY(0)" }, { transform: `rotateY(${-180 * d}deg)` }], {
    duration: 520,
    easing: "ease-in-out",
  });
  setTimeout(mid, 260);
  a.onfinish = () => {
    leaf.className = "";
    busy = false;
  };
}
/**
 * Navega al spread `n`. Elimina páginas vacías sobrantes al final y, opcionalmente,
 * deja el cursor en la página `fp`, posición `pos`.
 */
function goSpread(n, fp, pos) {
  n = Math.max(0, n);
  while (P.length > 1 && P[P.length - 1] === "" && P.length - 1 > n * 2 + 1) P.pop();
  const after = () => {
    cur = n;
    render();
    if (fp != null) foc(fp, pos);
  };
  n === cur ? after() : flip(n > cur ? 1 : -1, after);
}
/**
 * Reparte el desbordamiento: si la página `i` se llena, el sobrante pasa al inicio de la siguiente
 * (creándola si no existe), en cascada. `c` = {page,pos} es la posición del cursor, que se
 * traslada con el texto. `force` obliga a repintar aunque no haya desbordamiento.
 */
function reflow(i, c, force) {
  let moved = force;
  for (let k = i; k < P.length; k++) {
    const cut = fit(P[k]);
    if (cut >= P[k].length) break;
    moved = true;
    const tail = P[k].slice(cut);
    P[k] = P[k].slice(0, cut);
    if (c.page == k && c.pos >= cut) c = { page: k + 1, pos: c.pos - cut };
    P[k + 1] = tail + (P[k + 1] || "");
  }
  setDirty(true);
  persist();
  if (!moved) return labels();
  const sp = c.page >> 1;
  sp !== cur ? goSpread(sp, c.page, c.pos) : (render(), foc(c.page, c.pos));
}
// Cada vez que se escribe en una página se guarda su texto y se recalcula el reparto.
book.addEventListener("input", (e) => {
  const ta = e.target;
  if (!ta.dataset.s) return;
  const i = cur * 2 + +ta.dataset.s;
  P[i] = ta.value;
  reflow(i, { page: i, pos: ta.selectionStart });
});
// Teclado: AvPág/RePág o Alt+flechas cambian de hoja; las flechas cruzan de página al llegar
// al final/inicio del texto; Retroceso al inicio de una página la une con la anterior.
book.addEventListener("keydown", (e) => {
  const ta = e.target;
  if (!ta.dataset || !ta.dataset.s) return;
  const s = +ta.dataset.s,
    i = cur * 2 + s,
    a = ta.selectionStart,
    z = ta.selectionEnd,
    k = e.key;
  if (k === "PageDown" || (e.altKey && k === "ArrowRight")) {
    e.preventDefault();
    step(1);
  } else if (k === "PageUp" || (e.altKey && k === "ArrowLeft")) {
    e.preventDefault();
    step(-1);
  } else if (k === "ArrowRight" && a == ta.value.length && z == a && i + 1 < P.length) {
    e.preventDefault();
    s ? goSpread(cur + 1, i + 1, 0) : foc(i + 1, 0);
  } else if (k === "ArrowLeft" && a == 0 && z == 0 && i > 0) {
    e.preventDefault();
    s ? foc(i - 1, P[i - 1].length) : goSpread(cur - 1, i - 1, P[i - 1].length);
  } else if (k === "Backspace" && i > 0 && a == 0 && z == 0) {
    e.preventDefault();
    const pl = P[i - 1].length;
    P[i - 1] = P[i - 1].slice(0, -1) + P[i];
    P.splice(i, 1);
    reflow(i - 1, { page: i - 1, pos: Math.max(0, pl - 1) }, true);
  }
});
/** Pasa a la hoja siguiente (d = 1) o anterior (d = -1) si existe. */
function step(d) {
  if (d > 0 ? cur * 2 + 2 < P.length : cur > 0) goSpread(cur + d, null);
}
AP.onclick = () => step(-1);
AN.onclick = () => step(1);
// ======================================================================
// ESTADO VISUAL E IDIOMA
// ======================================================================
/** Marca el libro como modificado o guardado y actualiza el indicador (con el nombre de archivo). */
function setDirty(v) {
  dirty = v;
  const s = $("#st");
  s.textContent = (v ? t("dirty") : t("ok")) + (named ? " · " + fname : "");
  s.className = v ? "d" : "";
}
/** Muestra un aviso breve en la parte inferior (por defecto 2,2 s). */
function toast(m, ms) {
  const e = $("#toast");
  e.textContent = m;
  e.style.display = "block";
  clearTimeout(toast.t);
  toast.t = setTimeout(() => (e.style.display = "none"), ms || 2200);
}
/** Aplica el idioma actual a botones, indicador y fuente (modo Minecraftiano). */
function applyLang() {
  document.body.classList.toggle("mc", lang === "mc");
  document.documentElement.lang = lang === "mc" ? "es" : lang;
  $("#bS").textContent = t("save");
  $("#bI").textContent = t("imp");
  $("#bE").textContent = t("exp");
  $("#gear").setAttribute("aria-label", t("set"));
  setDirty(dirty);
  labels();
  TA[0].placeholder = cur == 0 ? t("ph") : "";
}
// ======================================================================
// GUARDAR, IMPORTAR Y EXPORTAR
// ======================================================================
/** Descarga un Blob como archivo con el nombre `n` (alternativa cuando no hay acceso a rutas). */
const dl = (b, n) => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(b);
  a.download = n;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4e3);
};
/** Nombre del archivo actual sin extensión. */
const base = () => fname.replace(/\.[^.]+$/, "") || "Mi_libro";
/** Escribe un Blob en un manejador de archivo del sistema (sobrescribe su contenido). */
async function wr(h, b) {
  const w = await h.createWritable();
  await w.write(b);
  await w.close();
}
/** Guarda/lee/borra el manejador del archivo en IndexedDB para recordar la ruta tras recargar. */
const idb = (m, v) =>
  new Promise((r) => {
    try {
      const q = indexedDB.open("mcbook", 1);
      q.onupgradeneeded = () => q.result.createObjectStore("k");
      q.onsuccess = () => {
        const s = q.result.transaction("k", m == "get" ? "readonly" : "readwrite").objectStore("k");
        const x = m == "get" ? s.get("h") : v ? s.put(v, "h") : s.delete("h");
        x.onsuccess = () => r(x.result);
        x.onerror = () => r();
      };
      q.onerror = () => r();
    } catch (e) {
      r();
    }
  });
/** Solicita permiso de escritura sobre un manejador de archivo. */
const perm = async (h) => {
  try {
    return (await h.requestPermission({ mode: "readwrite" })) === "granted";
  } catch (e) {
    return false;
  }
};
/** Cierra un guardado correcto: limpia el estado 'sin guardar' y avisa al usuario. */
const done = () => {
  setDirty(false);
  persist();
  toast(t("ok"));
};
/** Tipos de archivo admitidos por los selectores de archivo. */
const TYPES = [{ description: "Texto", accept: { "text/plain": [".txt", ".md"] } }];
/**
 * GUARDAR. Orden de decisión:
 *   1) Si ya hay archivo (guardado o importado): se sobrescribe directamente.
 *   2) Si no y el navegador lo permite: diálogo "Guardar como" del sistema; se recuerda la ruta.
 *   3) Si el navegador no permite rutas: se reutiliza el nombre elegido y se descarga el archivo;
 *      la primera vez se pide el nombre en una ventana propia.
 */
async function save() {
  const b = new Blob([P.join("")], { type: "text/plain" });
  // 1) ya hay ruta (archivo guardado o importado con permiso de escritura): sobrescribir
  if (handle) {
    for (let n = 0; n < 2; n++) {
      try {
        await wr(handle, b);
        fname = handle.name;
        return done();
      } catch (e) {
        if (e.name === "NotAllowedError" && n == 0 && (await perm(handle))) continue;
        if (e.name === "NotFoundError" || e.name === "InvalidStateError") {
          handle = null;
          named = false;
          idb("set", null);
          break;
        }
        return console.warn(e);
      }
    }
  }
  // 2) sin ruta: "Guardar como" del sistema
  if (canPick) {
    try {
      const h = await showSaveFilePicker({ suggestedName: fname, types: TYPES });
      await wr(h, b);
      handle = h;
      fname = h.name;
      named = true;
      idb("set", h);
      return done();
    } catch (e) {
      if (e.name === "AbortError") return;
      canPick = false;
    }
  }
  // 3) el navegador no permite rutas: el nombre ya elegido se reutiliza sin preguntar
  if (named) {
    dl(b, fname);
    return done();
  }
  panel(
    hd(t("sas")) +
      `<p>${t("fn")}</p><input id="fn" class="inp" value="${esc(fname)}"><div class="acts"><button class="pb" data-act="dosave">${t("save")}</button><button class="pb" data-act="close">${t("cancel")}</button></div>`,
  );
}
/** Carga un texto en el libro repartiéndolo por páginas y recuerda el archivo de origen. */
function load(txt, name, h) {
  let rest = txt.replace(/\r\n?/g, "\n");
  P = [];
  while (rest.length) {
    const ch = rest.slice(0, 2500),
      cut = fit(ch);
    P.push(rest.slice(0, cut));
    rest = rest.slice(cut);
  }
  if (!P.length) P = [""];
  cur = 0;
  fname = name;
  handle = h || null;
  named = true;
  idb("set", handle);
  render();
  setDirty(false);
  persist();
  toast(t("imported"));
}
// Botones principales: Guardar, Importar (selector con permiso de escritura si es posible) y Exportar.
$("#bS").onclick = save;
$("#bI").onclick = async () => {
  if (window.showOpenFilePicker && canPick) {
    try {
      const [h] = await showOpenFilePicker({ types: TYPES });
      return load(await (await h.getFile()).text(), h.name, h);
    } catch (e) {
      if (e.name === "AbortError") return;
    }
  }
  $("#fi").click();
};
$("#fi").onchange = async (e) => {
  const f = e.target.files[0];
  if (f) load(await f.text(), f.name, null);
  e.target.value = "";
};
$("#bE").onclick = () =>
  panel(
    hd(t("exp")) +
      `<p>${t("fmt")}</p><label class="rd"><input type="radio" name="f" value="pdf" checked> PDF</label><label class="rd"><input type="radio" name="f" value="txt"> TXT</label><p>${t("fn")}</p><input id="fn" class="inp" value="${esc(base())}.pdf"><div class="acts"><button class="pb" data-act="doexp">${t("exp")}</button><button class="pb" data-act="close">${t("cancel")}</button></div>`,
  );
/** Exporta el libro a PDF (con jsPDF, una página del PDF por página del libro) o a TXT. */
async function doExport() {
  const f = document.querySelector("[name=f]:checked").value;
  let n = $("#fn").value.trim() || "libro";
  n = n.replace(/\.(pdf|txt)$/i, "") + "." + f;
  let b;
  try {
    if (f === "pdf") {
      const d = new jspdf.jsPDF({ unit: "mm", format: "a5" });
      P.forEach((p, i) => {
        if (i) d.addPage();
        d.setFont("times", "normal");
        d.setFontSize(12);
        d.text(d.splitTextToSize(p, 110), 15, 22);
        d.setFontSize(9);
        d.text(`${i + 1} / ${P.length}`, 74, 200, { align: "center" });
      });
      b = d.output("blob");
    } else b = new Blob([P.join("")], { type: "text/plain" });
    if (window.showSaveFilePicker) {
      try {
        const h = await showSaveFilePicker({
          suggestedName: n,
          types: [{ description: f.toUpperCase(), accept: { [b.type]: ["." + f] } }],
        });
        await wr(h, b);
      } catch (e) {
        if (e.name === "AbortError") return;
        dl(b, n);
      }
    } else dl(b, n);
    close();
    toast(t("exported"));
  } catch (e) {
    console.warn(e);
  }
}
// ======================================================================
// VENTANAS EMERGENTES
// ======================================================================
/** #ov es la capa oscura; close() la oculta y panel(html) abre una ventana con ese contenido. */
const ov = $("#ov"),
  close = () => {
    ov.classList.remove("on");
    ov.innerHTML = "";
  },
  panel = (h, c = "") => {
    ov.innerHTML = `<div class="panel ${c}">${h}</div>`;
    ov.classList.add("on");
  };
/** Cabecera de ventana: título, botón de volver (opcional) y botón de cerrar. */
const hd = (ti, back) =>
  `<div class="hd">${back ? '<button class="bk2" data-act="menu" aria-label="‹">‹</button>' : ""}<h2>${ti}</h2><button class="x" data-act="close" aria-label="X">✕</button></div>`;
/** Atributos comunes de los iconos SVG del menú. */
const S =
  'width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" shape-rendering="crispEdges"';
/** Iconos SVG del menú de ajustes. */
const IC = {
  nb: `<svg ${S}><path d="M5 3h10l4 4v14H5z"/><path d="M12 10v7M8.5 13.5h7"/></svg>`,
  bg: `<svg ${S}><rect x="3" y="4" width="18" height="16"/><path d="M3 18l6-8 4 5 3-3 5 6z" fill="currentColor"/></svg>`,
  lang: `<svg ${S}><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/></svg>`,
  cred: `<svg ${S}><rect x="5" y="3" width="14" height="18"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>`,
};
/** Banderas SVG de la lista de idiomas. */
const FL = {
  ca:
    '<svg viewBox="0 0 9 6"><rect width="9" height="6" fill="#fcdd09"/>' +
    [1, 3, 5, 7].map((k) => `<rect y="${k * 0.667}" width="9" height=".667" fill="#da121a"/>`).join("") +
    "</svg>",
  es: '<svg viewBox="0 0 9 6"><rect width="9" height="6" fill="#c60b1e"/><rect y="1.5" width="9" height="3" fill="#ffc400"/></svg>',
  en: '<svg viewBox="0 0 60 30"><rect width="60" height="30" fill="#012169"/><path d="M0 0L60 30M60 0L0 30" stroke="#fff" stroke-width="6"/><path d="M0 0L60 30M60 0L0 30" stroke="#c8102e" stroke-width="2"/><path d="M30 0V30M0 15H60" stroke="#fff" stroke-width="10"/><path d="M30 0V30M0 15H60" stroke="#c8102e" stroke-width="6"/></svg>',
  mc: '<svg viewBox="0 0 8 8"><rect width="8" height="8" fill="#7a5230"/><rect width="8" height="3" fill="#4aa63a"/></svg>',
};
/** Menú de ajustes: Nuevo libro, Cambiar fondo, Cambiar idioma y Créditos. */
const menu = () =>
  panel(
    hd(t("set")) +
      ["nb", "bg", "lang", "cred"]
        .map(
          (k) =>
            `<button class="row" data-act="${k}">${IC[k]}<span>${t(k)}</span><span class="g">›</span></button>`,
        )
        .join(""),
  );
/** Selección temporal del selector de fondo (sel = fondo elegido, tmp = imagen propia sin aplicar). */
let sel, tmp;
/** Redibuja la vista previa (libro + botones sobre el fondo elegido) y marca la opción activa. */
function pvUpdate() {
  const u = sel === "custom" && tmp ? tmp : B[sel],
    a = cur * 2,
    pl = (i) =>
      i < P.length
        ? t("page")
            .replace("{a}", i + 1)
            .replace("{b}", P.length)
        : "";
  $("#pv").innerHTML =
    `<img class="pvbg" src="${u}" alt=""><div class="bk pvb"><img class="bi" src="./elementos/libro.png" alt=""><span class="pn l">${pl(a)}</span><div class="tx l">${esc(P[a] || "")}</div><span class="pn r">${pl(a + 1)}</span><div class="tx r">${esc(P[a + 1] || "")}</div></div><div class="pvbt"><span class="pb">${t("save")}</span><span class="pb">${t("imp")}</span><span class="pb">${t("exp")}</span></div>`;
  ov.querySelectorAll(".th").forEach((b) => b.classList.toggle("sel", b.dataset.id === sel));
}
/** Ventana 'Cambiar fondo': lista de fondos, vista previa y subida de imagen propia. */
function bgScreen() {
  sel = bgId;
  tmp = custom;
  panel(
    hd(t("bg"), 1) +
      `<div class="bgg"><div>${TH.map((id) => `<button class="row th" data-act="sel" data-id="${id}"><img src="${B[id]}" alt="">${t("th")[id]}</button>`).join("")}<button class="row th" data-act="sel" data-id="custom"><b class="plus">+</b>${t("cimg")}</button></div><div class="pv" id="pv"></div><div class="up"><div>${t("cimg")}</div><button class="drop" data-act="file">+<small>${t("up")}</small></button><button class="pb" data-act="apply">${t("apply")}</button></div></div>`,
    "wide",
  );
  pvUpdate();
}
/** Ventana 'Cambiar idioma': aplica el idioma elegido al instante. */
function langScreen() {
  panel(
    hd(t("sel"), 1) +
      [
        ["ca", "Català"],
        ["es", "Castellano"],
        ["en", "English"],
        ["mc", "Minecraftiano"],
      ]
        .map(
          ([k, n]) =>
            `<button class="row ${k == lang ? "sel" : ""}" data-act="setlang" data-id="${k}"><span style="width:40px;height:28px;border:2px solid var(--dk);display:block;flex:none">${FL[k].replace("<svg", '<svg style="width:100%;height:100%;display:block" preserveAspectRatio="none" shape-rendering="crispEdges"')}</span><span>${n}</span><span class="g">›</span></button>`,
        )
        .join(""),
  );
}
/** Ventana 'Créditos' con los enlaces a las redes sociales. */
function credScreen() {
  const R = [
    ["GitHub", "ContactAlexey", "https://github.com/ContactAlexey"],
    ["YouTube", "@AlexeyTechSec", "https://www.youtube.com/@AlexeyTechSec"],
    ["Instagram", "@alexeytechsec", "https://www.instagram.com/alexeytechsec/"],
    ["TikTok", "@alexeytechsec", "https://www.tiktok.com/@alexeytechsec"],
  ];
  panel(
    hd(t("cred"), 1) +
      `<div class="cr">${t("by")}<b>Alexey Tenllado León</b><small>${t("free")}</small></div><p>${t("follow")}</p>` +
      R.map(
        ([n, h, u]) =>
          `<a class="row" href="${u}" target="_blank" rel="noopener"><b style="width:28px;height:28px;background:var(--dk);color:#ecdcb0;display:grid;place-items:center">${n[0]}</b><span>${n}<br><small>${h}</small></span><span class="g">↗</span></a>`,
      ).join("") +
      `<p style="text-align:center">${t("thx")}</p>`,
  );
}
/** Vacía el libro y olvida el archivo asociado (el siguiente Guardar pedirá ruta). */
function newBook() {
  P = [""];
  cur = 0;
  handle = null;
  named = false;
  idb("set", null);
  fname = "Mi_libro.txt";
  render();
  setDirty(false);
  persist();
  close();
  toast(t("nbd"));
  foc(0, 0);
}
/** Acciones de los botones con atributo data-act (delegación de eventos en #ov). */
const ACT = {
  close,
  nb: () =>
    dirty
      ? panel(
          hd(t("nb"), 1) +
            `<p>${t("nbq")}</p><div class="acts"><button class="pb" data-act="donb">${t("mk")}</button><button class="pb" data-act="menu">${t("cancel")}</button></div>`,
        )
      : newBook(),
  donb: newBook,
  menu,
  bg: bgScreen,
  lang: langScreen,
  cred: credScreen,
  file: () => $("#fb").click(),
  sel: (b) => {
    if (b.dataset.id === "custom" && !tmp) return $("#fb").click();
    sel = b.dataset.id;
    pvUpdate();
  },
  apply: () => {
    bgId = sel;
    if (sel === "custom") custom = tmp;
    applyBg();
    persist();
    close();
  },
  setlang: (b) => {
    lang = b.dataset.id;
    applyLang();
    persist();
    langScreen();
  },
  doexp: doExport,
  dosave: () => {
    let n = $("#fn").value.trim() || "Mi_libro";
    if (!/\.txt$/i.test(n)) n += ".txt";
    fname = n;
    named = true;
    dl(new Blob([P.join("")], { type: "text/plain" }), n);
    close();
    done();
  },
};
// Un solo listener para todos los botones de las ventanas; clic en el fondo oscuro cierra.
ov.addEventListener("click", (e) => {
  if (e.target === ov) return close();
  const b = e.target.closest("[data-act]");
  if (b) ACT[b.dataset.act](b);
});
// En Exportar, al cambiar de formato se actualiza la extensión del nombre.
ov.addEventListener("change", (e) => {
  if (e.target.name === "f") {
    const i = $("#fn");
    i.value = i.value.replace(/\.(pdf|txt)$/i, "") + "." + e.target.value;
  }
});
// Escape cierra la ventana abierta.
addEventListener("keydown", (e) => {
  if (e.key === "Escape") close();
});
// Botón de ajustes y selector de imagen de fondo propia (se reduce a máx. 1600 px y se guarda como JPEG).
$("#gear").onclick = menu;
$("#fb").onchange = (e) => {
  const f = e.target.files[0];
  if (!f) return;
  const im = new Image();
  im.onload = () => {
    const k = Math.min(1, 1600 / im.width),
      c = document.createElement("canvas");
    c.width = im.width * k;
    c.height = im.height * k;
    c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
    tmp = c.toDataURL("image/jpeg", 0.82);
    sel = "custom";
    if ($("#pv")) pvUpdate();
  };
  im.src = URL.createObjectURL(f);
  e.target.value = "";
};
// ======================================================================
// ARRANQUE
// ======================================================================
applyLang();
render();
applyBg();
findBg().then((m) => {
  applyBg();
  if (m.length) console.warn("No encuentro: " + m.join(", "));
});
// Cuando la tipografía está cargada se vuelve a repartir el texto (las medidas dependen de ella).
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
  for (let i = 0; i < P.length; i++) {
    const c = fit(P[i]);
    if (c < P[i].length) {
      P[i + 1] = P[i].slice(c) + (P[i + 1] || "");
      P[i] = P[i].slice(0, c);
    }
  }
  render();
  setDirty(dirty);
});
// Recupera el manejador del archivo asociado al libro (si lo había) tras recargar la página.
idb("get").then((x) => {
  if (x && named) {
    handle = x;
    fname = x.name;
    setDirty(dirty);
  }
});
// Atajo Ctrl+S / Cmd+S para guardar.
addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
    e.preventDefault();
    save();
  }
});
