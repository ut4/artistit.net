const {ensureIsLoggedIn} = require('./auth-route-filters.js');
const {artistsRepository} = require('./artists-repository.js');

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
    constructor(repo) {
        this.repo = repo;
    }
    getArtist(req, res) {
        'findArtist(artisId and isPublic)';
    }
    // roles: authenticatedUsers
    createArtist(req, res) {
        'insert(name, headerImage, headerTagLine, widgets)';
    }
    updateArtist(req, res) {
        'update(name, headerImage, headerTagLine, widgets)';
    }
}

exports.ArtistsControllers = ArtistsControllers;
