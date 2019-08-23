const {ensureIsLoggedIn} = require('./route-filters.js');
const {artistsRepository} = require('../server-app/artists-repository.js');
const {isValidFireId} = require('../server-app/validation.js');
const {apiCommons} = require('./api-commons.js');

class ArtistsControllers {
    static registerRoutes(app) {
        const makeCtrl = () => new ArtistsControllers(artistsRepository);
        // roles: all
        app.get('/api/artists/:artistId',
            (a, b) => makeCtrl().getArtist(a, b));
        // roles: authenticatedUsers
        app.post('/api/artists', ensureIsLoggedIn(),
            (a, b) => makeCtrl().createArtist(a, b));
        app.put('/api/artists', ensureIsLoggedIn(),
            (a, b) => makeCtrl().updateArtist(a, b));
    }
    /**
     * @param {ArtistRepository} repo
     */
    constructor(repo) {
        this.repo = repo;
    }
    /**
     * Response:
     * 200 {Artist}
     * 400|500 {err: 'viesti'}
     */
    getArtist(req, res) {
        if (!isValidFireId(req.params.artistId)) {
            apiCommons.sendError(res, 'Invalid artistId');
            return;
        }
        this.repo.getArtistById(req.params.artistId)
            .then(artist => {
                if (artist.id) res.send(artist);
                else apiCommons.sendError(res, 'Didn\'t find anything.', 404);
            })
            .catch(err => {
                apiCommons.sendError(res, err, 500); // ??
            });
    }
    /**
     * ...
     */
    createArtist(req, res) {
        res.send({todo: 'insert(name, headerImage, headerTagline, widgets)'});
    }
    /**
     * ...
     */
    updateArtist(req, res) {
        res.send({todo: 'update(name, headerImage, headerTagline, widgets)'});
    }
}

exports.ArtistsControllers = ArtistsControllers;
