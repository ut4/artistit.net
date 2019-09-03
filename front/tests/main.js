import './artist-create-view-tests.js';
import './artist-edit-view-tests.js';
import './artist-songs-tab-tests.js';
import './song-upload-view-tests.js';

QUnit.config.autostart = false;
QUnit.dump.maxDepth = 8; // default 5
QUnit.moduleDone(() => {
    document.getElementById('render-container-el').innerHTML = '';
});
QUnit.start();