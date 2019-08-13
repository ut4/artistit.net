/*
 * Tässä tiedostossa:
 *
 * Repository / DAO artisti-datalle.
 */

const {Db, generatePushID} = require('./db.js');

// interface Artist {id: string; name: string; tagLine: string; coverPhoto: string;
//                   widgets: string; createdAt: number;}

class ArtistsRepository {
    /**
     * @param {Db} db
     */
    constructor(db) {
        this.db = db;
    }
    /**
     * @param {Object} artist
     * @returns {Promise<number|{err: Object;}>}
     */
    insertArtist(artist) {
        const fireId = generatePushID();
        return this.db.getPool()
            .query(
                'insert into artists values (?,?,?,\'\',\'\',?,?)',
                [
                    fireId,
                    artist.name,
                    artist.tagLine,
                    Math.floor(Date.now() / 1000),
                    artist.userId
                ]
            )
            .then(res => {
                return res.affectedRows > 0
                    ? {insertId: fireId}
                    : {err: 'affectedRows < 1'};
            })
            .catch(err => {
                return {err};
            });
    }
    /**
     * @param {string} artistId
     * @returns {Promise<Array<Artist|null>|{err: Object;}>}
     */
    getArtistById(artistId) {
        return this.db.getPool()
            .query(
                'select `id`,`name`,`tagLine`,`coverPhoto`,`widgets`,`createdAt`' +
                ' from artists where `id` = ?',
                artistId
            )
            .then(rows => {
                return rows.length ? parseArtist(rows[0]) : null;
            })
            .catch(err => {
                return {err};
            });
    }
}

/**
 * @param {{id: string; name: string; tagLine: string; coverPhoto: string; widgets: string; createdAt: number;}}
 * @returns {Artist}
 */
function parseArtist(row) {
    return {
        id: row.id,
        name: row.name,
        tagLine: row.tagLine,
        coverPhoto: row.coverPhoto,
        widgets: row.widgets,
        createdAt: parseInt(row.createdAt)
    };
}

exports.ArtistsRepository = ArtistsRepository;
exports.artistsRepository = new ArtistsRepository(new Db());
