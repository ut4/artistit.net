/*
 * Tässä tiedostossa:
 *
 * Templatointiin liittyviä helpereitä.
 */

const ejs = require('ejs');
const {staticBaseUrl} = require('../../config.js');

/**
 * Prod-modessa korvaa ejs-templaattien include-funktion versiolla, joka palaut-
 * taa includetettavan tiedoston sisällön suoraan muistista (default-versio
 * blokkaa, readFileSync).
 */
exports.setupEjs = appMode => {
    if (appMode != 'prod') return;
    const bundledTemplates = require('./todo.js');
    ejs.fileLoader = filePath => {
        return bundledTemplates[filePath];
    };
};

/**
 * Note: käytetään frontendissä ja backendissä.
 *
 * @param {string} iconId ks. https://feathericons.com
 * @returns {string}
 */
exports.ejsFeatherSvg = function(iconId) {
    return '<svg class="feather">' +
        '<use xlink:href="' + staticBaseUrl + 'feather-sprite.svg#' +
            iconId + '"/>' +
    '</svg>';
};

/**
 * @param {string} message
 * @param {Object} res
 * @param {number?} statusCode = 400
 */
exports.renderError = (message, res, statusCode = 400) =>
    res.status(statusCode).render('common/layout-error', {message});
