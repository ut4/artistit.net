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
const {ejsFeatherSvg, setupEjs} = require('./common/templating.js');
const {SiteControllers} = require('./site/site-controllers.js');
const {AuthControllers} = require('./auth/auth-controllers.js');
const {ArtistsControllers} = require('./artist/artists-controllers.js');
const {SongsControllers} = require('./song/songs-controllers.js');
const {ForumControllers} = require('./forum/forum-controllers.js');

/**
 * @param {string} mode 'prod'|'dev'|'demo'|'test'
 * @param {Object} config
 * @returns {Express}
 */
exports.makeApp = (mode, config) => {
    config.appMode = mode;
    if (mode == 'prod' || mode == 'dev') configureProdEnv(app, config);
    else if (mode == 'demo' || mode == 'test') configureDemoEnv(app, config);
    else throw new Error('Virheellinen env-mode. Validit: prod, dev, demo, test');
    //
    setupEjs(mode);
    app.use(bodyParser.urlencoded({extended: true}));
    app.use(fileUpload({createParentPath: true}));
    app.set('views', ['./server-app', '../front']);
    app.set('view engine', 'ejs');
    app.set('view options', {outputFunctionName: 'print'});
    //
    app.locals.baseUrl = config.baseUrl;
    app.locals.staticBaseUrl = config.staticBaseUrl;
    app.locals.featherSvg = ejsFeatherSvg;
    //
    AuthControllers.registerMiddleware(app);
    //
    SiteControllers.registerRoutes(app, config.baseUrl);
    AuthControllers.registerRoutes(app, config.baseUrl);
    ArtistsControllers.registerRoutes(app, config.baseUrl);
    SongsControllers.registerRoutes(app, config.baseUrl);
    ForumControllers.registerRoutes(app, config.baseUrl);
    //
    return app;
};

function configureProdEnv(app, config) {
    app.use(session({secret: config.sessionSecret, resave: true,
        saveUninitialized: true}));
}

function configureDemoEnv(app, config) {
    app.use((req, res, next) => {
        req.user = app.locals.user;
        req.isAuthenticated = () => true;
        next();
    });
    app.locals.user = {id: config.demoUserId};
}
