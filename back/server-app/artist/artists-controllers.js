/*
 * Tässä tiedostossa:
 *
 * Handlerit /artisti-alkuisille reiteille.
 */

const ejs = require('ejs');
const log = require('loglevel');
const {ensureIsLoggedIn, ensureHasContentType} = require('../common/route-filters.js');
const {artistsRepository} = require('./artists-repository.js');
const {artistViewTabLoaders} = require('./artist-view-tab-loaders.js');
const {isValidFireId} = require('../common/validation.js');
const {renderError} = require('../common/templating.js');
const config = require('../../config.js');
const validationConstants = {
    maxArtistNameLen: 128,
    maxTaglineLen: 512,
};
const widgetDefaults = {
    'info-box': {icon: 'info', title: 'Meistä'},
    'twitter-feed': {icon: 'twitter', title: 'Twitter'},
};
const readTemplate = name => ejs.fileLoader(__dirname + name + '.ejs',
                                            {encoding: 'utf-8'});

class ArtistsControllers {
    static registerRoutes(app, baseUrl) {
        const makeCtrl = () => new ArtistsControllers(artistsRepository,
                                                      artistViewTabLoaders);
        // roles: authenticatedUsers
        app.get(baseUrl + 'artisti/uusi', ensureIsLoggedIn(),
            (a, b) => makeCtrl().newArtistView(a, b));
        app.post(baseUrl + 'artisti/uusi', ensureIsLoggedIn(), ensureHasContentType(),
            (a, b) => makeCtrl().createArtist(a, b));
        app.get(baseUrl + 'artisti/muokkaa/:artistId', ensureIsLoggedIn(),
            (a, b) => makeCtrl().editArtistView(a, b));
        app.post(baseUrl + 'artisti/muokkaa', ensureIsLoggedIn(), ensureHasContentType(),
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
            this.tabLoader.loadDataFor(req.query['näytä'], artist, req,
                (tabData, tabName) => {
                    res.render('artist/artist-index-view',
                               {artist, tabName, tabData, widgetDefaults});
                });
        });
    }
    /**
     * GET /artisti/uusi: Renderöi artistin luonti -lomakkeen.
     */
    newArtistView(req, res) {
        res.render('artist/artist-create-view',
                   Object.assign({widgetDefaults, readTemplate,
                                  errorCode: req.query.error},
                                  validationConstants));
    }
    /**
     * POST /artisti/uusi: Vastaanottaa /artisti/uusi -sivun lomakedatan,
     * validoi sen, ja insertoi tietokantaan.
     */
    createArtist(req, res) {
        const errors = [];
        if (!req.body.name) errors.push('name on pakollinen');
        if (!req.body.widgets) errors.push('widgets on pakollinen');
        else if (!isValidWidgetsJson(req.body.widgets)) errors.push('widgets ei kelpaa');
        if (errors.length) {
            res.status(400).send(errors.join('\n'));
            return;
        }
        //
        this.repo.insertArtist({
            name: req.body.name,
            tagline: req.body.tagline || null,
            widgets: req.body.widgets,
            userId: req.user.id
        })
        .then(result => {
            res.redirect('/artisti/' + result.insertId.toString());
        })
        .catch(err => {
            log.error('Artistin lisäys tietokantaan epäonnistui', err.stack);
            res.redirect('/artisti/uusi?error=-1');
        });
    }
    /**
     * GET /artisti/muokkaa/:artistId: Renderöi artistin muokkaus -lomakkeen.
     */
    editArtistView(req, res) {
        this.fetchArtist(req, res, artist => {
            if (artist.userId == req.user.id) {
                res.render('artist/artist-edit-view',
                           Object.assign({artist, widgetDefaults, readTemplate,
                                          errorCode: req.query.error},
                                          validationConstants));
            } else {
                log.warn('Muokattava artisti (' + req.body.artistId +
                         ') ei kuulunut kirjaantuneelle käyttäjälle (' +
                         req.user.id + ')!!');
                req.redirect(config.baseUrl);
            }
        });
    }
    /**
     * POST /artisti/muokkaa: Vastaanottaa /artisti/muokkaa -sivun lomakedatan,
     * validoi sen, ja päivittää tietokantaan.
     */
    updateArtist(req, res) {
        const errors = [];
        if (!req.body.name) errors.push('name on pakollinen');
        if (!req.body.id) errors.push('id on pakollinen');
        else if (!isValidFireId(req.body.id)) errors.push('id ei kelpaa');
        if (!req.body.hasOwnProperty('tagline')) errors.push('tagline on pakollinen');
        if (!req.body.widgets) errors.push('widgets on pakollinen');
        else if (!isValidWidgetsJson(req.body.widgets)) errors.push('widgets ei kelpaa');
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
        .then(() => {
            res.redirect('/artisti/' + req.body.id);
        })
        .catch(err => {
            log.error('Artistin päivittäminen tietokantaan epäonnistui', err.stack);
            res.redirect('/artisti/muokkaa/' + req.body.id + '?error=-1');
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

/**
 * @param {string} json
 * @returns {boolean}
 */
function isValidWidgetsJson(json) {
    try {
        const widgets = JSON.parse(json);
        // todo, validoi kunnolla
        return Array.isArray(widgets);
    } catch (e) {
        return false;
    }
}

exports.ArtistsControllers = ArtistsControllers;
exports.isValidWidgetsJson = isValidWidgetsJson;
