/*
 * Tässä tiedostossa:
 *
 * Repository / DAO artisti-datalle.
 */

const {Db, generatePushID} = require('./db.js');


class ArtistsRepository {
    /**
     * @param {Db} db
     */
    constructor(db) {
        this.db = db;
    }
    /**
     * @param {{name: string; tagLine: string; userId: string;}} data
     * @returns {Promise<{insertId: string;}>}
     */
    insertArtist(data) {
        const fireId = generatePushID();
        return this.db.getPool()
            .query(
                'insert into artists values (?,?,?,\'\',\'[]\',?,?)',
                [
                    fireId,
                    data.name,
                    data.tagLine,
                    Math.floor(Date.now() / 1000),
                    data.userId
                ]
            )
            .then(res => {
                if (res.affectedRows > 0) return {insertId: fireId};
                throw new Error('affectedRows < 1');
            });
    }
    /**
     * @param {string} artistId
     * @returns {Promise<Artist|{}>}
     */
    getArtistById(artistId) {
        return this.db.getPool()
            .query(
                'select `id`,`name`,`tagLine`,`coverPhoto`,`widgets`,' +
                        '`createdAt`,`userId`' +
                ' from artists where `id` = ?',
                [artistId]
            )
            .then(rows => {
                return rows.length ? parseArtist(rows[0]) : {};
            });
    }
    /**
     * @param {string} artistId
     * @param {string} loggedInUserId
     * @param {{name: string; tagLine: string; widgets: string;}} data
     * @returns {Promise<{affectedRows: number;}>}
     */
    updateArtist(artistId, loggedInUserId, data) {
        return this.db.getPool()
            .query(
                'update artists set `name`=?,`tagLine`=?,`widgets`=? ' +
                'where `id`=? and `userId`=?',
                [
                    data.name,
                    data.tagLine,
                    data.widgets,
                    artistId,
                    loggedInUserId
                ]
            )
            .then(res => {
                if (res.affectedRows > 0) return res;
                throw new Error('affectedRows < 1');
            });
    }
}

/**
 * @param {{id: string; name: string; tagLine: string; coverPhoto: string; widgets: string; createdAt: number; userId: string;}}
 * @returns {Artist}
 */
function parseArtist(row) {
    return {
        id: row.id,
        name: row.name,
        tagLine: row.tagLine,
        coverPhoto: row.coverPhoto,
        widgets: row.widgets,
        createdAt: parseInt(row.createdAt),
        userId: row.userId,
    };
}

exports.ArtistsRepository = ArtistsRepository;
exports.artistsRepository = new ArtistsRepository(new Db());
