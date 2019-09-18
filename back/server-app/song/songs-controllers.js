/*
 * Tässä tiedostossa:
 *
 * Handlerit /biisi-alkuisille reiteille.
 */

const log = require('loglevel');
const {ensureIsLoggedIn, ensureHasContentType} = require('../common/route-filters.js');
const {songsRepository} = require('./songs-repository.js');
const {isValidFireId} = require('../common/validation.js');
const validationConstants = {
    maxSongNameLen: 128,
};

class SongsControllers {
    static registerRoutes(app, baseUrl) {
        const makeCtrl = () => new SongsControllers(songsRepository);
        // roles: authenticatedUsers
        app.get(baseUrl + 'biisi/uusi/:artistId', ensureIsLoggedIn(),
            (a, b) => makeCtrl().newSongView(a, b));
        app.post(baseUrl + 'biisi', ensureIsLoggedIn(),
            ensureHasContentType('multipart/form-data'),
            (a, b) => makeCtrl().createSong(a, b));
        // roles: all
        app.post(baseUrl + 'biisi/kuuntelu', ensureHasContentType(),
            (a, b) => makeCtrl().registerListen(a, b));
        app.post(baseUrl + 'biisi/tykkaa', ensureHasContentType(),
            (a, b) => makeCtrl().registerLike(a, b));
    }
    /**
     * @param {SongsRepository} repo
     */
    constructor(repo) {
        this.repo = repo;
    }
    /**
     * GET /biisi/uusi/:artistId: Renderöi biisin lataus -sivun.
     */
    newSongView(req, res) {
        res.render('song/song-upload-view',
                   Object.assign({artistId: req.params.artistId,
                                  errorCode: req.query.error},
                                  validationConstants));
    }
    /**
     * POST /biisi: Vastaanottaa /biisi/uusi -sivun lomakedatan, validoi sen, ja
     * insertoi levylle ja tietokantaan.
     */
    createSong(req, res) {
        const errors = [];
        if (!req.body.name) errors.push('name on pakollinen');
        if (!req.files || !Object.keys(req.files).length) errors.push('file on pakollinen');
        if (!req.body.genre) errors.push('genre on pakollinen');
        if (!req.body.artistId) errors.push('artistId on pakollinen');
        else if (!isValidFireId(req.body.artistId)) errors.push('artistId ei kelpaa');
        if (errors.length) {
            res.status(400).send(errors.join('\n'));
            return;
        }
        //
        this.repo.isValidUploader(req.body.artistId, req.user.id)
            .then(wasIt => {
                if (wasIt) {
                    return this.repo.uploadAndInsertSong({
                        name: req.body.name,
                        file: req.files.fileData,
                        genre: req.body.genre,
                        tags: req.body.tags || null,
                        artistId: req.body.artistId
                    }, req.user.id);
                }
                throw new Error('req.body.artistId (' + req.body.artistId +
                                ') didn\'t belong to req.user.id (' +
                                req.user.id + ')!!');
            })
            .then(() => {
                res.redirect('artisti/' + req.body.artistId + '?näytä=biisit');
            })
            .catch(err => {
                log.error('Biisin lataus epäonnistui.', err.stack);
                res.redirect('/biisi/uusi/' + req.body.artistId + '?error=-1');
            });
    }
    /**
     * POST /biisi/kuuntelu: Lisää $req.body.songId:lle kuuntelukerran (0 min 0 sek)
     * ja linkkaa sen $req.user.id:lle, tai pyynnön ip-osoitteeseen (mikäli
     * kyseessä vierailija).
     */
    registerListen(req, res) {
        const errors = [];
        if (!req.body.id) errors.push('id on pakollinen');
        else if (!isValidFireId(req.body.id)) errors.push('id ei kelpaa');
        if (errors.length) {
            res.status(400).send(errors.join('\n'));
            return;
        }
        //
        this.repo.insertListen({
            id: req.body.id,
            userId: req.user.id,
            ipAddress: req.ip,
        })
        .then(result => {
            res.send(result.insertId.toString());
        })
        .catch(err => {
            // Note to self: tämä palauttaa errorin (res.affectedRows < 1),
            // jos kuuntelukerta insertoidaan liian aikaisin. Tätä ei kuitenkaan
            // normaalissa käytössä tapahdu, koska kuuntelukertojen väliset ajat
            // tsekataan frontendissä
            log.error('Biisikuuntelun lisäys tietokantaan epäonnistui', err.stack);
            res.status(500).send('-1');
        });
    }
    /**
     * POST /biisi/tykkaa: Merkkaa biisin $req.id tykätyksi käyttäjältä
     * $req.user.id tai $req.ip (mikäli kyseessä vierailija).
     */
    registerLike(req, res) {
        const errors = [];
        if (!req.body.id) errors.push('id on pakollinen');
        else if (!isValidFireId(req.body.id)) errors.push('id ei kelpaa');
        if (errors.length) {
            res.status(400).send(errors.join('\n'));
            return;
        }
        //
        this.repo.insertLike({
            id: req.body.id,
            userId: req.user.id,
            ipAddress: req.ip,
        })
        .then(result => {
            res.send(result.affectedRows.toString());
        })
        .catch(err => {
            log.error('Tykkäyksen lisäys tietokantaan epäonnistui', err.stack);
            res.status(500).send('-1');
        });
    }
}

exports.SongsControllers = SongsControllers;
