/*
 * Tässä tiedostossa:
 *
 * Rutiinit, jotka tarjoilee datan artistisivun eri tabeille (seinä, biisit,
 * keikat jne.)
 */

const log = require('loglevel');
const preact = require('preact');
const render = require('preact-render-to-string');
const {songsRepository} = require('../song/songs-repository.js');
const widgetRenderers = {
    'info-box': require('./wall-widget-info-box.js').InfoBox,
    'twitter-feed': require('./wall-widget-twitter-feed').TwitterFeed,
};

class ArtistViewTabLoaders {
    constructor(songsRepo) {
        this.songsRepo = songsRepo;
        this.tabNameToLoaderMethodName = {
            'seinä': 'loadFeedTabData',
            'biisit': 'loadSongsTabData',
        };
    }
    /**
     * Lataa artistisivun $tabName-tabille datan, ja tarjoilee sen callbackiin.
     * Jos $tabName on virheellinen, palauttaa oletustabin (seinä) datan.
     *
     * @param {string} tabName 'seinä'|'biisit'
     * @param {Artist|{}} artist
     * @param {express.Request} req
     * @param {(data: Object|{}, normalizedTabName: string) => any} then
     * @access public
     */
    loadDataFor(tabName, artist, req, then) {
        let loaderMethodName = this.tabNameToLoaderMethodName[tabName];
        let normalizedTabName = tabName;
        if (!loaderMethodName) {
            loaderMethodName = this.tabNameToLoaderMethodName['seinä'];
            normalizedTabName = 'seinä';
        }
        if (artist.id) {
            this[loaderMethodName](artist, req, data => {
                then(data, normalizedTabName);
            });
        } else {
            then({}, normalizedTabName);
        }
    }
    /**
     * Lataa artistisivun seinä-tabin datan.
     *
     * @param {Artist} artist
     * @param {express.Request} req
     * @param {(data: Object) => any} then
     * @access private
     */
    loadFeedTabData(artist, req, then) {
        // Note: artist.widgets-json sisältää itsessään jo widgetin tarvitseman
        // datan, joten erillisiä tietokantahakuja ei tässä kohtaa tarvita
        then({widgets: JSON.parse(artist.widgets),
              renderWidget: w => render(
                  preact.createElement(widgetRenderers[w.type], w.data)
              )
            });
    }
    /**
     * Lataa artistisivun biisit-tabin datan.
     *
     * @param {Artist} artist
     * @param {express.Request} req
     * @param {(data: Object) => any} then
     * @access private
     */
    loadSongsTabData(artist, req, then) {
        this.songsRepo.getSongsByArtist(artist.id, req.user.id || req.ip)
            .then(songs => {
                then({songs});
            })
            .catch(err => {
                log.error('Failed to fetch songs', err.stack);
                then({songs: []});
            });
    }
}

exports.artistViewTabLoaders = new ArtistViewTabLoaders(songsRepository);