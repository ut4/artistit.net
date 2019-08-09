/*
 * Tässä tiedostossa:
 *
 * Repository / DAO artisti-datalle.
 */

const {Db} = require('./db.js');

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
