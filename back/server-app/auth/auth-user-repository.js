/*
 * Tässä tiedostossa:
 *
 * Repository / DAO käyttäjä-datalle.
 */

const {makeDb, generatePushID} = require('../common/db.js');

const AuthProviders = {
    GITHUB: 0,
    FACEBOOK: 1,
};

class AuthUserRepository {
    /**
     * @param {Db} db
     */
    constructor(db) {
        this.db = db;
    }
    /**
     * Note: olettaa, että argumentit (providerId ja authProviderId) on jo
     * validoitu.
     *
     * @param {number} providerId esim. AuthProviders.GITHUB
     * @param {string} providersUserId esim. Github profile.id
     * @returns {Promise<User|null}>}
     */
    getUser(providerId, providersUserId) {
        return this.db.getPool()
            .query(
                'select u.`id` from users u' +
                ' join connectedAuthAccounts ca on (ca.`userId` = u.`id`)' +
                ' where ca.`providerId` = ? and ca.identity = ?',
                [providerId, providersUserId]
            ).then(rows =>
                rows.length ? {id: rows[0].id} : null
            );
    }
    /**
     * ks. {@link AuthUserRepository#getUser}
     */
    createUser(providerId, providersUserId) {
        const artistitUserId = generatePushID();
        return this.db.getPool()
            .query(
                'insert into users values (?)',
                [artistitUserId]
            )
            .then(res => {
                if (res.affectedRows != 1) throw new Error('StateError');
                return this.db.getPool()
                    .query('insert into connectedAuthAccounts values (?,?,?)',
                           [providerId, providersUserId, artistitUserId]);
            })
            .then(res => {
                if (res.affectedRows != 1) throw new Error('StateError');
                return {id: artistitUserId};
            });
    }
}

exports.authUserRepository = new AuthUserRepository(makeDb());
exports.AuthProviders = AuthProviders;
