/*
 * Tässä tiedostossa:
 *
 * Acceptance-testit /artisti-alkuisille reiteille.
 */

/* eslint-disable no-console */
const request = require('supertest');
const {makeHttpTestCtx} = require('./testing-env.js');
const testData = require('./test-data.js');

QUnit.module('artists-crud', hooks => {
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
    QUnit.test('POST /artisti validoi inputin', assert => {
        assert.expect(3);
        const done = assert.async();
        request(tctx.getApp())
            .post('/artisti')
            .send('sneakySneaky=')
            .then(res => {
                assert.equal(res.status, 400);
                const errors = res.text.split('\n');
                assert.equal(errors[0], 'name on pakollinen');
                assert.equal(errors[1], 'userId on pakollinen');
            }).catch(err => {
                console.error(err);
            }).finally(() => {
                done();
            });
    });
    QUnit.test('POST /artisti insertoi uuden artistin tietokantaan', assert => {
        assert.expect(3);
        const done = assert.async();
        const testInput = {name: 'dos'};
        request(tctx.getApp())
            .post('/artisti')
            .send('name=' + testInput.name +
                  '&userId=' + testData.user.id +
                  '&sneakySneaky=')
            .then(res => {
                assert.equal(res.status, 200);
                return fetchArtistFromDb(tctx, testInput.name);
            }).then(rows => {
                const actuallyInserted = rows[0];
                assert.equal(actuallyInserted.name, testInput.name);
                assert.equal(actuallyInserted.id.length, 20);
            }).catch(err => {
                console.error(err);
            }).finally(() => {
                done();
            });
    });
    QUnit.test('GET /artisti/:artistId renderöi artistisivun', assert => {
        assert.expect(2);
        const done = assert.async();
        request(tctx.getApp())
            .get('/artisti/' + testData.artist.id)
            .then(res => {
                assert.equal(res.status, 200);
                const n = testData.artist.name;
                assert.equal(res.text.split('<h1>')[1].substr(0, n.length), n);
            }).catch(err => {
                console.error(err);
            }).finally(() => {
                done();
            });
    });
    QUnit.test('PUT /artisti validoi inputin', assert => {
        assert.expect(5);
        const done = assert.async();
        request(tctx.getApp())
            .put('/artisti')
            .send('sneakySneaky=')
            .then(res => {
                assert.equal(res.status, 400);
                const errors = res.text.split('\n');
                assert.equal(errors[0], 'name on pakollinen');
                assert.equal(errors[1], 'id on pakollinen');
                assert.equal(errors[2], 'tagline on pakollinen');
                assert.equal(errors[3], 'widgets on pakollinen');
            }).catch(err => {
                console.error(err);
            }).finally(() => {
                done();
            });
    });
    QUnit.test('PUT /artisti päivittää tiedot tietokantaan', assert => {
        assert.expect(6);
        const done = assert.async();
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
                assert.equal(res.status, 200);
                assert.equal(res.text, '1');
                return fetchArtistFromDb(tctx, testInput.name);
            }).then(rows => {
                const actuallyInserted = rows[0];
                assert.equal(actuallyInserted.name, testInput.name);
                assert.equal(actuallyInserted.tagline, testInput.tagline);
                assert.equal(actuallyInserted.widgets, testInput.widgets);
                assert.equal(actuallyInserted.id.length, 20);
            }).catch(err => {
                console.error(err);
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
