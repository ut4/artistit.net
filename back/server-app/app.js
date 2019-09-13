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
const {ejsFeatherSvg} = require('./common/templating.js');
const {SiteControllers} = require('./site/site-controllers.js');
const {AuthControllers} = require('./auth/auth-controllers.js');
const {ArtistsControllers} = require('./artist/artists-controllers.js');
const {SongsControllers} = require('./song/songs-controllers.js');
const {ForumControllers} = require('./forum/forum-controllers.js');

/**
 * @param {string} mode 'prod'|'demo'|'test'
 * @param {Object} config
 * @returns {Express}
 */
exports.makeApp = (mode, config) => {
    config.appMode = mode;
    if (mode == 'prod') configureProdEnv(app, config);
    else if (mode == 'demo') configureDemoEnv(app, config);
    else if (mode == 'test') configureTestEnv(app, config);
    else throw new Error('Virheellinen env-mode. Validit: prod, demo, test');
    //
    app.use(bodyParser.urlencoded({extended: true}));
    app.use(fileUpload({createParentPath: true}));
    app.set('views', ['./server-app', '../front']);
    app.set('view engine', 'ejs');
    app.set('view options', {outputFunctionName: 'print'});
    app.get(config.baseUrl + 'widget-templates.js', (_req, res) => {
        res.type('text/javascript').send(bundleReactTemplates(res));
    });
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
    app.use((req, res, next) => {
        if (!req.user) req.user = app.locals.user;
        next();
    });
    app.locals.user = {};
}

function configureDemoEnv(app, config) {
    app.use((req, res, next) => {
        req.user = app.locals.user;
        req.isAuthenticated = () => true;
        next();
    });
    app.locals.user = {id: config.demoUserId};
}

function configureTestEnv(app, config) {
    configureDemoEnv(app, config);
    app.use((_req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers',
                   'Origin, X-Requested-With, Content-Type, Accept');
        next();
    });
    app.get('/template', (req, res, next) => {
        res.sendFile(__dirname + '/' + req.query.name + '.ejs', err => {
            if (err) next(err);
        });
    });
}

/**
 * Note: tämä funktio on käytössä vain dev-ympäristössä, prodissä templaatit on
 * bundlattu .js-tiedostoon ennakkoon.
 */
function bundleReactTemplates() {
    const fs = require('fs');
    const featherSvg = require('./common/templating.js').reactFeatherSvg;
    const {staticBaseUrl} = require('../config.js');
    return '(function() {\n' +
        'var $el = preact.createElement;\n' +
        'var staticBaseUrl = \'' + staticBaseUrl + '\';\n' +
        'var featherSvg = ' + featherSvg + ';\n' +
        'var templates = {};\n' +
        [
            ['artist/wall-widget-info-box.js', 'InfoBox'],
            ['artist/wall-widget-twitter-feed.js', 'TwitterFeed'],
        ].map(([fileName, reactClsName]) => {
            const nodeCode = fs.readFileSync(`${__dirname}/${fileName}`,
                                             {encoding:'utf-8'});
            const begin = nodeCode.indexOf('function ' + reactClsName);
            const beforeEndJs = 'exports.' + reactClsName + ' = ' + reactClsName + ';';
            const end = nodeCode.indexOf(beforeEndJs);
            const jsStrippedFromNodeStuff = nodeCode.substr(begin, end - begin);
            const dashed = reactClsName.match(/[A-Z][a-z]+/g)
                .map(c => c.toLowerCase())
                .join('-');
            return jsStrippedFromNodeStuff +
                   'templates[\'' + dashed + '\'] = ' + reactClsName + ';\n' +
                   '// ----\n\n';
        }).join('') +
    ';\ntemplates.featherSvg = featherSvg' +
    ';\nwindow.artistit.widgetTemplates = templates;\n}())';
}
