/*
 * Tässä tiedostossa:
 *
 * - window.artistit.Player: artistit.netin oma musiikkisoitin, react-komponentti.
 * - window.artistit.PlayerEventsHandler: luokka, jonka instanssi passataan Playerin events-handleriksi. Vastaanottaa ja käsittelee playerin lähettämät tapahtumat (onStart, onLike jne.).
 */

/* eslint-disable strict */

// artistit.Player /////////////////////////////////////////////////////////////
(function() {
'use strict';
var $el = preact.createElement;
/**
 * @param {{song: ServerApp.Song; eventsHandler: PlayerEventsHandler; baseUrl: string;}} props
 */
function Player(props) {
    preact.Component.call(this, props);
    this.state = {playing: false,
                  paused: false,
                  amountOfPlayClicks: props.song.amountOfPlayClicks,
                  amountOfLikes: props.song.amountOfLikes,
                  isLikedByCurrentUser: props.song.isLikedByCurrentUser};
    this.song = props.song;
    this.eventsHandler = props.eventsHandler;
    this.audioEl = null;
    this.playPauseEl = null;
}
Player.prototype = Object.create(preact.Component.prototype);
/**
 * @access protected
 */
Player.prototype.render = function() {
    var self = this;
    var url = self.props.baseUrl + self.song.id + '.mp3';
    return $el('div', null,
        $el('h2', null, self.song.name),
        $el('span', {ref: function(el) { self.progressEl = el; }}, '0'),
        $el('button', {onClick: function() { self.handlePlayPauseBtnClick(); },
                       ref: function(el) { self.playPauseEl = el; },
                       disabled: true},
            window.artistit.featherSvg(!self.state.playing ? 'play' : 'pause')),
        $el('button', {onClick: function() { self.handleLikeBtnClick(); }},
            window.artistit.featherSvg('heart', this.state.isLikedByCurrentUser)),
        $el('div', null, 'Klikit: ', $el('span', null, self.state.amountOfPlayClicks)),
        $el('div', null, 'Tykkäykset: ', $el('span', null, self.state.amountOfLikes)),
        $el('audio', {onLoadedData: function(e) { self.onAudioLoaded(e.target); },
                      onTimeUpdate: function(e) { self.onAudioTimeUpdate(e); },
                      onEnded: function() { self.onAudioEnded(); }},
            $el('source', {src: url, type: 'audio/mpeg'}),
            $el('p', null, 'Selaimesi ei tue HTML5 audiota. <a href="' + url +
                           '">Lataa</a> biisi sen sijaan?.')
        )
    );
};
/**
 * @access private
 */
Player.prototype.handleLikeBtnClick = function() {
    var self = this;
    if (self.state.isLikedByCurrentUser) return;
    self.setState({isLikedByCurrentUser: true});
    self.eventsHandler.onLike(self.song).then(function(ok) {
        if (ok) self.setState({amountOfLikes: self.state.amountOfLikes + 1});
    });
};
/**
 * @access private
 */
Player.prototype.handlePlayPauseBtnClick = function() {
    var self = this;
    if (!self.state.playing) {
        self.audioEl.play();
        if (!self.state.paused) self.eventsHandler.onStart(self.song).then(function(ok) {
            if (ok) self.setState({amountOfPlayClicks: self.state.amountOfPlayClicks + 1});
        });
    } else {
        self.audioEl.pause();
        self.eventsHandler.onPause(self.song);
    }
    self.setState({playing: !self.state.playing, paused: self.state.playing});
};
/**
 * @access private
 */
Player.prototype.onAudioLoaded = function(audioEl) {
    this.playPauseEl.disabled = false;
    this.audioEl = audioEl;
};
/**
 * @access private
 */
Player.prototype.onAudioTimeUpdate = function() {
    this.progressEl.textContent = parseInt(
        this.audioEl.currentTime / this.song.duration * 100, 10) + '%';
    this.eventsHandler.onTimeUpdate(this.song);
};
/**
 * @access private
 */
Player.prototype.onAudioEnded = function() {
    var self = this;
    self.audioEl.addEventListener('ended', function() {
        self.setState({playing: false, paused: false});
        self.eventsHandler.onEnd(self.song);
    });
};
//
window.artistit.Player = Player;
}());

// artistit.PlayerEventsHandler ////////////////////////////////////////////////
(function() {
'use strict';
/**
 */
function PlayerEventsHandler(sessionStorage) {
    this.sessionStorage = sessionStorage;
    this.latestPlays = this.sessionStorage.artistitSongPlays
        ? JSON.parse(this.sessionStorage.artistitSongPlays)
        : {};
    this.httpScheduler = new window.artistit.AsyncQueue();
}
/**
 * Lähettää play-klikin ajankohdan backendiin tallennettavaksi, tai ei tee
 * mitään, jos edellisestä klikistä on vähemmän kuin biisin keston verran aikaa.
 *
 * @access public
 */
PlayerEventsHandler.prototype.onStart = function(song) {
    var latestPlay = this.latestPlays[song.id] || 0;
    var unixTimeNow = Math.floor(Date.now() / 1000);
    //
    if (latestPlay && unixTimeNow < latestPlay + song.duration + 3) {
        return Promise.resolve(false);
    }
    //
    this.latestPlays[song.id] = unixTimeNow;
    this.sessionStorage.artistitSongPlays = JSON.stringify(this.latestPlays);
    //
    this.httpScheduler.addTask(function(callNextTaskFn) {
        window.artistit.fetch(window.artistit.baseUrl + 'biisi/kuuntelu', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            body: 'id=' + encodeURIComponent(song.id)
        })
        .then(() => {
            callNextTaskFn();
        });
    });
    return Promise.resolve(true);
};
/**
 * @access public
 */
PlayerEventsHandler.prototype.onEnd = function() {
    // todo updatePlay(song.id);
};
/**
 * @access public
 */
PlayerEventsHandler.prototype.onPause = function() {
    // todo updatePlay(song.id);
};
/**
 * @access public
 */
PlayerEventsHandler.prototype.onTimeUpdate = function() {
    // todo if (throttle(song.audioEl.currentTime-last>1000)) updatePlay(song.id);
};
/**
 * Lähettää tykkäyksen backendiin tallennettavaksi.
 *
 * @access public
 */
PlayerEventsHandler.prototype.onLike = function(song) {
    return window.artistit.fetch(window.artistit.baseUrl + 'biisi/tykkaa', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: 'id=' + encodeURIComponent(song.id)
    })
    .then(function(res) {
        return res.text();
    })
    .then(function(affectedRows) {
        return affectedRows == 1;
    });
};
//
window.artistit.PlayerEventsHandler = PlayerEventsHandler;
}());