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
    hooks.after(assert => {
        const done = assert.async();
        tctx.tearDown().then(() => { done(); });
    });
    QUnit.test('GET artisti/:artistId renderöi artistisivun', assert => {
        const done = assert.async();
        request(tctx.getApp())
            .get('/artisti/' + testData.artist.id)
            .then(res => {
                assert.equal(res.status, 200);
                const n = testData.artist.name;
                assert.equal(res.text.split('<h1>')[1].substr(0, n.length), n);
                done();
            }).catch(err => {
                console.error(err);
            }).finally(() => {
                done();
            });
    });
});
