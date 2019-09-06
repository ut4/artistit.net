/*
 * Tässä tiedostossa: window.artistit.makePlayer.
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
    var likeBtn = rootEl.querySelector('.like');
    var progressEl = rootEl.querySelector('.progress');
    var iconEl = playPauseBtn.querySelector('use');
    var clicksValueEl = rootEl.querySelector('.clicks');
    var likesValueEl = rootEl.querySelector('.likes');
    var state = {playing: false, paused: false, isLikedByCurrentUser:
                 rootEl.getAttribute('data-song-isLikedByCurrentUser') == 'true'};
    if (state.isLikedByCurrentUser) fillIcon(likeBtn.querySelector('svg'));
    var self = this;
    this.song = {
        id: rootEl.getAttribute('data-song-id'),
        duration: parseFloat(rootEl.getAttribute('data-song-duration')),
        /** @prop {HTMLAudioElement} */
        audioEl: rootEl.querySelector('audio')
    };
    playPauseBtn.addEventListener('click', function() {
        var song = self.song;
        if (!state.playing) {
            song.audioEl.play();
            changeIcon(iconEl, 'play', 'pause');
            if (!state.paused) events.onStart(song, self).then(function(ok) {
                if (ok) clicksValueEl.textContent =
                            parseInt(clicksValueEl.textContent, 10) + 1;
            });
        } else {
            song.audioEl.pause();
            changeIcon(iconEl, 'pause', 'play');
            events.onPause(song, self);
        }
        state.playing = !state.playing;
        state.paused = !state.playing;
    });
    likeBtn.addEventListener('click', function() {
        if (state.isLikedByCurrentUser) return;
        state.isLikedByCurrentUser = true;
        fillIcon(likeBtn.querySelector('svg'));
        events.onLike(self.song, self).then(function(ok) {
            if (ok) likesValueEl.textContent =
                        parseInt(likesValueEl.textContent, 10) + 1;
        });
    });
    this.song.audioEl.addEventListener('timeupdate', function() {
        var song = self.song;
        progressEl.textContent = parseInt(
            song.audioEl.currentTime / song.duration * 100, 10) + '%';
        events.onTimeUpdate(song, self);
    });
    this.song.audioEl.addEventListener('ended', function() {
        changeIcon(iconEl, 'pause', 'play');
        var song = self.song;
        state.playing = false;
        state.paused = false;
        events.onEnd(song, self);
    });
}

function changeIcon(iconEl, from, to) {
    iconEl.setAttribute('xlink:href',
        iconEl.getAttribute('xlink:href').replace(from, to));
}
function fillIcon(svgEl) {
    svgEl.classList.add('filled');
}
window.artistit.makePlayer = function(el, events) { return new Player(el, events); };
}());