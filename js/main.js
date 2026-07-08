/* ============================================================
   ACADEMIA SONORA — Carga dinámica de contenido desde /data
   Cada sección lee su propio fichero JSON:
   - data/inicio.json     → identidad, logos institucionales, canal
   - data/capitulos.json  → capítulos del podcast (miniaturas + enlaces)
   - data/equipo.json     → quiénes somos, misión, visión, integrantes
   - data/galeria.json    → fotos de la galería
   ============================================================ */
(function () {
  "use strict";

  /* ---------- Utilidades ---------- */

  // Crea elementos de forma segura (sin innerHTML con datos externos)
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === "text") { node.textContent = attrs[k]; }
        else if (k === "class") { node.className = attrs[k]; }
        else { node.setAttribute(k, attrs[k]); }
      });
    }
    (children || []).forEach(function (c) { if (c) node.appendChild(c); });
    return node;
  }

  function cargarJSON(ruta) {
    return fetch(ruta).then(function (r) {
      if (!r.ok) throw new Error("No se pudo cargar " + ruta);
      return r.json();
    });
  }

  function mostrarAviso(contenedor, ruta) {
    if (!contenedor) return;
    contenedor.appendChild(el("div", {
      class: "aviso-datos",
      text: "No se pudo cargar " + ruta + ". Si abriste el archivo directamente, usa un servidor local (por ejemplo, la extensión Live Server) o publica el sitio en GitHub Pages."
    }));
  }

  // Marcador de posición dorado si falta una imagen
  var PLACEHOLDER =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      "<svg xmlns='http://www.w3.org/2000/svg' width='640' height='360'>" +
      "<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>" +
      "<stop offset='0' stop-color='#e07b2c'/><stop offset='1' stop-color='#3b1f12'/>" +
      "</linearGradient></defs>" +
      "<rect width='640' height='360' fill='url(#g)'/>" +
      "<text x='320' y='190' font-family='sans-serif' font-size='30' fill='#fbefd4' text-anchor='middle'>🎙️ Academia Sonora</text>" +
      "</svg>"
    );

  function imgConRespaldo(src, alt, clase) {
    var img = el("img", { src: src, alt: alt || "", loading: "lazy" });
    if (clase) img.className = clase;
    img.addEventListener("error", function () {
      img.src = PLACEHOLDER;
    }, { once: true });
    return img;
  }

  /* ---------- Onda sonora del hero ---------- */
  var wave = document.getElementById("waveform");
  if (wave) {
    var barras = 56;
    for (var i = 0; i < barras; i++) {
      var s = document.createElement("span");
      var altura = 18 + Math.round(Math.abs(Math.sin(i * 0.55)) * 62);
      s.style.height = altura + "px";
      s.style.animationDelay = (i * 0.07) + "s";
      s.style.animationDuration = (1.1 + (i % 5) * 0.14) + "s";
      wave.appendChild(s);
    }
  }

  /* ---------- Año actual en el pie ---------- */
  var anio = document.getElementById("anio-actual");
  if (anio) anio.textContent = new Date().getFullYear();

  /* ---------- SECCIÓN INICIO (identidad + logos) ---------- */
  cargarJSON("data/inicio.json").then(function (d) {
    var desc = document.getElementById("hero-descripcion");
    if (desc && d.descripcion) desc.textContent = d.descripcion;

    ["btn-youtube-nav", "btn-youtube-capitulos", "btn-youtube-footer"].forEach(function (id) {
      var b = document.getElementById(id);
      if (b && d.canalYouTube) b.href = d.canalYouTube;
    });

    var cont = document.getElementById("logos-institucionales");
    if (cont && Array.isArray(d.logos)) {
      d.logos.forEach(function (logo) {
        var img = el("img", { src: logo.imagen, alt: logo.alt || logo.nombre });
        img.addEventListener("error", function () {
          var pendiente = el("div", { class: "logo-pendiente", text: "Sube aquí:\n" + logo.imagen });
          img.replaceWith(pendiente);
        }, { once: true });
        cont.appendChild(el("figure", null, [
          img,
          el("figcaption", { text: logo.nombre })
        ]));
      });
    }
  }).catch(function () {
    mostrarAviso(document.getElementById("logos-institucionales"), "data/inicio.json");
  });

  /* ---------- SECCIÓN CAPÍTULOS ---------- */
  cargarJSON("data/capitulos.json").then(function (d) {
    var grid = document.getElementById("capitulos-grid");
    if (!grid || !Array.isArray(d.capitulos)) return;

    d.capitulos.forEach(function (cap) {
      var thumb = el("div", { class: "capitulo__thumb" }, [
        imgConRespaldo(cap.miniatura, "Miniatura del capítulo " + cap.numero + ": " + cap.titulo),
        el("div", { class: "capitulo__play", "aria-hidden": "true" }, [el("span", { text: "▶" })]),
        el("span", { class: "capitulo__num", text: "EP. " + String(cap.numero).padStart(2, "0") }),
        cap.duracion ? el("span", { class: "capitulo__dur", text: cap.duracion }) : null
      ]);

      var body = el("div", { class: "capitulo__body" }, [
        el("h3", { class: "capitulo__title", text: cap.titulo }),
        el("p", { class: "capitulo__desc", text: cap.descripcion }),
        el("span", { class: "capitulo__link", text: (d.textoBoton || "Ver en YouTube") + " →" })
      ]);

      grid.appendChild(el("a", {
        class: "capitulo",
        href: cap.enlace,
        target: "_blank",
        rel: "noopener",
        "aria-label": "Ver el capítulo " + cap.numero + " en YouTube: " + cap.titulo
      }, [thumb, body]));
    });
  }).catch(function () {
    mostrarAviso(document.getElementById("capitulos-grid"), "data/capitulos.json");
  });

  /* ---------- SECCIÓN EQUIPO ---------- */
  cargarJSON("data/equipo.json").then(function (d) {
    var qs = document.getElementById("quienes-somos-texto");
    var mi = document.getElementById("mision-texto");
    var vi = document.getElementById("vision-texto");
    if (qs) qs.textContent = d.quienesSomos || "";
    if (mi) mi.textContent = d.mision || "";
    if (vi) vi.textContent = d.vision || "";

    var grid = document.getElementById("integrantes-grid");
    if (!grid || !Array.isArray(d.integrantes)) return;

    d.integrantes.forEach(function (p) {
      grid.appendChild(el("article", { class: "integrante" }, [
        imgConRespaldo(p.foto, "Fotografía de " + p.nombre, "integrante__foto"),
        el("h3", { text: p.nombre }),
        el("p", { class: "integrante__rol", text: p.rol }),
        el("p", { class: "integrante__desc", text: p.descripcion })
      ]));
    });
  }).catch(function () {
    mostrarAviso(document.getElementById("integrantes-grid"), "data/equipo.json");
  });

  /* ---------- SECCIÓN GALERÍA ---------- */
  cargarJSON("data/galeria.json").then(function (d) {
    var desc = document.getElementById("galeria-descripcion");
    if (desc && d.descripcion) desc.textContent = d.descripcion;

    var grid = document.getElementById("galeria-grid");
    if (!grid || !Array.isArray(d.fotos)) return;

    d.fotos.forEach(function (f) {
      grid.appendChild(el("figure", { class: "galeria__item" }, [
        imgConRespaldo(f.imagen, f.titulo),
        el("figcaption", { class: "galeria__caption" }, [
          el("strong", { text: f.titulo }),
          el("span", { text: f.descripcion })
        ])
      ]));
    });
  }).catch(function () {
    mostrarAviso(document.getElementById("galeria-grid"), "data/galeria.json");
  });
})();
