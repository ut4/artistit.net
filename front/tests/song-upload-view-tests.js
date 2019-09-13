import {renderIntoDocument} from './setup/testutils.js';

QUnit.module('song-upload-view', () => {
    const pageScriptFn = window.songUploadViewJs;
    QUnit.test('todo', assert => {
        const data = {maxSongNameLen: 2, artistId: 'a'};
        const done = assert.async();
        renderIntoDocument('song/song-upload-view', data)
        .then(el => {
            pageScriptFn(data);
            assert.equal('todo', 'todo');
            done();
        });
    });
});