/*
 * Tässä tiedostossa:
 *
 * Templatointiin liittyviä helpereitä.
 */

const $el = require('preact').createElement;
const {staticBaseUrl} = require('../../config.js');

/**
 * @param {string} iconId ks. https://feathericons.com
 * @returns {string}
 */
exports.reactFeatherSvg = function(iconId) {
    return $el('svg', {className: 'feather'},
        $el('use', {'xlink:href': staticBaseUrl + 'feather-sprite.svg#' + iconId})
    );
};
exports.ejsFeatherSvg = iconId => '<svg class="feather">' +
    '<use xlink:href="' + staticBaseUrl + 'feather-sprite.svg#' +
        iconId + '"/>' +
'</svg>';

/**
 * @param {string} message
 * @param {Object} res
 * @param {number?} statusCode = 400
 */
exports.renderError = (message, res, statusCode = 400) =>
    res.status(statusCode).render('common/layout-error', {message});
