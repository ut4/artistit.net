/*
 * Tässä tiedostossa:
 *
 * artistit.net -applikaation entry point i.e. `node main.js`.
 */

const {makeApp} = require('./app.js');
const config = require('../config.js');

const app = makeApp(process.argv[2] || 'prod', config);
app.listen(3000);
