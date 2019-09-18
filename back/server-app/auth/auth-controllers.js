/*
 * Tässä tiedostossa:
 *
 * Handlerit /auth-alkuisille reiteille (/kirjaudu, /ulos, /github jne.).
 */

const log = require('loglevel');
const passport = require('passport');
const GitHubAuth = require('passport-github').Strategy;
const config = require('../../config.js');
const {authUserRepository} = require('./auth-user-repository.js');

const AuthProviders = {
    GITHUB: 0
};

class AuthControllers {
    static registerMiddleware(app) {
        passport.use(new GitHubAuth(
            {
                clientID: config.githubClientID,
                clientSecret: config.githubClientSecret,
                callbackURL: 'http://artistit.net' + config.githubCallbackURL
            },
            (_accessToken, _refreshToken, profile, cb) => {
                authUserRepository.getUser(AuthProviders.GITHUB, profile.id)
                    .then(user => user || authUserRepository.createUser(
                        AuthProviders.GITHUB,
                        profile.id
                    ))
                    .then(user => {
                        cb(null, user);
                    })
                    .catch(err => {
                        log.error('Käyttäjän haku tietokannasta epäonnistui.', err.stack);
                        cb(err, null);
                    });
            }
        ));
        passport.serializeUser((user, cb) => {
            cb(null, user.id);
        });
        passport.deserializeUser((id, cb) => {
            cb(null, {id});
        });
        app.use(passport.initialize());
        app.use(passport.session());
    }
    static registerRoutes(app, baseUrl) {
        const makeCtrl = () => new AuthControllers(app);
        // roles: all
        app.get(baseUrl + 'auth/github', passport.authenticate('github'));
        app.get(config.githubCallbackURL,
            passport.authenticate('github', {failureRedirect: baseUrl + 'auth/kirjaudu?fail=1'}),
            (req, res) => {
                app.locals.user = req.user;
                res.redirect(baseUrl + '?kirjauduttu=1');
            }
        );
        // roles: all
        app.get(baseUrl + 'auth/kirjaudu', (a, b) => makeCtrl().loginView(a, b));
        app.get(baseUrl + 'auth/ulos', (a, b) => makeCtrl().logout(a, b));
    }
    /**
     * @param {App} app
     */
    constructor(app) {
        this.app = app;
    }
    /**
     * Renderöi kirjautumissivun.
     */
    loginView(_req, res) {
        res.render('auth/auth-login-view');
    }
    /**
     * ...
     */
    logout(req, res) {
        req.logout();
        this.app.locals.user = {};
        res.redirect(config.baseUrl + '?kirjauduttu=0');
    }
}

exports.AuthControllers = AuthControllers;
