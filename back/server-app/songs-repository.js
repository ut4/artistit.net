/*
 * Tässä tiedostossa:
 *
 * DAO / service palveluun ladatuille biiseille. Biisien metatiedot tallentuu
 * tietokantaan, ja varsinaiset biisit suoraan palvelimen kiintolevylle.
 */

const fs = require('fs');
const {makeDb, generatePushID} = require('./db.js');
const config = require('../config.js');

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
                'select s.`id`,s.`name`,g.`name` as `genre`,s.`duration`,' +
                        'count(sl.`id`) as amountOfPlayClicks ' +
                'from songs s ' +
                'join genres g on (g.`id` = s.`genreId`) ' +
                'left join songListens sl on (sl.`songId` = s.`id`) ' +
                'where s.`artistId` = ? limit 10',
                [artistId]
            )
            .then(rows => {
                return rows.map(song => parseSong(song));
            });
    }
    /**
     * Insertoi $data.id:lle uuden kuuntelukerran.
     *
     * @param {{id: string; ipAddress: string; userId?: string;}} data
     * @returns {Promise<{insertId: number;}>}
     */
    insertListen(data) {
        const unixTimeNow = Math.floor(Date.now() / 1000);
        let identityFieldName, identityValue, ipAddressInsertValue;
        if (data.userId) {
            ipAddressInsertValue = null;
            identityFieldName = 'userId';
            identityValue = data.userId;
        } else {
            ipAddressInsertValue = data.ipAddress;
            identityFieldName = 'ipAddress';
            identityValue = data.ipAddress;
        }
        return this.db.getPool().query(
            // Insertoi arvot vain jos ...
            'insert into songListens (`songId`,`userId`,`ipAddress`,`registeredAt`) ' +
            'select ?, ?, ?, ? ' +
            // edellisestä rekisteröintikerrasta on vähemmän aikaa kuin biisin pituus
            'where ifnull('+
                '(select sl.`registeredAt` + s.`duration` ' +
                    'from songListens sl ' +
                    'left join songs s on (s.`id` = sl.`songId`) ' +
                    'where sl.`songId` = ? and sl.`'+identityFieldName+'` = ? ' +
                    'order by sl.`registeredAt` desc limit 1), '+
                '0'+
            ') < ?;',
            [data.id, data.userId || null, ipAddressInsertValue, unixTimeNow,
             data.id, identityValue, unixTimeNow]
        )
        .then(res => {
            if (res.affectedRows > 0) return res;
            else throw new Error('res.affectedRows < 1');
        });
    }
}

/**
 * @param {{id: string; name: string; genre: string; duration: string; amountOfPlayClicks: number;}}
 * @returns {Song}
 */
function parseSong(row) {
    return {
        id: row.id,
        name: row.name,
        genre: row.genre,
        duration: parseFloat(row.duration).toFixed(2),
        amountOfPlayClicks: parseInt(row.amountOfPlayClicks),
    };
}

exports.songsRepository = new SongsRepository(makeDb(), fs);
