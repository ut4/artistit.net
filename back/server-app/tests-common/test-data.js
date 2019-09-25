/*
 * Tässä tiedostossa:
 *
 * mm. tietokantaan liittyvissä testeissä käytettävä data.
 */

const config = require('../../config.js');
const {AuthProviders} = require('../auth/auth-user-repository.js');

module.exports = {
    user: {
        id: config.demoUserId,
    },
    connectedAuthAccount: {
        providerId: AuthProviders.GITHUB,
        identity: '1234',
        userId: config.demoUserId,
    },
    artist: {
        id: '-123456789abcdefghij',
        name: 'artistinnimi',
        tagline: 'tagline',
        coverPhoto: null,
        widgets: [{type:'info-box',data:{infos:[{title:'Jäsenet',text:'Foo'}]}},
                  {type:'twitter-feed',data:{userName:'TwitterDev',useCustomImpl:true}}],
        createdAt: Math.floor(Date.now() / 1000),
        userId: config.demoUserId,
    },
    song: {
        id: '-Lkbki8w-8PgWYRje-ta',
    }
};
