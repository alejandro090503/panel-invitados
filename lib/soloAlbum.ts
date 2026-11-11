// Eventos cuyo cliente solo usa el álbum de fotos (sin gestión de invitados).
// Al entrar con su contraseña van directo a /<slug>/album y no ven la lista.
const SOLO_ALBUM = ['boda-barbara-y-esteban', 'xv-lila-sanchez-salcedo']

export const esSoloAlbum = (slug: string) => SOLO_ALBUM.includes(slug)
