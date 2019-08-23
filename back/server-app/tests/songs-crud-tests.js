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
});
