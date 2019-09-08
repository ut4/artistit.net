/*
 * Tässä tiedostossa:
 *
 * express-app -instanssin luontifactory. $mode-parametrilla määritellään
 * instanssiin liitettävät featuret ('demo': lisää automaattisesti kirjautunut
 * demokäyttäjä http-pyyntöihin, 'test': disabloi sessio & enabloi cors).
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
const {ForumControllers} = require('./forum-controllers.js');

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
    } else {
        addFrontendTestEnvHandlers(app);
    }
    app.use(fileUpload({createParentPath: true}));
    app.set('views', ['./server-app', '../front']);
    app.set('view engine', 'ejs');
    if (mode == 'prod') app.use((req, res, next) => {
        if (!req.user) req.user = app.locals.user;
        next();
    }); else app.use((req, res, next) => {
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
    AuthControllers.registerMiddleware(app);
    //
    AppControllers.registerRoutes(app, config.baseUrl);
    AuthControllers.registerRoutes(app, config.baseUrl);
    ArtistsControllers.registerRoutes(app, config.baseUrl);
    SongsControllers.registerRoutes(app, config.baseUrl);
    ForumControllers.registerRoutes(app, config.baseUrl);
    //
    return app;
};

function addFrontendTestEnvHandlers(app) {
    app.use((_req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers',
                   'Origin, X-Requested-With, Content-Type, Accept');
        next();
    });
    app.get('/template/:name', (req, res, next) => {
        res.sendFile(__dirname + '/' + req.params.name + '.ejs', err => {
            if (err) next(err);
        });
    });
}
