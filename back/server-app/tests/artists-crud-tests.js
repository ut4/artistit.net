/*
 * Tässä tiedostossa:
 *
 * Acceptance-testit /artisti-alkuisille reiteille.
 */

/* eslint-disable no-console */
const request = require('supertest');
const {makeHttpTestCtx} = require('./testing-env.js');
const testData = require('./test-data.js');

describe('artists-crud', () => {
    let tctx;
    beforeAll(done => {
        makeHttpTestCtx().then(ctx => {
            tctx = ctx;
            done();
        });
    });
    afterAll(() => {
        tctx.tearDown();
    });
    it('POST /artisti validoi inputin', done => {
        request(tctx.getApp())
            .post('/artisti')
            .send('sneakySneaky=')
            .then(res => {
                expect(res.status).toEqual(400);
                const errors = res.text.split('\n');
                expect(errors[0]).toEqual('name on pakollinen');
                expect(errors[1]).toEqual('userId on pakollinen');
            }).catch(err => {
                console.error(err);
                expect(1).toBe('Ei pitäisi heittää virhettä');
            }).finally(() => {
                done();
            });
    });
    it('POST /artisti insertoi uuden artistin tietokantaan', done => {
        const testInput = {name: 'dos'};
        request(tctx.getApp())
            .post('/artisti')
            .send('name=' + testInput.name +
                  '&userId=' + testData.user.id +
                  '&sneakySneaky=')
            .then(res => {
                expect(res.status).toEqual(200);
                return fetchArtistFromDb(tctx, testInput.name);
            }).then(rows => {
                const actuallyInserted = rows[0];
                expect(actuallyInserted.name).toEqual(testInput.name);
                expect(actuallyInserted.id.length).toEqual(20);
            }).catch(err => {
                console.error(err);
                expect(1).toBe('Ei pitäisi heittää virhettä');
            }).finally(() => {
                done();
            });
    });
    it('GET /artisti/:artistId renderöi artistisivun', done => {
        request(tctx.getApp())
            .get('/artisti/' + testData.artist.id)
            .then(res => {
                expect(res.status).toEqual(200);
                const n = testData.artist.name;
                expect(res.text.split('<h1>')[1].substr(0, n.length)).toEqual(n);
            }).catch(err => {
                console.error(err);
                expect(1).toBe('Ei pitäisi heittää virhettä');
            }).finally(() => {
                done();
            });
    });
    it('PUT /artisti validoi inputin', done => {
        request(tctx.getApp())
            .put('/artisti')
            .send('sneakySneaky=')
            .then(res => {
                expect(res.status).toEqual(400);
                const errors = res.text.split('\n');
                expect(errors[0]).toEqual('name on pakollinen');
                expect(errors[1]).toEqual('id on pakollinen');
                expect(errors[2]).toEqual('tagline on pakollinen');
                expect(errors[3]).toEqual('widgets on pakollinen');
            }).catch(err => {
                console.error(err);
                expect(1).toBe('Ei pitäisi heittää virhettä');
            }).finally(() => {
                done();
            });
    });
    it('PUT /artisti päivittää tiedot tietokantaan', done => {
        const a = {
            id: '-aaaaaaaaaaaaaaaaaaa',
            name: 'toinen',
            tagline: 'toinen tagline',
            coverPhoto: null,
            widgets: '[]',
            createdAt: Math.floor(Date.now() / 1000),
            userId: testData.user.id,
        };
        const testInput = {
            name: 'uusi nimi',
            id: a.id,
            tagline: 'uusi tagline',
            widgets: '[1]',
        };
        tctx.getDb().getPool()
            .query(
                'insert into artists values (?,?,?,?,?,?,?)',
                [a.id, a.name, a.tagline, a.coverPhoto, a.widgets, a.createdAt, a.userId]
            )
            .then(res => {
                if (res.affectedRows < 1) throw new Error('Testidatan insertointi epäonnistui');
                return request(tctx.getApp())
                    .put('/artisti')
                    .send('name=' + testInput.name +
                          '&id=' + testInput.id +
                          '&tagline=' + testInput.tagline +
                          '&widgets=' + testInput.widgets +
                          '&sneakySneaky='
                    );
            }).then(res => {
                expect(res.status).toEqual(200);
                expect(res.text).toEqual('1');
                return fetchArtistFromDb(tctx, testInput.name);
            }).then(rows => {
                const actuallyInserted = rows[0];
                expect(actuallyInserted.name).toEqual(testInput.name);
                expect(actuallyInserted.tagline).toEqual(testInput.tagline);
                expect(actuallyInserted.widgets).toEqual(testInput.widgets);
                expect(actuallyInserted.id.length).toEqual(20);
            }).catch(err => {
                console.error(err);
                expect(1).toBe('Ei pitäisi heittää virhettä');
            }).finally(() => {
                done();
            });
    });
});

function fetchArtistFromDb(tctx, artistName) {
    return tctx.getDb().getPool()
        .query(
            'select `id`,`name`,`tagline`,`widgets` from artists where `name`=?',
            [artistName]
        );
}
