/*
 * Tässä tiedostossa:
 *
 * Tietokantayhteys.
 */

const mariadb = require('mariadb');
const config = require('./config.js');

let pool = mariadb.createPool({
    host: config.dbHost,
    database: config.dbDatabase,
    user: config.dbUser,
    password: config.dbPassword,
});

class Db {
    /**
     * @returns {Pool}
     * @access public
     */
    getPool() {
        return pool;
    }
}

exports.Db = Db;
