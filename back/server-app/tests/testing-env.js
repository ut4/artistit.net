/*
 * Tässä tiedostossa:
 *
 * Testien oma API; luo ja konfiguroi testiympäristön (express-app,
 * tietokantayhteys) testeille.
 */

/* eslint-disable no-console */
const {SelfCleaningDb} = require('./test-db.js');

const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function (moduleId) {
    let out = originalRequire.apply(this, arguments);
    if (moduleId.endsWith('db.js')) {
        out.Db = SelfCleaningDb;
    }
    return out;
};

////////////////////////////////////////////////////////////////////////////////

const config = require('../../config.js');
const {makeApp} = require('../app.js');
const {makeDb} = require('../db.js');
const testData = require('./test-data.js');

/*
 * Wräpperi testeille; jokainen testi luo uuden instanssin tästä luokasta, ja
 * luokka hoitaa kaiken muun (luo vain yhden express-app:n ja SelfCleaningDb:n).
 */
class HttpTestCtx {
    constructor() {
        HttpTestCtx.callCount += 1;
        if (HttpTestCtx.timer) clearTimeout(HttpTestCtx.timer);
        if (!HttpTestCtx.dbSingleton) {
            HttpTestCtx.dbSingleton = makeDb();
        }
        if (!HttpTestCtx.appSingleton) {
            HttpTestCtx.appSingleton = makeApp('test', config);
            HttpTestCtx.serverSingleton = HttpTestCtx.appSingleton.listen(4000);
        }
    }
    tearDown() {
        if (--HttpTestCtx.callCount <= 0) HttpTestCtx.timer = setTimeout(() => {
            HttpTestCtx.dbSingleton.cleanTestData()
                .catch((err) => {
                    console.error('at tearDown', err);
                })
                .finally(() => {
                    HttpTestCtx.serverSingleton.close();
                    process.exit();
                });
        }, 200);
        return Promise.resolve(null);
    }
    getApp() {
        return HttpTestCtx.appSingleton;
    }
    getDb() {
        return HttpTestCtx.dbSingleton;
    }
}
HttpTestCtx.appSingleton = null;
HttpTestCtx.serverSingleton = null;
HttpTestCtx.dbSingleton = null;
HttpTestCtx.callCount = 0;
HttpTestCtx.timer = null;

function insertTestData() {
    const a = testData.artist;
    return HttpTestCtx.dbSingleton.getPool()
        .query(
            'insert into artists values (?,?,?,?,?,?,?)',
            [a.id, a.name, a.tagline, a.coverPhoto, a.widgets, a.createdAt, a.userId]
        );
}

function makeHttpTestCtx() {
    const isFirstCall = HttpTestCtx.dbSingleton == null;
    const out = new HttpTestCtx(); // avaa kantayhteyden ja luo express-appin
                                   // automaattisesti
    return (!isFirstCall ? Promise.resolve() : insertTestData())
        .then(() => out)
        .catch(err => {
            console.error('at makeHttpTestCtx', err);
            out.tearDown();
        });
}

exports.makeHttpTestCtx = makeHttpTestCtx;
