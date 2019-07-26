const {apiCommons} = require('./api-commons.js');

function ensureIsLoggedIn() {
    return (req, res, next) => {
        if (!req.isAuthenticated || !req.isAuthenticated()) {
            apiCommons.sendError(res, '!isAuthenticated()', 403);
            return;
        }
        next();
    };
}

exports.ensureIsLoggedIn = ensureIsLoggedIn;
