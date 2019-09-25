import './player-tests.js';
import './widget-designer-tests.js';

QUnit.config.autostart = false;
QUnit.dump.maxDepth = 8; // default 5
QUnit.moduleDone(() => {
    document.getElementById('render-container-el').innerHTML = '';
});
QUnit.start();