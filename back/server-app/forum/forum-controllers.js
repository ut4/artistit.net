/*
 * Tässä tiedostossa:
 *
 * Handlerit /foorumi-alkuisille reiteille.
 */

const log = require('loglevel');
const {threadsRepository} = require('./threads-repository.js');

class ForumControllers {
    static registerRoutes(app, baseUrl) {
        const makeCtrl = () => new ForumControllers(threadsRepository);
        // roles: all
        app.get(baseUrl + 'foorumi',
            (a, b) => makeCtrl().renderMainView(a, b));
        app.get(baseUrl + 'foorumi/alue/:topicId',
            (a, b) => makeCtrl().renderTopicView(a, b));
        app.get(baseUrl + 'foorumi/lanka/:threadId',
            (a, b) => makeCtrl().renderThreadView(a, b));
    }
    constructor(threadsRepo) {
        this.threadsRepo = threadsRepo;
    }
    /**
     * GET /foorumi: Renderöi foorumin päänäkymän (lista aihe-alueista (Topics),
     * jossa jokaisessa linkki kolmeen uusimpaan kyseisen alueen threadiin).
     */
    renderMainView(_req, res) {
        this.threadsRepo.getTopicsWithLatestThreads()
            .then(topics => {
                res.render('forum/forum-main-view', {topics});
            })
            .catch(err => {
                log.error('Thread-alueiden haku epäonnistui', err.stack);
                res.render('forum/forum-main-view', {topics: null});
            });
    }
    /**
     * GET /foorumi/alue/:topicId: Renderöi yhden alueen threadit paginoituna.
     */
    renderTopicView(req, res) {
        res.send('todo ' + req.params.topicId);
    }
    /**
     * GET /foorumi/lanka/:threadId: Renderöi yhden threadin postaukset
     * paginoituna.
     */
    renderThreadView(req, res) {
        res.send('todo ' + req.params.threadId);
    }
}

exports.ForumControllers = ForumControllers;
