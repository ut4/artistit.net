/*
 * Tässä tiedostossa:
 *
 * Autentikointiin liittyviä helpereitä.
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

exports.ensureIsLoggedIn = ensureIsLoggedIn;
