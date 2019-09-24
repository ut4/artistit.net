/*
 * Tässä tiedostossa:
 *
 * Handlerit artisti/:artistId/render-widget -alkuisille reiteille.
 */

const log = require('loglevel');
const {Twitter} = require('../../TwitterJSClient/index.js');
const config = require('../../config.js');
let tweetsRepository;

class WidgetRenderControllers {
    static registerRoutes(app, baseUrl) {
        const makeCtrl = () => new WidgetRenderControllers(tweetsRepository);
        // roles: all
        app.post(baseUrl + 'artisti/:artistId/render-widget/tweets/:userName',
            (a, b) => makeCtrl().renderTweetsWidget(a, b));
    }
    /**
     * @param {TwitterRepository} twitterRepo
     */
    constructor(twitterRepo) {
        this.repo = twitterRepo;
    }
    /**
     * POST /artisti/:artistId/render-widget/tweets/:userName: renderöi
     * twitter-feed -widgetin / käyttäjän twitter-aikajanan.
     */
    renderTweetsWidget(req, res) {
        this.repo.fetchTweets(req.params.userName, req.query.last)
            .then(tweets => {
                res.render('artist/wall-widget-tweets', {tweets});
            })
            .catch(err => {
                log.error('Tweettien haku epäonnistui: ' + err.stack);
                res.status(500).send('-1');
            });
    }
}

////////////////////////////////////////////////////////////////////////////////

let twitterClientSingleton = null;

class TweetsRepository {
    constructor(twitterClient) {
        if (!twitterClient && !twitterClientSingleton) {
            twitterClientSingleton = new Twitter({
                twitterConsumerKey: config.twitterConsumerKey,
                twitterConsumerSecret: config.twitterConsumerSecret,
                twitterCallBackUrl: config.twitterCallbackURL,
            });
        }
        this.client = twitterClient || twitterClientSingleton;
    }
    /**
     * Palauttaa käyttäjän $userName aikajana-tweettejä 20 kerrallaan uusimmasta
     * vanhimpaan alkaen uusimmasta tai $last:sta.
     *
     * @param {string} userName
     * @param {string} last
     */
    fetchTweets(userName, last) {
        let params = {screen_name: userName, count: '20', include_rts: 1};
        if (last) params.since_id = last;
        return new Promise((resolve, reject) => {
            this.client.getUserTimeline(params,
                (err, _response, _body) => {
                    reject(new Error(JSON.stringify(err)));
                }, data => {
                    resolve(JSON.parse(data).map(makeTweet));
                });
        });
    }
}
function makeTweet(row) {
    return {
        text: row.text,
        tweetedAt: new Date(row.created_at),
        user: {
            name: row.user.name,
            profileName: row.user.screen_name,
            imageUrl: row.user.profile_image_url_https,
        },
        hashtags: row.entities.hashtags,
        media: (row.entities.media || []).map(media =>
            ({imageUrl: media.media_url_https})
        ),
        geo: row.geo,
        coordinates: row.coordinates,
        place: row.place,
    };
}
tweetsRepository = new TweetsRepository();

exports.WidgetRenderControllers = WidgetRenderControllers;
