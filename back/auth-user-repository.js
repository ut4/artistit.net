const {Db} = require('./db.js');

// interface User {id: string; }

class AuthUserRepository {
    constructor(db) {
        this.db = db;
    }
    /**
     * Note: olettaa, että argumentit (authProvider ja authProviderId) on jo
     * validoitu.
     *
     * @param {number} authProvider katso AuthProviders @auth-controllers.js
     * @param {string} authProviderId esim. Github profile.id
     * @returns {Promise<null|User|{err: Object;}>}
     */
    getUser(authProvider, authProviderId) {
        return this.db.getPool()
            .query(
                'select u.`id` from users u ' +
                'join connectedAuthAccounts ca on ca.`userId` = u.`id` ' +
                'where ca.`provider` = ? and ca.identity = ?',
                [authProvider, authProviderId]
            ).then(rows => {
                return rows.length ? {id: rows[0].id} : null;
            }).catch(err => {
                return {err};
            });
    }
    /**
     * @param {number} authProvider
     * @param {string} authProviderId
     */
    createUser(authProvider, authProviderId) {
        return new Promise(r => {
            r({id: 'genId()'});
        });
        // const id = genId();
        //(`insert into users values (${id})` &&
        //`insert into connectedAuthAccounts values (${authProvider}, ${authProviderId}, ${id})`)
    }
}

exports.authUserRepository = new AuthUserRepository(new Db());
