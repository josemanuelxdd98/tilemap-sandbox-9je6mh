/* ==========================================================================
   DATOS DEL REGALO  (convertido desde datos.md)
   --------------------------------------------------------------------------
   Aquí puedes cambiar textos, fechas, fotos y la apariencia de los personajes.
   Se usa un archivo .js (y no se lee datos.md directamente) para que el juego
   funcione al abrir index.html con doble clic, sin servidor.
   ========================================================================== */
window.DATOS = {
  titulo: "Nuestro primer año",
  dedicatoria: "Para mi Anita banana",

  /* ---- Personajes (pixel art dibujado con código) ----
     En datos.md "lentes/accesorios" quedó sin llenar. Ahora: Ana con lentes
     y Mani con lentes redondos y sin barba. Cambia true/false para ajustar
     (lentes: true/false · barba: true/false).                              */
  personajes: {
    ella: {
      nombre: "Ana",
      apodo: "Anita banana",
      pelo: "#241b2f",          // negro
      largoPelo: "medio",       // "medio" (hasta el pecho) | "corto"
      lentes: true,
      piel: "#e3ab83",
      ropa: "#a46fd9"           // morado, su color favorito
    },
    el: {
      nombre: "Mani",
      pelo: "#1e1a24",          // negro, corto
      largoPelo: "corto",
      lentes: true,
      barba: false,
      piel: "#d9a074",
      ropa: "#4f7fb8"
    }
  },

  /* ---- Recuerdos: uno por nivel, en orden ----
     foto: nombre del archivo SIN extensión dentro de /fotos
           (el juego prueba .jpeg, .jpg, .png y .webp).
     escenario: define el decorado del nivel (ver js/escenarios.js).
     En el texto, "<3" se muestra como corazón.                              */
  recuerdos: [
    {
      titulo: "Fui por Ana Banana a La Sombra",
      fecha: "10 de octubre de 2025",
      lugar: "La Sombra, Veracruz",
      texto: "Fui por Anita banana a su escuelita en la sierra, aunque fue un camino muy largo, los dos lo disfrutamos mucho.",
      foto: "recuerdo1",
      escenario: "sierra"
    },
    {
      titulo: "Primera cita como novios",
      fecha: "30 de noviembre de 2025",
      lugar: "Coatepec, Veracruz",
      texto: "Tuvimos una de nuestras primeras citas como novios formalmente <3",
      foto: "recuerdo2",
      escenario: "coatepec"
    },
    {
      titulo: "Nuestro primer mes",
      fecha: "19 de diciembre de 2025",
      lugar: "La Joya, Veracruz",
      texto: "Fuimos a celebrar a la casa de los abuelos nuestro primer mes como novios.",
      foto: "recuerdo3",
      escenario: "joya"
    },
    {
      titulo: "Nuestra primera noche durmiendo juntos",
      fecha: "20 de enero de 2026",
      lugar: "La Sombra, Veracruz",
      texto: "Fue la primera vez que dormimos juntos, en La Sombra, cuando te acompañé por una semana a tu escuelita.",
      foto: "recuerdo4",
      escenario: "noche"
    },
    {
      titulo: "Nuestro primer San Valentín",
      fecha: "14 de febrero de 2026",
      lugar: "Acajete, Veracruz",
      texto: "Celebramos nuestro primer 14 de febrero como novios.",
      foto: "recuerdo5",
      escenario: "acajete"
    },
    {
      titulo: "El primer gran viaje",
      fecha: "28 de marzo de 2026",
      lugar: "Puebla, Puebla",
      texto: "Fue el primer viaje que hicimos juntos.",
      foto: "recuerdo6",
      escenario: "puebla"
    },
    {
      titulo: "Tu primer cumpleaños juntos",
      fecha: "30 de mayo de 2026",
      lugar: "La Joya, Veracruz",
      texto: "Fue la primera vez que celebramos un cumpleaños tuyo, mi amor <3",
      foto: "recuerdo7",
      escenario: "cumple"
    },
    {
      titulo: "Mi primer cumpleaños juntos",
      fecha: "28 de junio de 2026",
      lugar: "Emiliano Zapata, Veracruz",
      texto: "Fue la primera vez que celebramos un cumpleaños mío, mi vidota.",
      foto: "recuerdo8",
      escenario: "zapata"
    }
  ],

  /* ---- Detalles que le gustan (easter eggs) ---- */
  detalles: {
    perro: "Rolly",
    cancion: { titulo: "A dónde vamos", artista: "Morat" },
    apodoElla: "Anita banana",
    apodoEl: "Mani"
  },

  /* ---- Nivel final ---- */
  final: {
    titulo: "¡Feliz aniversario!",
    subtitulo: "Nuestro primer año"
  },

  /* ---- Carta final ----
     Un párrafo por elemento. **negritas** y ❤️ se respetan.                */
  carta: [
    "**Mi banana hermosa:**",
    "Hoy cumplimos nuestro primer año juntos, y no puedo evitar sonreír al pensar en todo lo que hemos vivido. Un año de risas, abrazos, aprendizajes, momentos difíciles y, sobre todo, mucho amor.",
    "Si algo me ha enseñado este tiempo es que amar no significa tener una historia perfecta, sino elegirnos incluso cuando las cosas no son sencillas. Y yo, mi amor, te sigo eligiendo a ti.",
    "Gracias por llegar a mi vida, por compartir tus sueños conmigo y por permitirme imaginar un futuro a tu lado. No sé exactamente qué nos depare la vida, pero sí sé que quiero seguir descubriéndolo contigo.",
    "**Feliz primer aniversario, mi lobita hermosa. Que este sea apenas el primero de muchos años construyendo nuestra historia.**",
    "Te amo, mi banana. ❤️",
    "**Con todo mi amor, Manu.**"
  ],

  /* ---- Regalo físico (opcional) ----
     Si hay regalo, escribe aquí la pista y aparecerá al final de la carta.
     En datos.md decía "No hay", así que se deja vacío.                      */
  regaloFisico: ""
};
