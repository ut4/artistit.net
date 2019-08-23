/*
 * Tässä tiedostossa:
 *
 * Rutiinit, jotka tarjoilee datan artistisivun eri tabeille (seinä, biisit
 * jne.)
 */

const log = require('loglevel');
const {songsRepository} = require('./songs-repository.js');

class ArtistViewTabLoaders {
    constructor(songsRepo) {
        this.songsRepo = songsRepo;
        this.tabNameToLoaderMethodName = {
            'seinä': 'loadFeedTabData',
            'biisit': 'loadSongsTabData'
        };
    }
    /**
     * Lataa artistisivun $tabName-tabille datan, ja tarjoilee sen callbackiin. Jos
     * $tabName on virheellinen, palauttaa oletustabin (seinä) datan.
     *
     * @param {string} tabName 'seinä'|'biisit'
     * @param {Artist|{}} artist
     * @param {(data: Object|{}, normalizedTabName: string) => any} then
     * @access public
     */
    loadDataFor(tabName, artist, then) {
        let loaderMethodName = this.tabNameToLoaderMethodName[tabName];
        let normalizedTabName = tabName;
        if (!loaderMethodName) {
            loaderMethodName = this.tabNameToLoaderMethodName['seinä'];
            normalizedTabName = 'seinä';
        }
        if (artist.id) {
            this[loaderMethodName](artist, data => {
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
     * @param {(data: Object) => any} then
     * @access private
     */
    loadFeedTabData(artist, then) {
        then({widgets: JSON.parse(artist.widgets)});
    }
    /**
     * Lataa artistisivun biisit-tabin datan.
     *
     * @param {Artist} artist
     * @param {(data: Object) => any} then
     * @access private
     */
    loadSongsTabData(artist, then) {
        this.songsRepo.getSongsByArtist(artist.id)
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
