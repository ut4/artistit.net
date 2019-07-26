const {ensureIsLoggedIn} = require('./auth-route-filters.js');
const {songMetasRepository} = require('./song-metas-repository.js');
const {isValidFireId} = require('./validation.js');
const {apiCommons} = require('./api-commons.js');

class SongMetasControllers {
    static registerRoutes(app) {
        const makeCtrl = () => new SongMetasControllers(songMetasRepository);
        // roles: all
        app.get('/api/song-metas/trending',
            (a, b) => makeCtrl().getTrendingSongs(a, b));
        app.get('/api/song-metas/by-artist/:artistId',
            (a, b) => makeCtrl().getSongsByArtist(a, b));
        app.get('/api/song-metas/by-tag/:tags',
            (a, b) => makeCtrl().getSongsByTags(a, b));
        // roles: authenticatedUsers
        app.put('/api/song-metas/like/:songId', ensureIsLoggedIn(),
            (a, b) => makeCtrl().updateSongLikes(a, b));
        app.post('api/song-metas', ensureIsLoggedIn(),
            (a, b) => makeCtrl().createSong(a, b));
        app.put('/api/song-metas/:songId', ensureIsLoggedIn(),
            (a, b) => makeCtrl().updateSong(a, b));
    }
    constructor(songRepo) {
        this.songRepo = songRepo;
    }
    getTrendingSongs(req, res) {
        res.rend(JSON.stringify([
            {id:1,name:'Song 1',artist:'Artist'},
            {id:2,name:'Song 2',artist:'Artist'},
        ]));
    }
    getSongsByArtist(req, res) {
        if (!isValidFireId(req.params.artistId)) {
            apiCommons.sendError(res, 'artistId is not valid');
            return;
        }
        this.songRepo.getSongsByArtist(req.params.artistId).then(songs => {
            if (!songs.err) res.send(songs);
            else apiCommons.sendError(res, songs.err, 500);
        });
    }
    getSongsByTags(req, res) {
        res.send('findSongs(' + req.params.tags.split(',') + ')');
    }
    // roles: authenticatedUsers
    updateSongLikes(req, res) {
        'findSong(songId).likes += 1'
        res.send('{"status":"ok"}');
    }
    createSong(req, res) {
        res.send('insertSong(name, artistId, tags, annotations)');
    }
    updateSong(req, res) {
        let song = 'findSong(id = songId and artistId = loggedInArtistId)';
        res.send('updateSong(name, artistId, tags, annotations)');
    }
}

exports.SongMetasControllers = SongMetasControllers;
