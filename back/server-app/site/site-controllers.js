/*
 * Tässä tiedostossa:
 *
 * Handlerit artistit.netin omille sivuille (esim. etusivulle).
 */

class SiteControllers {
    static registerRoutes(app, baseUrl) {
        const makeCtrl = () => new SiteControllers();
        // roles: all
        app.get(baseUrl, (a, b) => makeCtrl().indexView(a, b));
    }
    /**
     * GET /: Renderöi artistit.netin etusivun.
     */
    indexView(req, res) {
        res.render('site/site-home-view', {kirjauduttu: req.query.kirjauduttu == '1'});
    }
}

exports.SiteControllers = SiteControllers;
