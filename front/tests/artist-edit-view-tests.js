import {renderIntoDocument} from './setup/testutils.js';

QUnit.module('artist-edit-view', () => {
    const pageScriptFn = window.artistEditViewJs;
    QUnit.test('todo', assert => {
        const data = {maxArtistNameLen: 2, maxTaglineLen: 2, artist: {id: 'a'}};
        const pageScriptProps = Object.assign({}, data);
        pageScriptProps.artistId = data.artist.id;
        const done = assert.async();
        ////////////////////////////////////////////////////////////////////////
        renderIntoDocument('artist/artist-edit-view', data)
        .then(_el => {
            pageScriptFn(pageScriptProps);
            verifySomething();
            cleanup();
            ////////////////////////////////////////////////////////////////////
            function verifySomething() {
                assert.equal('todo', 'todo');
            }
            function cleanup() {
                done();
            }
        });
    });
});