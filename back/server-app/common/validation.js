/*
 * Tässä tiedostossa:
 *
 * Input-datan validointiin liittyviä helpereitä.
 */

/**
 * @param {string} id
 * @returns {bool}
 */
exports.isValidFireId = id => /-[a-zA-Z0-9_-]{19}/.test(id);
