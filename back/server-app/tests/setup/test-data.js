/*
 * Tässä tiedostossa:
 *
 * mm. tietokantaan liittyvissä testeissä käytettävä data.
 */

const config = require('../../../config.js');

module.exports = {
    user: {
        id: config.demoUserId,
    },
    artist: {
        id: '-123456789abcdefghij',
        name: 'artistinnimi',
        tagline: 'tagline',
        coverPhoto: null,
        widgets: '[]',
        createdAt: Math.floor(Date.now() / 1000),
        userId: config.demoUserId,
    },
    song: {
        id: '-Lkbki8w-8PgWYRje-ta',
    }
};
