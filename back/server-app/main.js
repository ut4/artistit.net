/*
 * Tässä tiedostossa:
 *
 * artistit.net -applikaation entry point i.e. `node main.js`.
 */

process.env.TZ = 'Europe/Helsinki';

const app = require('express')();
const session = require('express-session');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const config = require('../config.js');
const {AppControllers} = require('./app-controllers.js');
const {AuthControllers} = require('./auth-controllers.js');
const {ArtistsControllers} = require('./artists-controllers.js');
const {SongsControllers} = require('./songs-controllers.js');
const useDemoMode = process.argv[2] == 'demo';

app.use(bodyParser.urlencoded({extended: true}));
app.use(session({secret: config.sessionSecret, resave: true, saveUninitialized: true}));
app.use(fileUpload({createParentPath: true}));
app.set('views', './server-app/');
app.set('view engine', 'ejs');
if (useDemoMode) app.use((req, res, next) => {
    req.user = app.locals.user;
    req.isAuthenticated = () => true;
    next();
});

app.locals.baseUrl = config.baseUrl;
app.locals.staticBaseUrl = config.staticBaseUrl;
app.locals.featherSvg = iconId => '<svg className="feather">' +
    '<use xlink:href="' + config.staticBaseUrl + '/feather-sprite.svg#' + iconId + '"/>' +
'</svg>';
app.locals.user = !useDemoMode ? {} : {id: '-abcdefghijklmnopqrs'};

AuthControllers.registerMiddleware(app);

AppControllers.registerRoutes(app, config.baseUrl);
AuthControllers.registerRoutes(app, config.baseUrl);
ArtistsControllers.registerRoutes(app, config.baseUrl);
SongsControllers.registerRoutes(app, config.baseUrl);

app.listen(3000);
