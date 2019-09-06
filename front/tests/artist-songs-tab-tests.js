import {renderIntoDocument} from './testutils.js';

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
        renderIntoDocument('artist-view-tab-biisit', data)
        .then(el => {
            // Aja sivuskripti
            pageScriptFn();

            // Renderöikö templaattiin passatut biisit domiin?
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

            // Siivoa testit
            done();
        });
    });
    QUnit.test('play/pause-napin klikkaus käynnistää ja pausettaa biisin', assert => {
        const makePlayerSpy = sinon.spy(window.artistit, 'makePlayer');
        const data = Object.assign({}, testTemplateData);
        const done = assert.async();
        const mockInsertId = '23';
        renderIntoDocument('artist-view-tab-biisit', data)
        .then(el => {
            // Aja sivuskripti
            pageScriptFn();

            const onSongStartSpy = sinon.spy(makePlayerSpy.firstCall.args[1], 'onStart');
            const firstSongPlayer = makePlayerSpy.firstCall.returnValue;
            const playAudioStub = sinon.stub(firstSongPlayer.song.audioEl, 'play');
            const pauseAudioStub = sinon.stub(firstSongPlayer.song.audioEl, 'pause');
            const playClickHttpCallStub = sinon.stub(window.artistit, 'fetch')
                .returns(Promise.resolve({text: () => Promise.resolve(mockInsertId)}));
            const firstSongEl = el.querySelector('.song');
            const playClickCountEl = firstSongEl.querySelector('.clicks');
            const playClickCountBefore = parseInt(playClickCountEl.textContent);

            // Klikkaa play-nappia
            const playPauseButton = firstSongEl.querySelector('.play');
            playPauseButton.click();

            // Käynnistikö biisin, ja lähettikö siitä tiedon backendiin?
            assert.ok(playAudioStub.called, 'pitäisi kutsua song.audioEl.play');
            const playClickHttpCall = playClickHttpCallStub.firstCall;
            assert.equal(
                playClickHttpCall.args[1].body,
                'id=' + firstSongEl.getAttribute('data-song-id')
            );

            onSongStartSpy.firstCall.returnValue.then(() => {
            // Päivittikö DOMin?
                assert.equal(
                    parseInt(playClickCountEl.textContent),
                    playClickCountBefore + 1
                );

            // Klikkaa uudelleen
                playPauseButton.click();

            // Pausettiko?
                assert.ok(pauseAudioStub.called, 'pitäisi kutsua song.audioEl.pause');
                assert.equal(playClickHttpCallStub.callCount, 1);

            // Siivoa testit
                makePlayerSpy.restore();
                playClickHttpCallStub.restore();
                done();
            });
        });
    });
    QUnit.test('like-napin klikkaus merkkaa biisin tykätyksi', assert => {
        const makePlayerSpy = sinon.spy(window.artistit, 'makePlayer');
        const data = Object.assign({}, testTemplateData);
        const done = assert.async();
        const mockAffectedRows = '1';
        renderIntoDocument('artist-view-tab-biisit', data)
        .then(el => {
            // Aja sivuskripti
            pageScriptFn();

            const onLikeSpy = sinon.spy(makePlayerSpy.firstCall.args[1], 'onLike');
            const likeHttpCallStub = sinon.stub(window.artistit, 'fetch')
                .returns(Promise.resolve({text: () => Promise.resolve(mockAffectedRows)}));
            const firstSongEl = el.querySelector('.song');
            const likeCountEl = firstSongEl.querySelector('.likes');
            const likeCountBefore = parseInt(likeCountEl.textContent);

            // Klikkaa tykkää-nappia
            const likeButton = firstSongEl.querySelector('.like');
            likeButton.click();

            // Lähettikö tykkäyksen backendiin?
            const likeHttpCall = likeHttpCallStub.firstCall;
            assert.equal(
                likeHttpCall.args[1].body,
                'id=' + firstSongEl.getAttribute('data-song-id')
            );

            onLikeSpy.firstCall.returnValue.then(() => {
            // Päivittikö DOMin?
                assert.equal(parseInt(likeCountEl.textContent), likeCountBefore + 1);
                assert.ok(likeButton.querySelector('svg').classList.contains('filled'));

            // Klikkaa uudelleen
                likeButton.click();

            // Skippasiko?
                assert.equal(likeHttpCallStub.callCount, 1);

            // Siivoa testit
                makePlayerSpy.restore();
                likeHttpCallStub.restore();
                done();
            });
        });
    });
});