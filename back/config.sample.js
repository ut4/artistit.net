(function(config) {
    if (typeof window == "undefined")
        module.exports = config;
    else
        window.artistitEnvConfig = config;
}({
    baseUrl: '/',
    staticBaseUrl: '/static/',
    staticDirPath: '/var/www/html/static/',
    dbHost: '127.0.0.1',
    dbDatabase: 'kannanNimi',
    dbUser: 'user',
    dbPassword: 'pass',
    sessionSecret: 'merkkijono',
    githubClientID: 'abc.cde...',
    githubClientSecret: '1234...',
    githubCallbackURL: '/url/foo/',
    facebookClientID: 'abc...',
    facebookClientSecret: '1234...',
    facebookCallbackURL: '/url/foo/',
    demoUserId: '-abcdefghijklmnopqrs',
}));
