/*
 * Tässä tiedostossa:
 *
 * Handlerit /auth-alkuisille reiteille (/kirjaudu, /ulos, /github jne.).
 */

const log = require('loglevel');
const passport = require('passport');
const GitHubAuth = require('passport-github').Strategy;
const FacebookAuth = require('passport-facebook').Strategy;
const config = require('../../config.js');
const {authUserRepository, AuthProviders} = require('./auth-user-repository.js');

class AuthControllers {
    static registerMiddleware(app) {
        AuthControllers.registerGithubAuthMiddleware();
        AuthControllers.registerFacebookAuthMiddleware();
        //
        passport.serializeUser((user, cb) => {
            cb(null, user.id);
        });
        passport.deserializeUser((id, cb) => {
            cb(null, {id});
        });
        app.use(passport.initialize());
        app.use(passport.session());
    }
    static registerGithubAuthMiddleware() {
        passport.use(new GitHubAuth({
            clientID: config.githubClientID,
            clientSecret: config.githubClientSecret,
            callbackURL: 'https://artistit.net' + config.githubCallbackURL
        }, (_accessToken, _refreshToken, profile, cb) => {
            getOrCreateAuthUser(AuthProviders.GITHUB, profile, cb);
        }));
    }
    static registerFacebookAuthMiddleware() {
        passport.use(new FacebookAuth({
            clientID: config.facebookClientID,
            clientSecret: config.facebookClientSecret,
            callbackURL: 'https://artistit.net' + config.facebookCallbackURL
        }, (_accessToken, _refreshToken, profile, cb) => {
            getOrCreateAuthUser(AuthProviders.FACEBOOK, profile, cb);
        }));
    }
    static registerRoutes(app, baseUrl) {
        const makeCtrl = () => new AuthControllers(app);
        const authFailUrl = baseUrl + 'auth/kirjaudu?fail=1';
        const onAuthSuccess = (req, res) => {
            app.locals.user = req.user;
            res.redirect(baseUrl + '?kirjauduttu=1');
        };
        // roles: all
        app.get(baseUrl + 'auth/kirjaudu', (a, b) => makeCtrl().loginView(a, b));
        app.get(baseUrl + 'auth/ulos', (a, b) => makeCtrl().logout(a, b));
        //
        app.get(baseUrl + 'auth/github', passport.authenticate('github'));
        app.get(config.githubCallbackURL,
            passport.authenticate('github', {failureRedirect: authFailUrl}),
            onAuthSuccess
        );
        app.get(baseUrl + 'auth/facebook', passport.authenticate('facebook'));
        app.get(config.facebookCallbackURL,
            passport.authenticate('facebook', {failureRedirect: authFailUrl}),
            onAuthSuccess);
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

/**
 * @param {number} providerId esim. AuthProviders.GITHUB
 * @param {{id: string;}} profile Autentikointipalvelun tarjoamat tiedot
 * @param {(err: Object, user: Object): any} then
 */
function getOrCreateAuthUser(providerId, profile, then) {
    return authUserRepository.getUser(providerId, profile.id)
        .then(user => user || authUserRepository.createUser(
            providerId,
            profile.id
        ))
        .then(user => {
            then(null, user);
        })
        .catch(err => {
            log.error('Käyttäjän haku tietokannasta epäonnistui.', err.stack);
            then(err, null);
        });
}

exports.AuthControllers = AuthControllers;
exports.getOrCreateAuthUser = getOrCreateAuthUser;
exports.AuthProviders = AuthProviders;
