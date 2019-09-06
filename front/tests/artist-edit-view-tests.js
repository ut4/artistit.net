import {renderIntoDocument} from './testutils.js';

QUnit.module('artist-edit-view', () => {
    const pageScriptFn = window.artistEditViewJs;
    QUnit.test('todo', assert => {
        const data = {maxArtistNameLen: 2, maxTaglineLen: 2, artist: {id: 'a'}};
        const pageScriptProps = Object.assign({}, data);
        pageScriptProps.artistId = data.artist.id;
        const done = assert.async();
        renderIntoDocument('artist-edit-view', data)
        .then(el => {
            pageScriptFn(pageScriptProps);
            assert.equal('todo', 'todo');
            done();
        });
    });
});