const passport = require('passport');
const GitHubAuth = require('passport-github').Strategy;
const config = require('./config.js');
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
                    .then(user => {
                        return user || authUserRepository.createUser(
                            AuthProviders.GITHUB,
                            profile.id
                        );
                    })
                    .then(user => {
                        if (!user.err) cb(null, user);
                        else cb(user.err, null);
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
    static registerRoutes(app) {
        // roles: all
        app.get('/api/auth/github', passport.authenticate('github'));
        app.get(config.githubCallbackURL,
            passport.authenticate('github', {failureRedirect: '/index.html#/kirjaudu?fail=1'}),
            (_req, res) => {
                res.redirect('/index.html#/?kirjauduttu=1');
            }
        );
    }
}

exports.AuthControllers = AuthControllers;
