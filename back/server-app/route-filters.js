/*
 * Tässä tiedostossa:
 *
 * HTTP-pyynnön validointiin liittyviä helpereitä.
 */

const {renderError} = require('./templating.js');

function ensureIsLoggedIn() {
    return (req, res, next) => {
        if (!req.isAuthenticated || !req.isAuthenticated()) {
            renderError('!isAuthenticated()', res, 403);
            return;
        }
        next();
    };
}

function ensureHasContentType(contentType = 'application/x-www-form-urlencoded') {
    return (req, res, next) => {
        if (!req.headers['content-type'].startsWith(contentType + ';')) {
            renderError('expected ' + contentType + ' content-type', res, 406);
            return;
        }
        next();
    };
}

exports.ensureIsLoggedIn = ensureIsLoggedIn;
exports.ensureHasContentType = ensureHasContentType;
