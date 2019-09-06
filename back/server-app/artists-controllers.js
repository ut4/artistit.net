/*
 * Tässä tiedostossa:
 *
 * Handlerit /artisti-alkuisille reiteille.
 */

const log = require('loglevel');
const {ensureIsLoggedIn, ensureHasContentType} = require('./route-filters.js');
const {artistsRepository} = require('./artists-repository.js');
const {artistViewTabLoaders} = require('./artist-view-tab-loaders.js');
const {isValidFireId} = require('./validation.js');
const {renderError} = require('./templating.js');
const config = require('../config.js');
const validationConstants = {
    maxArtistNameLen: 128,
    maxTaglineLen: 512,
};

class ArtistsControllers {
    static registerRoutes(app, baseUrl) {
        const makeCtrl = () => new ArtistsControllers(artistsRepository,
                                                      artistViewTabLoaders);
        // roles: authenticatedUsers
        app.get(baseUrl + 'artisti/uusi', ensureIsLoggedIn(),
            (a, b) => makeCtrl().newArtistView(a, b));
        app.post(baseUrl + 'artisti', ensureIsLoggedIn(), ensureHasContentType(),
            (a, b) => makeCtrl().createArtist(a, b));
        app.get(baseUrl + 'artisti/muokkaa/:artistId', ensureIsLoggedIn(),
            (a, b) => makeCtrl().editArtistView(a, b));
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
     * GET /artisti/:artistId: Renderöi artistisivun.
     */
    indexView(req, res) {
        if (!isValidFireId(req.params.artistId)) {
            renderError('Virheellinen id', res, 500);
            return;
        }
        this.fetchArtist(req, res, artist => {
            this.tabLoader.loadDataFor(req.query['näytä'], artist,
                (tabData, tabName) => {
                    res.render('artist-index-view', {artist, tabName, tabData});
                });
        });
    }
    /**
     * GET /artisti/uusi: Renderöi artistin luonti -lomakkeen.
     */
    newArtistView(req, res) {
        res.render('artist-create-view', validationConstants);
    }
    /**
     * POST /artisti: Vastaanottaa /artisti/uusi -sivun lomakedatan, validoi sen,
     * ja insertoi tietokantaan.
     */
    createArtist(req, res) {
        const errors = [];
        if (!req.body.name) errors.push('name on pakollinen');
        if (!req.body.userId) errors.push('userId on pakollinen');
        else if (req.body.userId != req.user.id) errors.push('userId ei kelpaa');
        if (!req.body.hasOwnProperty('sneakySneaky') ||
            req.body.sneakySneaky.length) errors.push('oletko robotti?');
        if (errors.length) {
            res.status(400).send(errors.join('\n'));
            return;
        }
        //
        this.repo.insertArtist({
            name: req.body.name,
            tagline: req.body.tagline || null,
            userId: req.body.userId
        })
        .then(result => {
            res.send(result.insertId.toString());
        })
        .catch(err => {
            log.error('Artistin lisäys tietokantaan epäonnistui', err.stack);
            res.status(500).send('-1');
        });
    }
    /**
     * GET /artisti/muokkaa/:artistId: Renderöi artistin muokkaus -lomakkeen.
     */
    editArtistView(req, res) {
        this.fetchArtist(req, res, artist => {
            if (artist.userId == req.user.id) {
                res.render('artist-edit-view',
                           Object.assign({artist}, validationConstants));
            } else {
                log.warn('Muokattava artisti (' + req.body.artistId +
                         ') ei kuulunut kirjaantuneelle käyttäjälle (' +
                         req.user.id + ')!!');
                req.redirect(config.baseUrl);
            }
        });
    }
    /**
     * PUT /artisti: Vastaanottaa /artisti/muokkaa -sivun lomakedatan, validoi sen,
     * ja päivittää tietokantaan.
     */
    updateArtist(req, res) {
        const errors = [];
        if (!req.body.name) errors.push('name on pakollinen');
        if (!req.body.id) errors.push('id on pakollinen');
        else if (!isValidFireId(req.body.id)) errors.push('id ei kelpaa');
        if (!req.body.hasOwnProperty('tagline')) errors.push('tagline on pakollinen');
        if (!req.body.widgets) errors.push('widgets on pakollinen');
        if (!req.body.hasOwnProperty('sneakySneaky') ||
            req.body.sneakySneaky.length) errors.push('oletko robotti?');
        if (errors.length) {
            res.status(400).send(errors.join('\n'));
            return;
        }
        //
        this.repo.updateArtist(req.body.id, req.user.id, {
            name: req.body.name,
            tagline: req.body.tagline,
            widgets: req.body.widgets,
        })
        .then(result => {
            res.send(result.affectedRows.toString());
        })
        .catch(err => {
            log.error('Artistin päivittäminen tietokantaan epäonnistui', err.stack);
            res.status(500).send('-1');
        });
    }
    /**
     * @access private
     */
    fetchArtist(req, res, then) {
        this.repo.getArtistById(req.params.artistId)
            .then(then)
            .catch(err => {
                log.error('Artistin haku tietokannasta epäonnistui', err.stack);
                res.redirect(config.baseUrl);
            });
    }
}

exports.ArtistsControllers = ArtistsControllers;
