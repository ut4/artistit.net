const {ensureIsLoggedIn} = require('./auth-route-filters.js');
const {artistsRepository} = require('./artists-repository.js');
const {isValidFireId} = require('./validation.js');
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
        this.repo.getArtistById(req.params.artistId).then(artist => {
            if (!artist) apiCommons.sendError(res, 'Didn\'t find anything.', 404);
            else if (!artist.err) res.send(artist);
            else apiCommons.sendError(res, artist.err, 500);
        });
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
