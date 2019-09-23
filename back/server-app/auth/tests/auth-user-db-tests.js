/*
 * Tässä tiedostossa:
 *
 * authiin liittvät yksikkötestit.
 */

/* eslint-disable no-console */
const sinon = require('sinon');
const {makeDbTestCtx} = require('../../tests-common/testing-env.js');
const testData = require('../../tests-common/test-data.js');
const {getOrCreateAuthUser, AuthProviders} = require('../auth-controllers.js');
const {authUserRepository} = require('../auth-user-repository.js');

describe('AuthUser tietokanta', () => {
    let tctx;
    beforeAll(done => {
        makeDbTestCtx().then(ctx => {
            tctx = ctx;
            done();
        });
    });
    afterAll(() => {
        tctx.tearDown();
    });
    describe('getOrCreateAuthUser()', () => {
    it('insertoi uuden käyttäjän ja kirjautumistavan tietokantaan', done => {
        const mockGithubId = '4567';
        new Promise(resolve => {
            getOrCreateAuthUser(AuthProviders.GITHUB, {id: mockGithubId}, () => {
                resolve();
            });
        })
        .then(() => tctx.getDb().getPool().query(
            'select u.`id`,a.`providerId`,a.`identity` from connectedAuthAccounts a' +
            ' join users u on (u.`id` = a.`userId`)' +
            ' where a.`identity` = ?',
            [mockGithubId]
        ))
        .then(rows => {
            expect(rows.length).toEqual(1);
            const actuallyInserted = rows[0];
            expect(parseInt(actuallyInserted.providerId)).toEqual(AuthProviders.GITHUB);
            expect(actuallyInserted.identity).toEqual(mockGithubId);
            return tctx.getDb().getPool().query(
                'delete from users where `id` = ?', // triggeri poistaa connectedAccountin
                [actuallyInserted.id]
            );
        })
        .then(res => {
            if (res.affectedRows < 1) throw new Error('Testidatan siivous epäonnistui.');
        })
        .catch(err => {
            console.error(err);
            expect(1).toBe('Ei pitäisi heittää virhettä');
        })
        .finally(() => {
            done();
        });
    });
    it('ei yritä insertoida käyttäjää mikäli jo olemassa', done => {
        const providerId = testData.connectedAuthAccount.providerId;
        const providersUserId = testData.connectedAuthAccount.identity;
        const artistitnetUserId = testData.connectedAuthAccount.userId;
        const insertSpy = sinon.spy(authUserRepository, 'createUser');
        new Promise(resolve => {
            getOrCreateAuthUser(providerId, {id: providersUserId}, (_err, user) => {
                resolve(user);
            });
        })
        .then(user => {
            expect(user.id).toEqual(artistitnetUserId);
            expect(insertSpy.called).toEqual(false);
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
});
