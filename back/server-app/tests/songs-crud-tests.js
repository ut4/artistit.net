/*
 * Tässä tiedostossa:
 *
 * Acceptance-testit /biisit-alkuisille reiteille.
 */

/* eslint-disable no-console */
const fs = require('fs');
const request = require('supertest');
const {makeHttpTestCtx} = require('./testing-env.js');
const testData = require('./test-data.js');
const config = require('../../config.js');

QUnit.module('songs-crud', hooks => {
    let tctx;
    hooks.before(assert => {
        const done = assert.async();
        makeHttpTestCtx().then(ctx => {
            tctx = ctx;
            done();
        });
    });
    hooks.after(() => {
        tctx.tearDown();
    });
    QUnit.test('POST /biisi validoi inputin', assert => {
        assert.expect(5);
        const done = assert.async();
        request(tctx.getApp())
            .post('/biisi')
            .set('Content-Type', 'multipart/form-data')
            .send('sneakySneaky=')
            .then(res => {
                assert.equal(res.status, 400);
                const errors = res.text.split('\n');
                assert.equal(errors[0], 'name on pakollinen');
                assert.equal(errors[1], 'file on pakollinen');
                assert.equal(errors[2], 'genre on pakollinen');
                assert.equal(errors[3], 'artistId on pakollinen');
            }).catch(err => {
                console.error(err);
            }).finally(() => {
                done();
            });
    });
    QUnit.test('POST /biisi kirjoittaa filen levylle ja metatiedot kantaan', assert => {
        assert.expect(7);
        const done = assert.async();
        const a = testData.artist;
        const testInput = {
            name: 'biisi',
            genre: 'Ambient',
            artistId: a.id,
        };
        const dirPath = `${config.staticDirPath}songs/${a.userId}/`;
        const filePath = `${dirPath}${testData.song.id}.mp3`;
        let newFilePath = '';
        let insertId = '';
        request(tctx.getApp())
            .post('/biisi')
            .field('name', testInput.name)
            .attach('fileData', filePath)
            .field('genre', testInput.genre)
            .field('artistId', testInput.artistId)
            .field('sneakySneaky', '')
            .then(res => {
                assert.equal(res.status, 200);
                assert.equal(res.text.length, 20, 'Pitäisi palauttaa insertId:n');
                insertId = res.text;
                newFilePath = `${dirPath}${insertId}.mp3`;
                return new Promise(resolve => {
                    fs.exists(newFilePath, doesIt => {
                        assert.equal(doesIt, true, 'Pitäisi kirjoittaa uploadattu tiedosto levylle');
                        resolve(doesIt);
                    });
                });
            })
            .then(fileWriteWasOk => {
                if (!fileWriteWasOk) throw new Error('abort');
                return tctx.getDb().getPool()
                    .query(
                        'select s.`id`,s.`name`,g.`name` as `genre`,s.`artistId` ' +
                        'from songs s ' +
                        'join genres g on (g.`id` = s.`genreId`) where s.`name`=?',
                        [testInput.name]
                    );
            })
            .then(rows => {
                const actuallyInserted = rows[0];
                assert.equal(actuallyInserted.name, testInput.name);
                assert.equal(actuallyInserted.id, insertId);
                assert.equal(actuallyInserted.genre, testInput.genre);
                assert.equal(actuallyInserted.artistId, testInput.artistId);
            })
            .catch(err => {
                console.error(err);
            })
            .finally(() => {
                fs.exists(`${dirPath}${insertId}.mp3`, doesIt => {
                    if (doesIt)
                        fs.unlink(`${dirPath}${insertId}.mp3`, err => {
                            if (err) console.error('Testitiedoston poisto epäonnistui',
                                                   err);
                            done();
                        });
                    else done();
                });
            });
    });
    QUnit.test('POST /biisi/kuuntelu validoi inputin', assert => {
        assert.expect(2);
        const done = assert.async();
        request(tctx.getApp())
            .post('/biisi/kuuntelu')
            .send('sneakySneaky=')
            .then(res => {
                assert.equal(res.status, 400);
                const errors = res.text.split('\n');
                assert.equal(errors[0], 'id on pakollinen');
            }).catch(err => {
                console.error(err);
            }).finally(() => {
                done();
            });
    });
    QUnit.test('POST /biisi/kuuntelu insertoi kuuntelukerran tietokantaan', assert => {
        assert.expect(5);
        const unixTimeNow = Math.floor(Date.now() / 1000);
        let numTestRows = 0;
        const done = assert.async();
        request(tctx.getApp())
            .post('/biisi/kuuntelu')
            .send('id=' + testData.song.id +
                  '&sneakySneaky=')
            .then(res => {
                assert.equal(res.status, 200);
                assert.ok(res.text >= 1, 'Pitäisi palauttaa insertId');
                return tctx.getDb().getPool()
                    .query(
                        'select `id`,`songId`,`registeredAt`,`timeListened`' +
                        ' from songListens' +
                        ' where `songId`=? and `userId`=?' +
                        ' order by `registeredAt` desc limit 1',
                        [testData.song.id, testData.user.id]
                    );
            })
            .then(rows => {
                numTestRows = rows.length;
                assert.equal(numTestRows, 1);
                assert.equal(rows[0].timeListened, 0);
                assert.ok(rows[0].registeredAt >= unixTimeNow,
                          rows[0].registeredAt + ' >= ' + unixTimeNow);
                return tctx.getDb().getPool()
                    .query('delete from songListens where `id`=?', [rows[0].id]);
            })
            .then(res => {
                if (res.affectedRows < numTestRows)
                    throw new Error('Testidatan siivous epäonnistui.');
            }).catch(err => {
                console.error(err);
            }).finally(() => {
                done();
            });
    });
    QUnit.test('POST /biisi/kuuntelu ei rekisteröi liian aikaista kuuntelukertaa',
    assert => {
        assert.expect(2);
        let testListenId = null;
        const done = assert.async();
        const unixTimeNow = Math.floor(Date.now() / 1000);
        // 1. Insertoi ensimmäinen kuuntelu
        tctx.getDb().getPool()
            .query(
                'insert into songListens (`songId`,`userId`,`registeredAt`)' +
                ' values (?,?,?)',
                [testData.song.id, testData.user.id, unixTimeNow]
            )
        // 2. Yritä rekisteröidä toinen heti perään
            .then(res => {
                if (res.affectedRows > 0) {
                    testListenId = res.insertId;
                    return request(tctx.getApp())
                        .post('/biisi/kuuntelu')
                        .send('id=' + testData.song.id +
                              '&sneakySneaky=');
                }
                throw new Error('Testidatan insertointi epäonnistui');
            })
        // 3. Assertoi että rejektoi
            .then(res => {
                assert.equal(res.status, 500);
                assert.equal(res.text, '-1');
                return tctx.getDb().getPool()
                    .query(
                        'delete from songListens where `id`=?',
                        [testListenId]
                    );
            })
            .then(res => {
                if (testListenId && res.affectedRows < 1)
                    throw new Error('Testidatan siivous epäonnistui.');
            }).catch(err => {
                console.error(err);
            }).finally(() => {
                done();
            });
    });
});
