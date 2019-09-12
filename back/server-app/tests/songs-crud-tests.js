/*
 * Tässä tiedostossa:
 *
 * Acceptance/integraatiotestit /biisit-alkuisille reiteille.
 */

/* eslint-disable no-console */
const sinon = require('sinon');
const request = require('supertest');
const {makeHttpTestCtx} = require('./setup/testing-env.js');
const testData = require('./setup/test-data.js');
const config = require('../../config.js');
const songRepoModule = require('../songs-repository.js');

const testSong = {id: '-sssssssssssssssssss', name: 'test', duration: 2,
                  artistId: testData.artist.id, genreId: 1};

describe('songs-crud', () => {
    let tctx;
    beforeAll(done => {
        makeHttpTestCtx().then(ctx => {
            tctx = ctx;
            return tctx.getDb().getPool()
                .query(
                    'insert into songs values (?,?,?,?,?)',
                    Object.values(testSong)
                );
        })
        .then(res => {
            if (res.affectedRows < 1)
                throw new Error('Testibiisin insertointi epäonnistui');
            done();
        });
    });
    afterAll(done => {
        tctx.getDb().getPool()
            .query('delete from songs where `id`=?', [testSong.id])
            .then(res => {
                if (res.affectedRows < 1)
                    throw new Error('Testibiisin siivous epäonnistui');
                done();
            });
        tctx.tearDown();
    });
    it('POST /biisi validoi inputin', done => {
        request(tctx.getApp())
            .post('/biisi')
            .set('Content-Type', 'multipart/form-data')
            .send('sneakySneaky=')
            .then(res => {
                expect(res.status).toEqual(400);
                const errors = res.text.split('\n');
                expect(errors[0]).toEqual('name on pakollinen');
                expect(errors[1]).toEqual('file on pakollinen');
                expect(errors[2]).toEqual('genre on pakollinen');
                expect(errors[3]).toEqual('artistId on pakollinen');
            })
            .catch(err => {
                console.error(err);
                expect(1).toBe('Ei pitäisi heittää virhettä');
            })
            .finally(() => {
                done();
            });
    });
    it('POST /biisi kirjoittaa filen levylle ja metatiedot kantaan', done => {
        const a = testData.artist;
        const testInput = {
            name: 'biisi',
            genre: 'Ambient',
            artistId: a.id,
        };
        let insertId = '';
        const dirPath = `${config.staticDirPath}songs/${a.userId}/`;
        const filePath = `${dirPath}${testData.song.id}.mp3`;
        const songRepo = songRepoModule.songsRepository;
        let convertMp3Stub = sinon
            .stub(songRepo.converter, 'convert')
            .returns(Promise.resolve());
        let unlinkOrigFileStub = sinon
            .stub(songRepo.fs, 'unlink')
            .yields(null); // triggeröi unlinkin callback, ja passaa sille
                           // null (ei erroria)
        request(tctx.getApp())
            .post('/biisi')
            .field('name', testInput.name)
            .attach('fileData', filePath)
            .field('genre', testInput.genre)
            .field('artistId', testInput.artistId)
            .field('sneakySneaky', '')
            .then(res => {
                expect(res.status).toEqual(200);
                expect(res.text.length).toEqual(20);
                insertId = res.text;
                const convertTargetFilePath = convertMp3Stub.firstCall.args[1];
                expect(convertTargetFilePath).toEqual(`${dirPath}${insertId}.mp3`);
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
                expect(actuallyInserted.name).toEqual(testInput.name);
                expect(actuallyInserted.id).toEqual(insertId);
                expect(actuallyInserted.genre).toEqual(testInput.genre);
                expect(actuallyInserted.artistId).toEqual(testInput.artistId);
            })
            .catch(err => {
                console.error(err);
                expect(1).toBe('Ei pitäisi heittää virhettä');
            })
            .finally(() => {
                convertMp3Stub.restore();
                unlinkOrigFileStub.restore();
                done();
            });
    });
    it('POST /biisi/kuuntelu validoi inputin', done => {
        request(tctx.getApp())
            .post('/biisi/kuuntelu')
            .type('form')
            .then(res => {
                expect(res.status).toEqual(400);
                const errors = res.text.split('\n');
                expect(errors[0]).toEqual('id on pakollinen');
            })
            .catch(err => {
                console.error(err);
                expect(1).toBe('Ei pitäisi heittää virhettä');
            })
            .finally(() => {
                done();
            });
    });
    it('POST /biisi/kuuntelu insertoi kuuntelukerran tietokantaan', done => {
        const unixTimeNow = Math.floor(Date.now() / 1000);
        request(tctx.getApp())
            .post('/biisi/kuuntelu')
            .send('id=' + testData.song.id)
            .then(res => {
                expect(res.status).toEqual(200);
                expect(res.text).toBeGreaterThanOrEqual(1);
                return tctx.getDb().getPool()
                    .query(
                        'select `id`,`songId`,`registeredAt`,`secondsListened`' +
                        ' from songListens' +
                        ' where `songId`=? and `userId`=?' +
                        ' order by `registeredAt` desc limit 1',
                        [testData.song.id, testData.user.id]
                    );
            })
            .then(rows => {
                expect(rows.length).toEqual(1);
                expect(rows[0].secondsListened).toEqual(0);
                expect(rows[0].registeredAt).toBeGreaterThanOrEqual(unixTimeNow);
                return tctx.getDb().getPool()
                    .query('delete from songListens where `id`=?', [rows[0].id]);
            })
            .then(res => {
                if (res.affectedRows < 1)
                    throw new Error('Testidatan siivous epäonnistui.');
            })
            .catch(err => {
                console.error(err);
                expect(1).toBe('Ei pitäisi heittää virhettä');
            })
            .finally(() => {
                done();
            });
    });
    it('POST /biisi/kuuntelu ei rekisteröi liian aikaista kuuntelukertaa',
    done => {
        let testListenId = null;
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
                        .send('id=' + testData.song.id);
                }
                throw new Error('Testidatan insertointi epäonnistui');
            })
        // 3. Assertoi että rejektoi
            .then(res => {
                expect(res.status).toEqual(500);
                expect(res.text).toEqual('-1');
                return tctx.getDb().getPool()
                    .query(
                        'delete from songListens where `id`=?',
                        [testListenId]
                    );
            })
            .then(res => {
                if (testListenId && res.affectedRows < 1)
                    throw new Error('Testidatan siivous epäonnistui.');
            })
            .catch(err => {
                console.error(err);
                expect(1).toBe('Ei pitäisi heittää virhettä');
            })
            .finally(() => {
                done();
            });
    });
    it('POST /biisi/tykkaa validoi inputin', done => {
        request(tctx.getApp())
            .post('/biisi/tykkaa')
            .type('form')
            .then(res => {
                expect(res.status).toEqual(400);
                const errors = res.text.split('\n');
                expect(errors[0]).toEqual('id on pakollinen');
            })
            .catch(err => {
                console.error(err);
                expect(1).toBe('Ei pitäisi heittää virhettä');
            })
            .finally(() => {
                done();
            });
    });
    it('POST /biisi/tykkaa insertoi tykkäyksen tietokantaan', done => {
        const where = 'where `songId`=? and `userIdOrIpAddress`=?';
        request(tctx.getApp())
            .post('/biisi/tykkaa')
            .send('id=' + testSong.id)
            .then(res => {
                expect(res.status).toEqual(200);
                expect(res.text).toEqual('1');
                return tctx.getDb().getPool()
                    .query(
                        'select `songId` from songLikes ' + where,
                        [testSong.id, testData.user.id]
                    );
            })
            .then(rows => {
                expect(rows.length).toEqual(1);
                return tctx.getDb().getPool()
                    .query(
                        'delete from songLikes ' + where,
                        [testSong.id, testData.user.id]
                    );
            })
            .then(res => {
                if (res.affectedRows < 1)
                    throw new Error('Testidatan siivous epäonnistui.');
            })
            .catch(err => {
                console.error(err);
                expect(1).toBe('Ei pitäisi heittää virhettä');
            })
            .finally(() => {
                done();
            });
    });
});
