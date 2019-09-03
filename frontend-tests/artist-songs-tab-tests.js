import {renderIntoDocument} from './testutils.js';

const testSongs = [
    {id: 'foo', name: 'foo', duration: 10, amountOfPlayClicks: 1}
];
const testTemplateData = {
    tabName: 'seinä', tabData: {songs: testSongs}, artist: {userId: 'a'}
};

QUnit.module('artist-songs-tab', () => {
    // artist-view-tab-biisit.ejs-templaatin js
    const pageScriptFn = window.artistit.pageScripts[0];
    QUnit.test('renderöi biisit', assert => {
        assert.expect(4);
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

            // Siivoa testit
            done();
        });
    });
    QUnit.test('play/pause-napin klikkaus käynnistää ja pausettaa biisin', assert => {
        const makePlayerSpy = sinon.spy(window.artistit, 'makePlayer');
        assert.expect(4);
        const data = Object.assign({}, testTemplateData);
        const done = assert.async();
        const mockInsertId = '23';
        renderIntoDocument('artist-view-tab-biisit', data)
        .then(el => {
            // Aja sivuskripti
            pageScriptFn();
            const firstSongPlayer = makePlayerSpy.firstCall.returnValue;
            const playAudioStub = sinon.stub(firstSongPlayer.song.audioEl, 'play');
            const pauseAudioStub = sinon.stub(firstSongPlayer.song.audioEl, 'pause');
            const playClickLogCallStub = sinon.stub(window.artistit, 'fetch')
                .returns(Promise.resolve({text: () => Promise.resolve(mockInsertId)}));

            // Klikkaa play-nappia
            const firstSongEl = el.querySelector('.song');
            const playPauseButton = firstSongEl.querySelector('.play');
            playPauseButton.click();

            // Käynnistikö biisin, ja lähettikö siitä tiedon backendiin?
            assert.ok(playAudioStub.called, 'pitäisi kutsua song.audioEl.play');
            const playClickLogCall = playClickLogCallStub.firstCall;
            assert.ok(!!playClickLogCall, 'Pitäisi lähettää play-klikki backendiin '+
                                           ' tallennettavaksi');

            // Klikkaa uudelleen
            playPauseButton.click();

            // Pausettiko?
            assert.ok(pauseAudioStub.called, 'pitäisi kutsua song.audioEl.pause');
            assert.equal(playClickLogCallStub.callCount, 1);

            // Siivoa testit
            makePlayerSpy.restore();
            playClickLogCallStub.restore();
            done();
        });
    });
});