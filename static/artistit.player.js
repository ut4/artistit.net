/*
 * Tässä tiedostossa: window.artistit.Player.
 */

/* eslint-disable strict */
(function() {
'use strict';
/**
 * @param {HTMLElement} rootEl
 * @param {PlayerEvents} events
 */
function Player(rootEl, events) {
    var playPauseBtn = rootEl.querySelector('.play');
    var progressEl = rootEl.querySelector('.progress');
    var iconEl = playPauseBtn.querySelector('use');
    var state = {playing: false, paused: false};
    var song = {
        id: rootEl.getAttribute('data-song-id'),
        duration: parseFloat(rootEl.getAttribute('data-song-duration')),
        /** @prop {HTMLAudioElement} */
        audioEl: rootEl.querySelector('audio')
    };
    var self = this;
    this.clicksValueEl = rootEl.querySelector('.clicks');
    playPauseBtn.addEventListener('click', function() {
        if (!state.playing) {
            song.audioEl.play();
            changeIcon(iconEl, 'play', 'pause');
            if (!state.paused) events.onStart(song, self);
        } else {
            song.audioEl.pause();
            changeIcon(iconEl, 'pause', 'play');
            events.onPause(song, self);
        }
        state.playing = !state.playing;
        state.paused = !state.playing;
    });
    song.audioEl.addEventListener('timeupdate', function() {
        progressEl.textContent = parseInt(
            song.audioEl.currentTime / song.duration * 100, 10) + '%';
        events.onTimeUpdate(song, self);
    });
    song.audioEl.addEventListener('ended', function() {
        changeIcon(iconEl, 'pause', 'play');
        state.playing = false;
        state.paused = false;
        events.onEnd(song, self);
    });
}
/**
 * Lisää biisin kuuntelukertoja yhdellä.
 */
Player.prototype.increasePlayClickCount = function() {
    this.clicksValueEl.textContent = parseInt(this.clicksValueEl.textContent, 10) + 1;
};

function changeIcon(iconEl, from, to) {
    iconEl.setAttribute('xlink:href',
        iconEl.getAttribute('xlink:href').replace(from, to));
}
window.artistit.Player = Player;
}());