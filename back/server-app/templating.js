/*
 * Tässä tiedostossa:
 *
 * Templatointiin liittyviä helpereitä.
 */

/**
 * @param {string} message
 * @param {Object} res
 * @param {number?} statusCode = 400
 */
exports.renderError = (message, res, statusCode = 400) =>
    res.status(statusCode).render('layout-error', {message});
