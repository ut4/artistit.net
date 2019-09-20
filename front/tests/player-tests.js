import {renderIntoDocument} from './setup/testutils.js';

const testSongs = [
    {id: 'foo', name: 'foo', duration: 10, amountOfPlayClicks: 1, amountOfLikes: 2}
];
const PlayerEventsHandler = window.artistit.PlayerEventsHandler;

QUnit.module('artist-songs-tab', () => {
    QUnit.test('play/pause-napin klikkaus käynnistää ja pausettaa biisin', assert => {
        const done = assert.async();
        const mockInsertId = '23';
        const mockSessionStorage = {};
        const el = renderIntoDocument(window.artistit.Player, {
            song: testSongs[0],
            eventsHandler: new PlayerEventsHandler(mockSessionStorage),
            baseUrl: ''
        });
        ////////////////////////////////////////////////////////////////////////
        simulateAudioLoadEvent();
        const s = setup();
        clickPlayButton();
        verifyStartedPlayingAndSentInfoToBackend().then(() => {
            verifyUpdatedClickCountToDOM();
            clickPlayButton();
            verifyPausedTheSong();
            cleanup(done);
        });
        ////////////////////////////////////////////////////////////////////////
        function simulateAudioLoadEvent() {
            el._component.onAudioLoaded(el.querySelector('audio'));
        }
        function setup() {
            const playerCmp = el._component;
            const buttons = el.querySelectorAll('button');
            const countElParents = el.querySelectorAll('div');
            return {
                playPauseButton: buttons[0],
                onSongStartSpy: sinon.spy(playerCmp.eventsHandler, 'onStart'),
                playAudioStub: sinon.stub(playerCmp.audioEl, 'play'),
                pauseAudioStub: sinon.stub(playerCmp.audioEl, 'pause'),
                playClickHttpCallStub: sinon.stub(window.artistit, 'fetch')
                    .returns(Promise.resolve({text: () => Promise.resolve(mockInsertId)})),
                playClickCountEl: countElParents[0].children[0]
            };
        }
        function clickPlayButton() {
            s.playPauseButton.click();
        }
        function verifyStartedPlayingAndSentInfoToBackend() {
            assert.ok(s.playAudioStub.called, 'pitäisi kutsua song.audioEl.play');
            const playClickHttpCall = s.playClickHttpCallStub.firstCall;
            assert.equal(
                playClickHttpCall.args[1].body,
                'id=' + testSongs[0].id
            );
            return s.onSongStartSpy.firstCall.returnValue;
        }
        function verifyUpdatedClickCountToDOM() {
            assert.equal(
                parseInt(s.playClickCountEl.textContent),
                testSongs[0].amountOfPlayClicks + 1
            );
        }
        function verifyPausedTheSong() {
            assert.ok(s.pauseAudioStub.called, 'pitäisi kutsua song.audioEl.pause');
            assert.equal(s.playClickHttpCallStub.callCount, 1);
        }
        function cleanup(done) {
            s.playClickHttpCallStub.restore();
            done();
        }
    });
    QUnit.test('like-napin klikkaus merkkaa biisin tykätyksi', assert => {
        const done = assert.async();
        const mockAffectedRows = '1';
        const mockSessionStorage = {};
        const el = renderIntoDocument(window.artistit.Player, {
            song: testSongs[0],
            eventsHandler: new PlayerEventsHandler(mockSessionStorage),
            baseUrl: ''
        });
        ////////////////////////////////////////////////////////////////////////
        simulateAudioLoadEvent();
        const s = setup();
        clickLikeButton();
        verifySentInfoToBackend().then(() => {
            verifyUpdatedLikeCountToDOM();
            clickLikeButton();
            verifyDidntSendInfoToBackend();
            cleanup();
        });
        ////////////////////////////////////////////////////////////////////////
        function simulateAudioLoadEvent() {
            el._component.onAudioLoaded(el.querySelector('audio'));
        }
        function setup() {
            const playerCmp = el._component;
            const buttons = el.querySelectorAll('button');
            const countElParents = el.querySelectorAll('div');
            return {
                likeButton: buttons[1],
                onLikeSpy: sinon.spy(playerCmp.eventsHandler, 'onLike'),
                likeHttpCallStub: sinon.stub(window.artistit, 'fetch')
                    .returns(Promise.resolve({text: () => Promise.resolve(mockAffectedRows)})),
                likeCountEl: countElParents[1].children[0]
            };
        }
        function clickLikeButton() {
            s.likeButton.click();
        }
        function verifySentInfoToBackend() {
            const likeHttpCall = s.likeHttpCallStub.firstCall;
            assert.equal(
                likeHttpCall.args[1].body,
                'id=' + testSongs[0].id
            );
            return s.onLikeSpy.firstCall.returnValue.then(()=>null);
        }
        function verifyUpdatedLikeCountToDOM() {
            assert.equal(
                parseInt(s.likeCountEl.textContent),
                testSongs[0].amountOfLikes + 1
            );
            assert.ok(s.likeButton.querySelector('svg').classList.contains('filled'));
        }
        function verifyDidntSendInfoToBackend() {
            assert.equal(s.likeHttpCallStub.callCount, 1);
        }
        function cleanup() {
            s.likeHttpCallStub.restore();
            done();
        }
    });
});