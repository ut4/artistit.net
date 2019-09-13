import {renderIntoDocument} from './setup/testutils.js';

const testSongs = [
    {id: 'foo', name: 'foo', duration: 10, amountOfPlayClicks: 1, amountOfLikes: 2}
];
const testTemplateData = {
    tabName: 'seinä', tabData: {songs: testSongs}, artist: {userId: 'a'}
};

QUnit.module('artist-songs-tab', () => {
    const pageScriptFn = window.artistViewSongsTabJs;
    QUnit.test('renderöi biisit', assert => {
        const data = Object.assign({}, testTemplateData);
        const done = assert.async();
        ////////////////////////////////////////////////////////////////////////
        renderIntoDocument('artist/artist-view-tab-biisit', data)
        .then(el => {
            pageScriptFn();
            verifyRenderedSongs(el);
            cleanup();
            ////////////////////////////////////////////////////////////////////////
            function verifyRenderedSongs(el) {
                const songEls = el.querySelectorAll('.song');
                assert.equal(songEls.length, 1);
                assert.equal(
                    songEls[0].querySelector('h2').textContent,
                    testSongs[0].name
                );
                assert.equal(
                    songEls[0].querySelector('source').src.split('/').slice(-4).join('/'),
                    `static/songs/${data.artist.userId}/${testSongs[0].id}.mp3`
                );
                assert.equal(
                    songEls[0].querySelector('.clicks').textContent,
                    testSongs[0].amountOfPlayClicks
                );
                assert.equal(
                    songEls[0].querySelector('.likes').textContent,
                    testSongs[0].amountOfLikes
                );
            }
            function cleanup() {
                done();
            }
        });
    });
    QUnit.test('play/pause-napin klikkaus käynnistää ja pausettaa biisin', assert => {
        const makePlayerSpy = sinon.spy(window.artistit, 'makePlayer');
        const data = Object.assign({}, testTemplateData);
        const done = assert.async();
        const mockInsertId = '23';
        ////////////////////////////////////////////////////////////////////////
        renderIntoDocument('artist/artist-view-tab-biisit', data)
        .then(el => {
            pageScriptFn();
            const s = setup();
            clickPlayButton();
            verifyStartedPlayingAndSentInfoToBackend().then(() => {
                verifyUpdatedClickCountToDOM();
                clickPlayButton();
                verifyPausedTheSong();
                cleanup(done);
            });
            ////////////////////////////////////////////////////////////////////////
            function setup() {
                const firstSongPlayer = makePlayerSpy.firstCall.returnValue;
                const firstSongEl = el.querySelector('.song');
                const playClickCountEl = firstSongEl.querySelector('.clicks');
                return {
                    onSongStartSpy: sinon.spy(makePlayerSpy.firstCall.args[1], 'onStart'),
                    firstSongPlayer,
                    playAudioStub: sinon.stub(firstSongPlayer.song.audioEl, 'play'),
                    pauseAudioStub: sinon.stub(firstSongPlayer.song.audioEl, 'pause'),
                    playClickHttpCallStub: sinon.stub(window.artistit, 'fetch')
                        .returns(Promise.resolve({text: () => Promise.resolve(mockInsertId)})),
                    firstSongEl,
                    playClickCountEl,
                    playClickCountBefore: parseInt(playClickCountEl.textContent),
                };
            }
            function clickPlayButton() {
                const playPauseButton = s.firstSongEl.querySelector('.play');
                playPauseButton.click();
            }
            function verifyStartedPlayingAndSentInfoToBackend() {
                assert.ok(s.playAudioStub.called, 'pitäisi kutsua song.audioEl.play');
                const playClickHttpCall = s.playClickHttpCallStub.firstCall;
                assert.equal(
                    playClickHttpCall.args[1].body,
                    'id=' + s.firstSongEl.getAttribute('data-song-id')
                );
                return s.onSongStartSpy.firstCall.returnValue;
            }
            function verifyUpdatedClickCountToDOM() {
                assert.equal(
                    parseInt(s.playClickCountEl.textContent),
                    s.playClickCountBefore + 1
                );
            }
            function verifyPausedTheSong() {
                assert.ok(s.pauseAudioStub.called, 'pitäisi kutsua song.audioEl.pause');
                assert.equal(s.playClickHttpCallStub.callCount, 1);
            }
            function cleanup(done) {
                makePlayerSpy.restore();
                s.playClickHttpCallStub.restore();
                done();
            }
        });
    });
    QUnit.test('like-napin klikkaus merkkaa biisin tykätyksi', assert => {
        const makePlayerSpy = sinon.spy(window.artistit, 'makePlayer');
        const data = Object.assign({}, testTemplateData);
        const done = assert.async();
        const mockAffectedRows = '1';
        ////////////////////////////////////////////////////////////////////////
        renderIntoDocument('artist/artist-view-tab-biisit', data)
        .then(el => {
            pageScriptFn();
            const s = setup();
            clickLikeButton();
            verifySentInfoToBackend().then(() => {
                verifyUpdatedLikeCountToDOM();
                clickLikeButton();
                verifyDidntSendInfoToBackend();
                cleanup();
            });
            ////////////////////////////////////////////////////////////////////
            function setup() {
                const firstSongEl = el.querySelector('.song');
                const likeCountEl = firstSongEl.querySelector('.likes');
                return {
                    onLikeSpy: sinon.spy(makePlayerSpy.firstCall.args[1], 'onLike'),
                    likeHttpCallStub: sinon.stub(window.artistit, 'fetch')
                        .returns(Promise.resolve({text: () => Promise.resolve(mockAffectedRows)})),
                    firstSongEl,
                    likeCountEl,
                    likeCountBefore: parseInt(likeCountEl.textContent),
                    likeButton: firstSongEl.querySelector('.like'),
                };
            }
            function clickLikeButton() {
                s.likeButton.click();
            }
            function verifySentInfoToBackend() {
                const likeHttpCall = s.likeHttpCallStub.firstCall;
                assert.equal(
                    likeHttpCall.args[1].body,
                    'id=' + s.firstSongEl.getAttribute('data-song-id')
                );
                return s.onLikeSpy.firstCall.returnValue;
            }
            function verifyUpdatedLikeCountToDOM() {
                assert.equal(parseInt(s.likeCountEl.textContent), s.likeCountBefore + 1);
                assert.ok(s.likeButton.querySelector('svg').classList.contains('filled'));
            }
            function verifyDidntSendInfoToBackend() {
                assert.equal(s.likeHttpCallStub.callCount, 1);
            }
            function cleanup() {
                makePlayerSpy.restore();
                s.likeHttpCallStub.restore();
                done();
            }
        });
    });
});