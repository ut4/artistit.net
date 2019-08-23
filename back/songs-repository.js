/*
 * Tässä tiedostossa:
 *
 * DAO / service palveluun ladatuille biiseille. Biisien metatiedot tallentuu
 * tietokantaan, ja varsinaiset biisit suoraan palvelimen kiintolevylle.
 */

const fs = require('fs');
const {makeDb, generatePushID} = require('./db.js');
const config = require('./config.js');

class SongsRepository {
    /**
     * @param {Db} db
     * @param {fs} fs
     */
    constructor(db, fs) {
        this.db = db;
        this.fs = fs;
    }
    /**
     * Kirjoittaa uploadatun biisin $data.file levylle, ja insertoi sen meta-
     * tiedot tietokantaan.
     *
     * @param {{name: string; file: {File}; genre: string; tags: string; artistId: string;}} data
     * @param {string} userId
     * @returns {Promise<{insertId: string; duration: string;}>}
     */
    uploadAndInsertSong(data, userId) {
        data.id = generatePushID();
        data.duration = 0;
        // Step 1: konvertoi biisi + lue mime & pituus(todo)
        // Step 2: uploadaa biisi
        return new Promise(resolve => {
            data.file.mv(`${config.staticDirPath}songs/${userId}/${data.id}.mp3`, err => {
                resolve(err);
            });
        })
        // Step 3: insertoi genre (mikäli ei ole jo kannassa)
        .then(err => {
            if (err) throw err;
            return this.db.getPool().query(
                'insert ignore into genres (`name`) values (?)',
                [data.genre]
            );
        })
        // Step 4: insertoi biisi
        .then(() =>
            this.db.getPool().query(
                'insert into songs values (?,?,?,?,(' +
                    'select id from genres where `name` = ?' +
                '))',
                [data.id, data.name, data.duration, data.artistId, data.genre]
            )
        )
        .then(res => {
            if (res.affectedRows > 0) return {insertId: data.id,
                                              duration: data.duration};
            else throw new Error('res.affectedRows < 1');
        });
        // Step 5: insertoi tagit (todo)
        // Step 6: linkkaa tagit luotuun biisiin (todo);
    }
    /**
     * Tsekkaa onko $artistId kirjautuneelle käyttäjälle $loggedInUserId kuuluva
     * artisti.
     *
     * @param {string} artistId
     * @param {string} loggedInUserId
     * @returns {Promise<boolean>}
     */
    isValidUploader(artistId, loggedInUserId) {
        return this.db.getPool()
            .query(
                'select `id` from artists where `id` = ? and `userId` = ?',
                [artistId, loggedInUserId]
            )
            .then(rows => {
                return rows.length > 0;
            });
    }
    /**
     * @param {string} artistId
     * @returns {Promise<Array<Song>>}
     */
    getSongsByArtist(artistId) {
        return this.db.getPool()
            .query(
                'select s.`id`,s.`name`,g.`name` as `genre`,s.`duration` from songs s ' +
                'join genres g on (g.`id` = s.`genreId`) ' +
                'where s.`artistId` = ? limit 10',
                [artistId]
            )
            .then(rows => {
                return rows.map(song => parseSong(song));
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

exports.songsRepository = new SongsRepository(makeDb(), fs);
