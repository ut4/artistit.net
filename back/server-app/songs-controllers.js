/*
 * Tässä tiedostossa:
 *
 * Handlerit /biisi-alkuisille reiteille.
 */

const log = require('loglevel');
const {ensureIsLoggedIn, ensureHasContentType} = require('./route-filters.js');
const {songsRepository} = require('../songs-repository.js');
const {isValidFireId} = require('../validation.js');
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
    }
    /**
     * @param {SongsRepository} repo
     */
    constructor(repo) {
        this.repo = repo;
    }
    /**
     * Renderöi biisin lataus -sivun.
     */
    newSongView(req, res) {
        let props = {artistId: req.params.artistId};
        Object.assign(props, validationConstants);
        res.render('song-upload-view', props);
    }
    /**
     * Vastaanottaa /biisi/uusi -sivun lomakedatan, validoi sen, ja insertoi
     * levylle ja tietokantaan.
     */
    createSong(req, res) {
        const errors = [];
        if (!req.body.name) errors.push('name on pakollinen');
        if (!Object.keys(req.files).length) errors.push('file on pakollinen');
        if (!req.body.genre) errors.push('genre on pakollinen');
        if (!req.body.artistId) errors.push('artistId on pakollinen');
        else if (!isValidFireId(req.body.artistId)) errors.push('artistId ei kelpaa');
        if (req.body.sneakySneaky.length) errors.push('oletko robotti?');
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
            .then(result => {
                res.send(result.insertId);
            })
            .catch(err => {
                log.error('Failed to upload song', err.stack);
                res.status(500).send('-1');
            });
    }
}

exports.SongsControllers = SongsControllers;
