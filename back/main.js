const app = require('express')();
const session = require('express-session');
const bodyParser = require('body-parser');
const config = require('./config.js');
const {AuthControllers} = require('./auth-controllers.js');
const {ArtistsControllers} = require('./artists-controllers.js');
const {SongMetasControllers} = require('./song-metas-controllers.js');

app.use(bodyParser.json());
app.use(session({secret: config.sessionSecret, resave: true, saveUninitialized: true}));
AuthControllers.registerMiddleware(app);

AuthControllers.registerRoutes(app);
SongMetasControllers.registerRoutes(app);
ArtistsControllers.registerRoutes(app);

app.listen(3000);
