/**
 * Tässä tiedostossa:
 *
 * artistit.net applikaation entry point i.e. `node main.js`.
 */

const app = require('express')();
const session = require('express-session');
const bodyParser = require('body-parser');
const config = require('../config.js');
const {AppControllers} = require('./app-controllers.js');
const {AuthControllers} = require('./auth-controllers.js');
const {ArtistsControllers} = require('./artists-controllers.js');

app.use(bodyParser.urlencoded({extended: true}));
app.use(session({secret: config.sessionSecret, resave: true, saveUninitialized: true}));
app.set('views', './server-app/');
app.set('view engine', 'ejs');
app.locals.user = {};
app.locals.baseUrl = config.baseUrl;
app.locals.staticBaseUrl = config.staticBaseUrl;
app.locals.featherSvg = iconId => '<svg className="feather">' +
    '<use xlink:href="' + config.staticBaseUrl + '/feather-sprite.svg#' + iconId + '"/>' +
'</svg>';

AuthControllers.registerMiddleware(app);

AppControllers.registerRoutes(app, config.baseUrl);
AuthControllers.registerRoutes(app, config.baseUrl);
ArtistsControllers.registerRoutes(app, config.baseUrl);

app.listen(3000);
