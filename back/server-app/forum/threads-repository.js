/*
 * Tässä tiedostossa:
 *
 * DAO foorumi-threadeihin liittyvälle datalle.
 */

const {makeDb} = require('../common/db.js');

class ThreadsRepository {
    /**
     * @param {Db} db
     */
    constructor(db) {
        this.db = db;
    }
    /**
     * @returns {Promise<Array<Topic>>}
     */
    getTopicsWithLatestThreads() {
        let out = [];
        return this.db.getPool()
            .query('select `id`,`title`,`description` from topics')
            .then(rows => {
                out = rows.map(parseTopic);
                const sql = [], bind = [];
                for(const topic of out) {
                    bind.push(topic.id);
                    sql.push(
                        '(select `id`,`title`,`createdAt`,`topicId`' +
                        ' from threads' +
                        ' where `topicId`=?' +
                        ' order by `createdAt` desc' +
                        ' limit 3)'
                    );
                }
                return this.db.getPool().query(sql.join(' union all '), bind);
            })
            .then(rows => {
                for (const topic of out) {
                    topic.latestThreads = rows
                        .filter(row => row.topicId == topic.id)
                        .map(parseThread);
                }
                return out;
            });
    }
}

/**
 * @param {{id: string; title: string; description: string;}}
 * @returns {Topic}
 */
function parseTopic(row) {
    return {
        id: row.id,
        title: row.title,
        description: row.description,
    };
}

/**
 * @param {{id: string; title: string; topicId: string; createdAt: string;}}
 * @returns {Thread}
 */
function parseThread(row) {
    return {
        id: row.id,
        title: row.title,
        topicId: parseInt(row.topicId),
        createdAt: parseInt(row.createdAt),
    };
}

exports.threadsRepository = new ThreadsRepository(makeDb());
