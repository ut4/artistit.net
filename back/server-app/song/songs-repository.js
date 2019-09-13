/*
 * Tässä tiedostossa:
 *
 * DAO / service palveluun ladatuille biiseille. Biisien metatiedot tallentuu
 * tietokantaan, ja varsinaiset biisit suoraan palvelimen kiintolevylle.
 */

const fs = require('fs');
const log = require('loglevel');
const {makeDb, generatePushID} = require('../common/db.js');
const config = require('../../config.js');
const {SongFormatConverter} = require('./song-format-converter.js');

class SongsRepository {
    /**
     * @param {Db} db
     * @param {SongFormatConverter} converter
     * @param {fs} fs
     */
    constructor(db, converter, fs) {
        this.db = db;
        this.converter = converter;
        this.fs = fs;
    }
    /**
     * Kirjoittaa uploadatun biisin $data.file levylle (mp3-muotoon konvertoi-
     * tuna), ja insertoi sen metatiedot tietokantaan.
     *
     * @param {{name: string; file: {File}; genre: string; tags: string; artistId: string;}} data
     * @param {string} userId
     * @returns {Promise<{insertId: string; duration: string;}>}
     */
    uploadAndInsertSong(data, userId) {
        data.id = generatePushID();
        data.duration = 0;
        const targetDirPath = `${config.staticDirPath}songs/${userId}/`;
        const origFilePath = targetDirPath + data.file.name;
        const sampledFilePath = targetDirPath + data.id + '.mp3';
        // Step 1: uploadaa käyttäjän valitsema tiedosto sellaisenaan
        return new Promise(resolve => {
            data.file.mv(origFilePath, err => {
                resolve(err);
            });
        })
        // Step 2: konvertoi biisi + lue sen duration
        .then(err => {
            if (err) throw err;
            return this.converter.convert(origFilePath, sampledFilePath,
                data // note: data.duration täydentyy tämän kutsun aikana
            );
        })
        .then(() => new Promise(resolve => {
            this.fs.unlink(origFilePath, err => {
                if (err) log.error('tmp-tiedoston ' + origFilePath +
                                   ' poisto epäonnistui: ' + err.stack);
                resolve();
            });
        }))
        // Step 3: insertoi genre (mikäli ei ole jo kannassa)
        .then(() => this.db.getPool().query(
            'insert ignore into genres (`name`) values (?)',
            [data.genre]
        ))
        // Step 4: insertoi biisi
        .then(() => this.db.getPool().query(
            'insert into songs values (?,?,?,?,(' +
                'select id from genres where `name` = ?' +
            '))',
            [data.id, data.name, data.duration, data.artistId, data.genre]
        ))
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
            .then(rows =>
                rows.length > 0
            );
    }
    /**
     * @param {string} artistId
     * @param {string?} currentUserIdOrIpAddress = null
     * @returns {Promise<Array<Song>>}
     */
    getSongsByArtist(artistId, currentUserIdOrIpAddress = null) {
        return this.db.getPool()
            .query(
                'select s.`id`,s.`name`,g.`name` as `genre`,s.`duration`,' +
                        ' (select count(`id`) from songListens' +
                            ' where `songId`= s.`id`) as amountOfPlayClicks,' +
                        ' (select count(`songId`) from songLikes' +
                            ' where `songId`= s.`id`) as amountOfLikes,' +
                        (currentUserIdOrIpAddress
                            ? ' (select `songId` from songLikes' +
                                ' where `songId`=s.`id` and `userIdOrIpAddress`=?)'
                            : ' null'
                        ) + ' as isLikedByCurrentUser' +
                ' from songs s' +
                ' join genres g on (g.`id` = s.`genreId`)' +
                ' where s.`artistId` = ? limit 10',
                currentUserIdOrIpAddress
                    ? [currentUserIdOrIpAddress, artistId]
                    : [artistId]
            )
            .then(rows =>
                rows.map(parseSong)
            );
    }
    /**
     * Insertoi biisille $data.id uuden kuuntelukerran.
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
            'insert into songListens (`songId`,`userId`,`ipAddress`,`registeredAt`)' +
            ' select ?, ?, ?, ?' +
            // edellisestä rekisteröintikerrasta on vähemmän aikaa kuin biisin pituus
            ' where ifnull(' +
                '(select sl.`registeredAt` + s.`duration`' +
                    ' from songListens sl' +
                    ' left join songs s on (s.`id` = sl.`songId`)' +
                    ' where sl.`songId` = ? and sl.`'+identityFieldName+'` = ?' +
                    ' order by sl.`registeredAt` desc limit 1),' +
                ' 0' +
            ') < ?;',
            [data.id, data.userId || null, ipAddressInsertValue, unixTimeNow,
             data.id, identityValue, unixTimeNow]
        )
        .then(res => {
            if (res.affectedRows > 0) return res;
            else throw new Error('res.affectedRows < 1');
        });
    }
    /**
     * Insertoi biisille $data.id tykkäyksen käyttäjältä $data.userId|$data.ipAddress,
     * tai ei tee mitään jos tykkäys oli suoritettu jo aikaisemmin.
     *
     * @param {{id: string; ipAddress: string; userId?: string;}} data
     * @returns {Promise<{affectedRows: number;}>}
     */
    insertLike(data) {
        let userIdOrIpAddress, identityIsIpAddress;
        if (data.userId) {
            userIdOrIpAddress = data.userId;
            identityIsIpAddress = 0;
        } else {
            userIdOrIpAddress = data.ipAddress;
            identityIsIpAddress = 1;
        }
        return this.db.getPool().query(
            'insert ignore into songLikes values (?,?,?)',
            [data.id, userIdOrIpAddress, identityIsIpAddress]
        );
    }
}

/**
 * @param {{id: string; name: string; genre: string; duration: string; amountOfPlayClicks: number; amountOfLikes: number; isLikedByCurrentUser?: string;}}
 * @returns {Song}
 */
function parseSong(row) {
    return {
        id: row.id,
        name: row.name,
        genre: row.genre,
        duration: parseFloat(row.duration).toFixed(2),
        amountOfPlayClicks: parseInt(row.amountOfPlayClicks),
        amountOfLikes: parseInt(row.amountOfLikes),
        isLikedByCurrentUser: row.isLikedByCurrentUser != null
    };
}

exports.songsRepository = new SongsRepository(makeDb(),
                                              new SongFormatConverter(),
                                              fs);
