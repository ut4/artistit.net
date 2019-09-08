/*
 * Tässä tiedostossa:
 *
 * Handlerit artistit.netin etusivulle, ja muille info-sivuille.
 */

class AppControllers {
    static registerRoutes(app, baseUrl) {
        const makeCtrl = () => new AppControllers();
        // roles: all
        app.get(baseUrl, (a, b) => makeCtrl().indexView(a, b));
    }
    /**
     * GET /: Renderöi artistit.netin etusivun.
     */
    indexView(req, res) {
        res.render('app-home-view', {kirjauduttu: req.query.kirjauduttu == '1'});
    }
}

exports.AppControllers = AppControllers;
