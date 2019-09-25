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
const {insertSongs, deleteSongs} = require('../../song/tests/utils.js');

describe('Artists CRUD', () => {
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
    it('POST /artisti/uusi validoi inputin', done => {
        request(tctx.getApp())
            .post('/artisti/uusi')
            .send('widgets=not:json')
            .then(res => {
                expect(res.status).toEqual(400);
                const errors = res.text.split('\n');
                expect(errors[0]).toEqual('name on pakollinen');
                expect(errors[1]).toEqual('widgets ei kelpaa');
            })
            .catch(err => {
                console.error(err);
                expect(1).toBe('Ei pitäisi heittää virhettä');
            })
            .finally(() => {
                done();
            });
    });
    it('POST /artisti/uusi insertoi uuden artistin tietokantaan', done => {
        const testInput = {name: 'dos'};
        let actuallyRedirectedTo = '';
        request(tctx.getApp())
            .post('/artisti/uusi')
            .send('name=' + testInput.name +
                  '&widgets=[]')
            .then(res => {
                expect(res.status).toEqual(302);
                actuallyRedirectedTo = res.header.location;
                return fetchArtistFromDb(tctx, testInput.name);
            })
            .then(rows => {
                const actuallyInserted = rows[0];
                expect(actuallyInserted.name).toEqual(testInput.name);
                expect(actuallyInserted.widgets).toEqual('[]');
                expect(actuallyInserted.id.length).toEqual(20);
                expect(actuallyRedirectedTo, '/artisti/' + actuallyInserted.id);
            })
            .catch(err => {
                console.error(err);
                expect(1).toBe('Ei pitäisi heittää virhettä');
            })
            .finally(() => {
                done();
            });
    });
    it('GET /artisti/:artistId renderöi seinä-tabin', done => {
        request(tctx.getApp())
            .get('/artisti/' + testData.artist.id)
            .then(res => {
                expect(res.status).toEqual(200);
                const $ = testUtils.parseDocumentBody(res.text);
                const widgetEls = $('.widget');
                const actualWidgets = testData.artist.widgets;
                expect(widgetEls.length).toEqual(actualWidgets.length);
                const infoBoxWidgetEl = $(widgetEls[0]);
                const twitterWidgetgetEl = $(widgetEls[1]);
                // ks. artist.widgets @tests-common/test-data.js
                expect($(infoBoxWidgetEl.find('h3')[0]).text())
                    .toEqual('Meistä');
                expect($(infoBoxWidgetEl.find('.widget-main')[0]).text().trim())
                    .toEqual('Jäsenet: Foo');
                expect($(twitterWidgetgetEl.find('h3')[0]).text())
                    .toEqual('Twitter');
                expect($(twitterWidgetgetEl.find('.widget-main')[0]).text().trim())
                    .toEqual('Tweetit käyttäjältä ' + actualWidgets[1].data.userName);
            })
            .catch(err => {
                console.error(err);
                expect(1).toBe('Ei pitäisi heittää virhettä');
            })
            .finally(() => {
                done();
            });
    });
    it('GET /artisti/:artistId?näytä=biisit renderöi biisilistan', done => {
        const testSongs = [{id: '-zzsssssssssssssssss', name: 'a', duration: 1,
                            artistId: testData.artist.id, genreId: 1},
                           {id: '-yysssssssssssssssss', name: 'b', duration: 2,
                            artistId: testData.artist.id, genreId: 1}];
        insertSongs(tctx, testSongs)
            .then(() =>
                request(tctx.getApp())
                    .get('/artisti/' + testData.artist.id + '?näytä=biisit')
            )
            .then(res => {
                expect(res.status).toEqual(200);
                const $ = testUtils.parseDocumentBody(res.text);
                const songEls = $('article');
                expect(songEls.length).toBeGreaterThanOrEqual(2);
                verifyPageContainsSong(testSongs[0], 0);
                verifyPageContainsSong(testSongs[1], 1);
                //
                function verifyPageContainsSong(song, i) {
                    const el = $(songEls[i]);
                    const divs = el.children('div');
                    expect($(el.children('h2')[0]).text()).toEqual(song.name);
                    expect($(divs[0]).text()).toEqual('Klikit: 0');
                    expect($(divs[1]).text()).toEqual('Tykkäykset: 0');
                }
                return deleteSongs(tctx, testSongs);
            })
            .catch(err => {
                console.error(err);
                expect(1).toBe('Ei pitäisi heittää virhettä');
            })
            .finally(() => {
                done();
            });
    });
    it('POST /artisti/muokkaa validoi inputin', done => {
        request(tctx.getApp())
            .post('/artisti/muokkaa')
            .type('form')
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
    it('POST /artisti/muokkaa päivittää tiedot tietokantaan', done => {
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
                    .post('/artisti/muokkaa')
                    .send('name=' + testInput.name +
                          '&id=' + testInput.id +
                          '&tagline=' + testInput.tagline +
                          '&widgets=' + testInput.widgets
                    );
            })
            .then(res => {
                expect(res.status).toEqual(302);
                expect(res.header.location).toEqual('/artisti/' + testInput.id);
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
