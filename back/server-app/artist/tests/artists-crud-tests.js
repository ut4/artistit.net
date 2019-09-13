/*
 * Tässä tiedostossa:
 *
 * Acceptance/integraatiotestit /artisti-alkuisille reiteille.
 */

/* eslint-disable no-console */
const request = require('supertest');
const testUtils = require('../../tests-common/test-utils.js');
const {makeHttpTestCtx} = require('../../tests-common/testing-env.js');
const testData = require('../../tests-common/test-data.js');

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
            .send('widgets=not:json&sneakySneaky=')
            .then(res => {
                expect(res.status).toEqual(400);
                const errors = res.text.split('\n');
                expect(errors[0]).toEqual('name on pakollinen');
                expect(errors[1]).toEqual('userId on pakollinen');
                expect(errors[2]).toEqual('widgets ei kelpaa');
            })
            .catch(err => {
                console.error(err);
                expect(1).toBe('Ei pitäisi heittää virhettä');
            })
            .finally(() => {
                done();
            });
    });
    it('POST /artisti insertoi uuden artistin tietokantaan', done => {
        const testInput = {name: 'dos'};
        request(tctx.getApp())
            .post('/artisti')
            .send('name=' + testInput.name +
                  '&userId=' + testData.user.id +
                  '&widgets=[]' +
                  '&sneakySneaky=')
            .then(res => {
                expect(res.status).toEqual(200);
                return fetchArtistFromDb(tctx, testInput.name);
            })
            .then(rows => {
                const actuallyInserted = rows[0];
                expect(actuallyInserted.name).toEqual(testInput.name);
                expect(actuallyInserted.widgets).toEqual('[]');
                expect(actuallyInserted.id.length).toEqual(20);
            })
            .catch(err => {
                console.error(err);
                expect(1).toBe('Ei pitäisi heittää virhettä');
            })
            .finally(() => {
                done();
            });
    });
    it('GET /artisti/:artistId ilman credentiaaleja renderöi artistisivun ja widgetit', done => {
        const app = tctx.getApp();
        const origUserId = app.locals.user.id;
        app.locals.user.id = 'someOtherArtistUserId';
        request(app)
            .get('/artisti/' + testData.artist.id)
            .then(res => {
                expect(res.status).toEqual(200);
                const n = testData.artist.name;
                const $ = testUtils.parseDocumentBody(res.text);
                expect($('h1').text()).toEqual(n);
                expect($('.artist-widgets-list').length).toEqual(1);
            })
            .catch(err => {
                console.error(err);
                expect(1).toBe('Ei pitäisi heittää virhettä');
            })
            .finally(() => {
                app.locals.user.id = origUserId;
                done();
            });
    });
    it('GET /artisti/:artistId credentiaaleilla renderöi artistisivun mutta ei widgettejä', done => {
        request(tctx.getApp())
            .get('/artisti/' + testData.artist.id)
            .then(res => {
                expect(res.status).toEqual(200);
                const n = testData.artist.name;
                const $ = testUtils.parseDocumentBody(res.text);
                expect($('h1').text()).toEqual(n);
                expect($('.artist-widgets-list').length).toEqual(0);
            })
            .catch(err => {
                console.error(err);
                expect(1).toBe('Ei pitäisi heittää virhettä');
            })
            .finally(() => {
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
            })
            .catch(err => {
                console.error(err);
                expect(1).toBe('Ei pitäisi heittää virhettä');
            })
            .finally(() => {
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
            })
            .then(res => {
                expect(res.status).toEqual(200);
                expect(res.text).toEqual('1');
                return fetchArtistFromDb(tctx, testInput.name);
            })
            .then(rows => {
                const actuallyInserted = rows[0];
                expect(actuallyInserted.name).toEqual(testInput.name);
                expect(actuallyInserted.tagline).toEqual(testInput.tagline);
                expect(actuallyInserted.widgets).toEqual(testInput.widgets);
                expect(actuallyInserted.id.length).toEqual(20);
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

function fetchArtistFromDb(tctx, artistName) {
    return tctx.getDb().getPool()
        .query(
            'select `id`,`name`,`tagline`,`widgets` from artists where `name`=?',
            [artistName]
        );
}
