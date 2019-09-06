import {renderIntoDocument} from './testutils.js';

QUnit.module('artist-create-view', () => {
    const pageScriptFn = window.artistCreateViewJs;
    QUnit.test('todo', assert => {
        const data = {maxArtistNameLen: 2, maxTaglineLen: 2, user: {id: 'a'}};
        const pageScriptProps = Object.assign({}, data);
        pageScriptProps.userId = data.user.id;
        const done = assert.async();
        renderIntoDocument('artist-create-view', data)
        .then(el => {
            pageScriptFn(pageScriptProps);
            assert.equal('todo', 'todo');
            done();
        });
    });
});