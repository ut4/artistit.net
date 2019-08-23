/*
 * Tässä tiedostossa:
 *
 * Tietokantawräpperi, joka käyttää vain yhtä connectionia, joka lopuksi kumoaa
 * kaikki sillä tehdyt kyselyt (rollback).
 */

const {Db} = require('../db.js');

let connSingleton = null;

class SelfCleaningDb extends Db {
    getPool() {
        return {query: (...args) => {
            return new Promise((resolve) => {
                if (connSingleton) {
                    resolve(connSingleton);
                } else {
                    super.getPool().getConnection().then(conn => {
                        connSingleton = conn;
                        return connSingleton.beginTransaction();
                    }).then(() => {
                        resolve(connSingleton);
                    });
                }
            }).then(conn => {
                return conn.query(...args);
            });
        }};
    }
    /**
     * @returns {Promise}
     */
    cleanTestData() {
        return connSingleton.rollback();
    }
}

exports.SelfCleaningDb = SelfCleaningDb;
