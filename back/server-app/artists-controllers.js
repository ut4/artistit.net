/*
 * Tässä tiedostossa:
 *
 * Handlerit /artisti-alkuisille reiteille.
 */

const log = require('loglevel');
const {ensureIsLoggedIn, ensureHasContentType} = require('./route-filters.js');
const {artistsRepository} = require('../artists-repository.js');
const {artistViewTabLoaders} = require('./artist-view-tab-loaders.js');
const {isValidFireId} = require('../validation.js');
const {renderError} = require('./templating.js');
const config = require('../config.js');

class ArtistsControllers {
    static registerRoutes(app, baseUrl) {
        const makeCtrl = () => new ArtistsControllers(artistsRepository,
                                                      artistViewTabLoaders);
        // roles: authenticatedUsers
        app.get(baseUrl + 'artisti/uusi', ensureIsLoggedIn(),
            (a, b) => makeCtrl().newArtistView(a, b));
        app.post(baseUrl + 'artisti', ensureIsLoggedIn(), ensureHasContentType(),
            (a, b) => makeCtrl().createArtist(a, b));
        app.put(baseUrl + 'artisti', ensureIsLoggedIn(), ensureHasContentType(),
            (a, b) => makeCtrl().updateArtist(a, b));
        // roles: all
        app.get(baseUrl + 'artisti/:artistId',
            (a, b) => makeCtrl().indexView(a, b));
    }
    /**
     * @param {ArtistRepository} repo
     * @param {ArtistViewTabLoaders} tabLoader
     */
    constructor(repo, tabLoader) {
        this.repo = repo;
        this.tabLoader = tabLoader;
    }
    /**
     * Renderöi artistisivun.
     */
    indexView(req, res) {
        if (!isValidFireId(req.params.artistId)) {
            renderError('Virheellinen id', res, 500);
            return;
        }
        this.repo.getArtistById(req.params.artistId).then(artist => {
            this.tabLoader.loadDataFor(req.query['näytä'], artist,
                (tabData, tabName) => {
                    res.render('artist-index-view', {artist, tabName, tabData});
                });
        }).catch(err => {
            log.error('Failed to fetch artist from db', err.stack);
            res.redirect(config.baseUrl);
        });
    }
    /**
     * Renderöi artistin luonti -lomakkeen.
     */
    newArtistView(req, res) {
        res.render('artist-create-view');
    }
    /**
     * Vastaanottaa /artisti/uusi -sivun lomakedatan, validoi sen, ja insertoi
     * tietokantaan.
     */
    createArtist(req, res) {
        const errors = [];
        if (!req.body.name) errors.push('name is required');
        if (!req.body.userId) errors.push('userId is required');
        else if (req.body.userId != req.user.id) errors.push('userId is not valid');
        if (req.body.sneakySneaky.length) errors.push('absolutely no robots');
        if (errors.length) {
            res.status(400).send(errors.join('\n'));
            return;
        }
        //
        this.repo.insertArtist({
            name: req.body.name,
            tagLine: req.body.tagLine || null,
            userId: req.body.userId
        }).then(result => {
            res.send(result.insertId);
        }).catch(err => {
            log.error('Failed to write artist to db', err.stack);
            res.status(500).send('-1');
        });
    }
    /**
     * ...
     */
    updateArtist(req, res) {
        res.send({todo: 'update(name, headerImage, headerTagLine, widgets)'});
    }
}

exports.ArtistsControllers = ArtistsControllers;
