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
const {makeDb} = require('../common/db.js');
const testData = require('./test-data.js');

/*
 * Wräpperi testeille; jokainen testi luo uuden instanssin tästä luokasta, ja
 * luokka hoitaa kaiken muun (luo vain yhden express-app:n ja SelfCleaningDb:n).
 */
class TestCtx {
    constructor(useHttp) {
        TestCtx.callCount += 1;
        if (TestCtx.timer) clearTimeout(TestCtx.timer);
        if (!TestCtx.dbSingleton) {
            TestCtx.dbSingleton = makeDb();
        }
        if (useHttp && !TestCtx.appSingleton) {
            TestCtx.appSingleton = makeApp('test', config);
            TestCtx.serverSingleton = TestCtx.appSingleton.listen(4000);
        }
    }
    tearDown() {
        if (--TestCtx.callCount <= 0) TestCtx.timer = setTimeout(() => {
            TestCtx.dbSingleton.cleanTestData()
                .catch((err) => {
                    console.error('at tearDown', err);
                })
                .finally(() => {
                    TestCtx.serverSingleton.close();
                    process.exit();
                });
        }, 200);
        return Promise.resolve(null);
    }
    getApp() {
        return TestCtx.appSingleton;
    }
    getDb() {
        return TestCtx.dbSingleton;
    }
}
TestCtx.appSingleton = null;
TestCtx.serverSingleton = null;
TestCtx.dbSingleton = null;
TestCtx.callCount = 0;
TestCtx.timer = null;

function insertTestData() {
    const a = testData.artist;
    return TestCtx.dbSingleton.getPool()
        .query(
            'insert into artists values (?,?,?,?,?,?,?)',
            [a.id, a.name, a.tagline, a.coverPhoto, a.widgets, a.createdAt, a.userId]
        );
}

function makeTestCtx(useHttp) {
    const isFirstCall = TestCtx.dbSingleton == null;
    const out = new TestCtx(useHttp); // avaa kantayhteyden [ja luo express-appin
                                      // (useHttp)] automaattisesti
    return (!isFirstCall ? Promise.resolve() : insertTestData())
        .then(() => out)
        .catch(err => {
            console.error('at makeTestCtx', err);
            out.tearDown();
        });
}

exports.makeHttpTestCtx = () => makeTestCtx(true);
exports.makeDbTestCtx = () => makeTestCtx(false);
