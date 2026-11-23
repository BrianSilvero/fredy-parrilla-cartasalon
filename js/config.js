/* Configuración de la carta del salón.
   Pasar de la demo a producción es cambiar este archivo.
   Los enlaces vacíos ('') no se muestran en el panel de Contacto. */
'use strict';

const CONFIG = {
  /* Web oficial. Sin dominio todavía: en local apunta a la carpeta hermana.
     Al publicar, reemplazar por la dirección real (por ejemplo https://fredy.com.ar/). */
  webUrl: '../Parrilla Fredy - Pagina Web/index.html',

  /* Páginas de la web a las que se puede saltar desde el panel. */
  webPaginas: {
    reservar: 'reservar.html',
    shows: 'noches-de-show.html',
  },

  /* Reseña: falta el enlace directo del perfil de empresa de Google.
     Mientras tanto abre la ficha de Google Maps, donde también se puede reseñar. */
  resenaUrl: NEGOCIO.mapaFicha,
  instagram: NEGOCIO.instagram,
  instagramUsuario: '@fredyrestaurantparrilla',
  whatsapp: NEGOCIO.whatsapp,
  whatsappTexto: NEGOCIO.whatsappTexto,
  telefono: NEGOCIO.telefono,

  claves: { idioma: 'fredy.idioma', mesa: 'fredy.mesa' },
};

/* Une la dirección de la web con una página suya. */
const urlWeb = (pagina = '') => {
  const base = CONFIG.webUrl.replace(/index\.html$/, '');
  return pagina ? base + pagina : CONFIG.webUrl;
};
