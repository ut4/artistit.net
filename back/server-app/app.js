/*
 * Tässä tiedostossa:
 *
 * express-app -instanssin luontifactory. $mode-parametrilla määritellään mitä
 * featureja instanssiin liitetään ('demo': lisää automaattisesti kirjautunut
 * demokäyttäjä http-pyyntöihin, 'test': disabloi sessio).
 */
process.env.TZ = 'Europe/Helsinki';

const app = require('express')();
const session = require('express-session');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const {AppControllers} = require('./app-controllers.js');
const {AuthControllers} = require('./auth-controllers.js');
const {ArtistsControllers} = require('./artists-controllers.js');
const {SongsControllers} = require('./songs-controllers.js');

/**
 * @param {string} mode 'prod'|'demo'|'test'
 * @param {Object} config
 * @returns {Express}
 */
exports.makeApp = (mode, config) => {
    app.use(bodyParser.urlencoded({extended: true}));
    if (mode != 'test') {
        app.use(session({secret: config.sessionSecret, resave: true,
                         saveUninitialized: true}));
    }
    app.use(fileUpload({createParentPath: true}));
    app.set('views', './server-app/');
    app.set('view engine', 'ejs');
    if (mode != 'prod') app.use((req, res, next) => {
        req.user = app.locals.user;
        req.isAuthenticated = () => true;
        next();
    });
    //
    app.locals.baseUrl = config.baseUrl;
    app.locals.staticBaseUrl = config.staticBaseUrl;
    app.locals.featherSvg = iconId => '<svg class="feather">' +
        '<use xlink:href="' + config.staticBaseUrl + 'feather-sprite.svg#' +
            iconId + '"/>' +
    '</svg>';
    app.locals.user = mode == 'prod' ? {} : {id: config.testUserId};
    //
    AuthControllers.registerMiddleware(app/*, services*/);
    //
    AppControllers.registerRoutes(app/*, services*/, config.baseUrl);
    AuthControllers.registerRoutes(app/*, services*/, config.baseUrl);
    ArtistsControllers.registerRoutes(app/*, services*/, config.baseUrl);
    SongsControllers.registerRoutes(app/*, services*/, config.baseUrl);
    //
    return app;
};
