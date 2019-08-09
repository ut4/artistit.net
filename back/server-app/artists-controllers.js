/*
 * Tässä tiedostossa:
 *
 * Handlerit /artisti-alkuisille reiteille.
 */

const {ensureIsLoggedIn} = require('./auth-route-filters.js');
const {artistsRepository} = require('../artists-repository.js');
const {isValidFireId} = require('../validation.js');
const {renderError} = require('./templating.js');

class ArtistsControllers {
    static registerRoutes(app, baseUrl) {
        const makeCtrl = () => new ArtistsControllers(artistsRepository);
        // roles: authenticatedUsers
        app.get(baseUrl + 'artisti/uusi', ensureIsLoggedIn(),
            (a, b) => makeCtrl().newArtistView(a, b));
        app.post(baseUrl + 'artisti', ensureIsLoggedIn(),
            (a, b) => makeCtrl().createArtist(a, b));
        app.put(baseUrl + 'artisti', ensureIsLoggedIn(),
            (a, b) => makeCtrl().updateArtist(a, b));
        // roles: all
        app.get(baseUrl + 'artisti/:artistId',
            (a, b) => makeCtrl().indexView(a, b));
    }
    /**
     * @param {ArtistRepository} repo
     */
    constructor(repo) {
        this.repo = repo;
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
            if (!artist || !artist.err)
                res.render('artist-index-view', {artist, tab: req.query.tab});
            else
                renderError(artist.err, res, 500);
        });
    }
    /**
     * ...
     */
    newArtistView(req, res) {
        res.send({todo: 'render(artist-create-view)'});
    }
    /**
     * ...
     */
    createArtist(req, res) {
        res.send({todo: 'insert(name, headerImage, headerTagLine, widgets)'});
    }
    /**
     * ...
     */
    updateArtist(req, res) {
        res.send({todo: 'update(name, headerImage, headerTagLine, widgets)'});
    }
}

exports.ArtistsControllers = ArtistsControllers;
