/*
 * Tässä tiedostossa:
 *
 * artistit.net -applikaation installeri. Olettaa että host-koneessa pyörii
 * MariaDB/MySQL-serveri, sinne on luotu tietokanta ja sen tiedot on täytetty
 * config.js:ään. Käyttö:
 *
 * `node install.js all` (luo tietokannan jonka jälkeen täyttää sen esimerkkidatalla)
 * `node install.js step1` (luo pelkästään tietokannan)
 * `node install.js step2` (kirjoittaa pelkästään esimerkkidatan)
 */

const {execSync} = require('child_process');
const config = require('./config.js');

const step = process.argv[2];
const mysqlPath = 'E:/ProgramData/xampp/mysql/bin/mysql';
const connectCmd = mysqlPath +
    ' -u' + config.dbUser +
    ' -p' + config.dbPassword +
    ' -D' + config.dbDatabase;

if (step == 'step1' || step == 'all') step1();
if (step == 'step2' || step == 'all') step2();

function step1() {
    exec(connectCmd + ' < schema.mariadb.sql', 'Creating database schema');
}

function step2() {
    exec(connectCmd + ' < example-data.mariadb.sql', 'Inserting test data');
}

////////////////////////////////////////////////////////////////////////////////

function exec(cmd, message) {
    /* eslint-disable no-console */
    console.log(message + ' ...');
    execSync(cmd, {stdio: 'inherit'});
    console.log('Done.');
}