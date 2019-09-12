/*
 * Tässä tiedostossa:
 *
 * Acceptance/integraatiotestit /foorumi-alkuisille reiteille.
 */

/* eslint-disable no-console */
const request = require('supertest');
const {makeHttpTestCtx} = require('./setup/testing-env.js');
const testData = require('./setup/test-data.js');
const testUtils = require('./setup/test-utils.js');
const unixTime = (addSecs = 0) => Math.floor(Date.now() / 1000) + addSecs;

const testTopics = [{id:1001,title:'Kissat',description:'Kuvaus 1'},
                    {id:1002,title:'Koirat',description:'Kuvaus 2'}];
const testThreads = [{id:2001,title:'Miuku',createdAt:unixTime(1),isLocked:0,
                      topicId:1001,userId:testData.user.id},
                     {id:2002,title:'Mauku',createdAt:unixTime(),isLocked:0,
                      topicId:1001,userId:testData.user.id},
                     {id:2003,title:'Koire',createdAt:unixTime(),isLocked:0,
                      topicId:1002,userId:testData.user.id}];

describe('forums-crud', () => {
    let tctx;
    const err = new Error('Testidatan insertointi epäonnistui');
    beforeAll(done => {
        makeHttpTestCtx()
        .then(ctx => {
            tctx = ctx;
            return tctx.getDb().getPool()
                .query('insert into topics values (?,?,?),(?,?,?)',
                    Object.values(testTopics[0])
                          .concat(Object.values(testTopics[1]))
                );
        })
        .then(res => {
            if (res.affectedRows < 1) throw err;
            return tctx.getDb().getPool()
                .query('insert into threads values (?,?,?,?,?,?),(?,?,?,?,?,?)'+
                                                   ',(?,?,?,?,?,?)',
                    Object.values(testThreads[0])
                          .concat(Object.values(testThreads[1]))
                          .concat(Object.values(testThreads[2]))
                );
        })
        .then(res => {
            if (res.affectedRows < 1) throw err;
            done();
        });
    });
    afterAll(() => {
        tctx.tearDown();
    });
    it('GET /foorumi renderöi alueet', done => {
        request(tctx.getApp())
            .get('/foorumi')
            .send()
            .then(res => {
                expect(res.status).toEqual(200);
                const $ = testUtils.parseDocumentBody(res.text);
                const groupEls = $('.topic-list tbody');
                // Kisset
                const testTopic1GroupEl = groupEls[groupEls.length-2];
                const testTopic1Tr1 = $(testTopic1GroupEl.children[1]); // [0] = whitespace-node
                const testTopic1Tr2 = testTopic1GroupEl.children[3];    // [2] = whitespace-node
                const testTopic1Tr3 = testTopic1GroupEl.children[5];    // [4] = whitespace-node
                const topic1LatestThread1Td1 = $(testTopic1Tr2.children[1]); // sama..
                const topic1LatestThread1Td2 = $(testTopic1Tr2.children[3]);
                const topic1LatestThread2Td1 = $(testTopic1Tr3.children[1]);
                const topic1LatestThread2Td2 = $(testTopic1Tr3.children[3]);
                expect(testTopic1Tr1.text().trim()).toEqual(testTopics[0].title);
                expect(topic1LatestThread1Td1.text().trim()).toEqual(testThreads[0].title);
                expect(+topic1LatestThread1Td2.text().trim()).toEqual(testThreads[0].createdAt);
                expect(topic1LatestThread2Td1.text().trim()).toEqual(testThreads[1].title);
                expect(+topic1LatestThread2Td2.text().trim()).toEqual(testThreads[1].createdAt);
                // Goirat
                const testTopic2GroupEl = groupEls[groupEls.length-1];
                const testTopic2Tr1 = $(testTopic2GroupEl.children[1]);
                const testTopic2Tr2 = testTopic2GroupEl.children[3];
                const topic2LatestThread1Td1 = $(testTopic2Tr2.children[1]);
                const topic2LatestThread1Td2 = $(testTopic2Tr2.children[3]);
                expect(testTopic2Tr1.text().trim()).toEqual(testTopics[1].title);
                expect(topic2LatestThread1Td1.text().trim()).toEqual(testThreads[2].title);
                expect(+topic2LatestThread1Td2.text().trim()).toEqual(testThreads[2].createdAt);
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
