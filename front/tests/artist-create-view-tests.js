import {renderIntoDocument} from './setup/testutils.js';

QUnit.module('artist-create-view', () => {
    const pageScriptFn = window.artistCreateViewJs;
    QUnit.test('lähettää tiedot backendiin', assert => {
        const data = {maxArtistNameLen: 2, maxTaglineLen: 2, user: {id: 'a'},
                      widgetTmplsBundleBaseUrl: ''};
        const testNewArtist = {name: 'Batman', tagline: 'Kuvaus'};
        const testInsertId = '-mockfireid';
        const pageScriptProps = Object.assign({}, data);
        pageScriptProps.userId = data.user.id;
        const done = assert.async();
        ////////////////////////////////////////////////////////////////////////
        renderIntoDocument('artist-create-view', data)
            .then(el => {
                pageScriptFn(pageScriptProps);
                const s = setup();
                fillAndSendArtistCreateForm(el);
                verifySentStuffToBackend()
                    .then(() => {
                        verifyRedirectedToNewArtistPage();
                        cleanup();
                    });
                ////////////////////////////////////////////////////////////////
                function setup() {
                    return {
                        httpCallStub: sinon.stub(artistit, 'fetch')
                            .returns(Promise.resolve({status: 200, text: () => testInsertId})),
                        redirectSpy: sinon.spy(artistit, 'redirect'),
                    };
                }
                function fillAndSendArtistCreateForm(el) {
                    el.querySelector('#i-name').value = testNewArtist.name;
                    el.querySelector('#i-tagline').value = testNewArtist.tagline;
                    const artistCreatePageSubmitHandler = window.handleFormSubmit;
                    artistCreatePageSubmitHandler({preventDefault: () => undefined});
                }
                function verifySentStuffToBackend() {
                    const call = s.httpCallStub.firstCall;
                    assert.ok(!!call, 'Pitäisi lähettää tiedot backendiin');
                    assert.equal(call.args[0], 'artisti');
                    assert.equal(call.args[1].body,
                        'name=' + encodeURIComponent(testNewArtist.name) +
                        '&tagline=' + encodeURIComponent(testNewArtist.tagline) +
                        '&widgets=' + encodeURIComponent(
                            pageScriptProps.widgetDesigner.getWidgetsAsJson()) +
                        '&userId=' + encodeURIComponent(data.user.id) +
                        '&sneakySneaky='
                    );
                    return call.returnValue.then(()=>{});
                }
                function verifyRedirectedToNewArtistPage() {
                    assert.ok(s.redirectSpy.calledAfter(s.httpCallStub),
                            'Pitäisi ohjata juuri luodulle artistisivulle');
                    assert.equal(s.redirectSpy.firstCall.args[0], 'artisti/' + testInsertId);
                }
                function cleanup() {
                    s.httpCallStub.restore();
                    s.redirectSpy.restore();
                    done();
                }
            });
    });
});