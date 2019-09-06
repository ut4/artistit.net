/**
 * /artisti/:artistId?näytä=biisit -sivun js.
 */
function artistViewSongsTabJs() {
    var rootSongEls = document.querySelectorAll('.song');
    var latestPlays = window.artistit.sessionStorage.artistitSongPlays
        ? JSON.parse(window.artistit.sessionStorage.artistitSongPlays)
        : {};
    var httpScheduler = new window.artistit.AsyncQueue();
    for (var i = 0; i < rootSongEls.length; ++i) {
        window.artistit.makePlayer(rootSongEls[i], {
            onStart: function(song) {
                return Promise.resolve(registerPlay(song));
            },
            onEnd: function(_song) {
                // todo updatePlay(song.id);
            },
            onPause: function(_song) {
                // todo updatePlay(song.id);
            },
            onTimeUpdate: function(_song) {
                // todo if (throttle(song.audioEl.currentTime-last>1000)) updatePlay(song.id);
            },
            onLike: function(song) {
                return registerLike(song).then(function(affectedRows) {
                    return affectedRows == 1;
                });
            }
        });
    }
    /**
     * Lähettää play-klikin ajankohdan backendiin tallennettavaksi, tai ei tee
     * mitään, jos edellisestä klikistä on vähemmän kuin biisin keston verran aikaa.
     */
    function registerPlay(song) {
        var latestPlay = latestPlays[song.id] || 0;
        var unixTimeNow = Math.floor(Date.now() / 1000);
        //
        if (latestPlay && unixTimeNow < latestPlay + song.duration + 3) {
            return false;
        }
        //
        latestPlays[song.id] = unixTimeNow;
        window.artistit.sessionStorage.artistitSongPlays = JSON.stringify(latestPlays);
        //
        httpScheduler.addTask(function(callNextTaskFn) {
            window.artistit.fetch(window.artistit.baseUrl + 'biisi/kuuntelu', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                body: 'id=' + encodeURIComponent(song.id)
            }).then(() => {
                callNextTaskFn();
            });
        });
        return true;
    }
    /**
     * Lähettää tykkäyksen backendiin tallennettavaksi.
     */
    function registerLike(song) {
        return window.artistit.fetch(window.artistit.baseUrl + 'biisi/tykkaa', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            body: 'id=' + encodeURIComponent(song.id)
        })
        .then(function(res) {
            return res.text();
        });
    }
}