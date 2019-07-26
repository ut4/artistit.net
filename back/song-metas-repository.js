const {Db} = require('./db.js');

// interface Song {id: string; name: string; genre: string; duration: string;}

class SongMetasRepository {
    constructor(db) {
        this.db = db;
    }
    /**
     * @param {string} artistId
     * @returns {Promise<Array<Song>|{err: Object;}>}
     */
    getSongsByArtist(artistId) {
        return this.db.getPool()
            .query(
                'select s.`id`,s.`name`,g.`name` as `genre`,s.`duration` from songs s ' +
                'join genres g on (g.`id` = s.`genreId`) ' +
                'where exists ('+
                    'select sm.`songId` from songMakers sm ' +
                    'where sm.`songId` = s.`id` and sm.`artistId` = ?' +
                ') limit 10',
                artistId
            )
            .then(rows => {
                return rows.map(song => parseSong(song));
            })
            .catch(err => {
                return {err};
            });
    }
}

/**
 * @param {{id: string; name: string; genre: string; duration: string;}}
 * @returns {Song}
 */
function parseSong(row) {
    return {
        id: row.id,
        name: row.name,
        genre: row.genre,
        duration: parseFloat(row.duration).toFixed(2),
    };
}

exports.songMetasRepository = new SongMetasRepository(new Db());
