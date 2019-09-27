import {renderIntoDocument, fillInput} from './setup/testutils.js';

const testWidgets = [
    {type: 'hello', data: {prop: 'value'}},
    {type: 'twitter-feed', data: {userName: 'test', useCustomImpl: false}},
];
const mockEjsGlobals = {
    staticBaseUrl: '',
};
const mockWidgetTemplates = {
    'hello': encodeURIComponent('Hello <%- prop %>'),
    'twitter-feed': encodeURIComponent('Mockoutput <%- userName %>'),
    'info-box': encodeURIComponent('<%- JSON.stringify(infos) %>'),
};
const widgetProtos = {
    'hello': {icon: 'feather', title: 'Hello widget'},
    'info-box': {icon: 'info', title: 'Tässä infoa'},
    'twitter-feed': {icon: 'twitter', title: 'Twitter'},
};
const renderInfoBoxWidget = infos => JSON.stringify(infos);
const renderTwitterFeedWidget = userName => 'Mockoutput ' + userName;

QUnit.module('artistit.WidgetDesigner', () => {
    QUnit.test('renderöi widgetit', assert => {
        const el = renderIntoDocument(window.artistit.WidgetDesigner, {
            widgets: testWidgets.slice(0),
            widgetProtos,
            onUpdate: () => {},
            ejsGlobals: mockEjsGlobals,
            templates: Object.assign({}, mockWidgetTemplates),
        });
        ////////////////////////////////////////////////////////////////////////
        const s = setup();
        verifyRenderedWidgets();
        ////////////////////////////////////////////////////////////////////////
        function setup() {
            return {
                renderedWidgetEls: el.querySelectorAll('.widget')
            };
        }
        function verifyRenderedWidgets() {
            assert.equal(s.renderedWidgetEls.length, testWidgets.length);
            const titleEl1 = s.renderedWidgetEls[0].querySelector('h3');
            const mainEl1 = s.renderedWidgetEls[0].querySelector('.widget-main');
            const titleEl2 = s.renderedWidgetEls[1].querySelector('h3');
            const mainEl2 = s.renderedWidgetEls[1].querySelector('.widget-main');
            assert.equal(
                titleEl1.innerText,
                widgetProtos['hello'].title
            );
            assert.equal(
                mainEl1.innerText,
                'Hello ' + testWidgets[0].data.prop
            );
            assert.equal(
                titleEl2.innerText,
                widgetProtos['twitter-feed'].title
            );
            assert.equal(
                mainEl2.innerText,
                renderTwitterFeedWidget(testWidgets[1].data.userName)
            );
        }
    });
    QUnit.test('poista-napista voi poistaa widgetin', async assert => {
        const onWidgetsDesignerChangeCbSpy = sinon.spy();
        const done = assert.async();
        const el = renderIntoDocument(window.artistit.WidgetDesigner, {
            widgets: testWidgets.slice(0),
            widgetProtos,
            onUpdate: onWidgetsDesignerChangeCbSpy,
            ejsGlobals: mockEjsGlobals,
            templates: Object.assign({}, mockWidgetTemplates),
        });
        ////////////////////////////////////////////////////////////////////////
        const s = setup();
        await clickTwitterWidgetSlotDeleteButton();
              verifyOpenedDeleteConfirmationPopup();
        await clickCancelDeleteButton();
              verifyClosedDeleteConfirmationPopup();
        await clickTwitterWidgetSlotDeleteButton();
        await clickConfirmDeleteButton();
              verifyDeletedWidgetUpdatedDOMAndNotifiedOverallChanges();
        done();
        ////////////////////////////////////////////////////////////////////////
        function setup() {
            const slots = el.querySelectorAll('.slot');
            const renderedWidgetEls = el.querySelectorAll('.widget');
            return {
                twitterWidgetSlotDeleteButton: slots[1].querySelectorAll('button')[1],
                twitterWidgetTitle: renderedWidgetEls[1].querySelector('h3').innerText,
                twitterWidgetEl: renderedWidgetEls[1],
                confirmationDialogEl: null,
                widgetDesignerCmp: el._component,
                renderedWidgetEls,
            };
        }
        function clickTwitterWidgetSlotDeleteButton() {
            s.twitterWidgetSlotDeleteButton.click();
            return waitForPreactRender();
        }
        function verifyOpenedDeleteConfirmationPopup() {
            s.confirmationDialogEl = s.twitterWidgetEl.querySelector('.popup-dialog');
            assert.ok(!!s.confirmationDialogEl, 'Pitäisi avata popup-dialog');
        }
        function clickCancelDeleteButton() {
            const cancelDeleteLink = s.confirmationDialogEl.querySelector('a');
            cancelDeleteLink.click();
            return waitForPreactRender();
        }
        function verifyClosedDeleteConfirmationPopup() {
            s.confirmationDialogEl = s.twitterWidgetEl.querySelector('.popup-dialog');
            assert.ok(!s.confirmationDialogEl, 'Pitäisi sulkea popup-dialog');
            assert.equal(el.querySelectorAll('.populated').length,
                         testWidgets.length,
                         'Ei pitäisi poistaa widgettiä');
        }
        function clickConfirmDeleteButton() {
            s.confirmationDialogEl = s.twitterWidgetEl.querySelector('.popup-dialog');
            const confirmButton = s.confirmationDialogEl.querySelector('button');
            confirmButton.click();
            return waitForPreactRender();
        }
        function verifyDeletedWidgetUpdatedDOMAndNotifiedOverallChanges() {
            const call = onWidgetsDesignerChangeCbSpy.getCall(1);
            assert.ok(!!call, 'Pitäisi notifikoida muutoksesta');
            const widgetsAsJson = call.args[0];
            assert.equal(JSON.parse(widgetsAsJson).length, testWidgets.length - 1);
            assert.equal(el.querySelectorAll('.populated').length,
                         testWidgets.length - 1,
                         'Pitäisi poistaa widgetti');
            assert.notEqual(s.renderedWidgetEls[0].querySelector('h3').innerText,
                            s.twitterWidgetTitle);
        }
    });
    QUnit.test('info-box -widgetin muokkausnapista voi konfiguroida widgettiä', async assert => {
        const onWidgetsDesignerChangeCbSpy = sinon.spy();
        const done = assert.async();
        const el = renderIntoDocument(window.artistit.WidgetDesigner, {
            widgets: [{type: 'info-box',
                       data: {infos: [{title:'Jäsenet',text:'Hermanni'}]}}],
            widgetProtos,
            onUpdate: onWidgetsDesignerChangeCbSpy,
            ejsGlobals: mockEjsGlobals,
            templates: Object.assign({}, mockWidgetTemplates),
        });
        const newInfo0Title = 'Laitteet';
        const newInfo0Text = 'Macbook, DAW';
        ////////////////////////////////////////////////////////////////////////
        const s = setup();
        await clickInfoBoxWidgetSlotEditButton();
              verifyOpenedInfoBoxWidgetForm();
        await fillInAndSubmitTheForm();
              verifyUpdatedDOMAndNotifiedOverallChanges();
        done();
        ////////////////////////////////////////////////////////////////////////
        function setup() {
            const slots = el.querySelectorAll('.slot');
            return {
                infoBoxWidgetSlotEditButton: slots[0].querySelector('button'),
                infoBoxWidgetForm: {firstInfoTitleInput: null,
                                    firstInfoTextInput: null,
                                    submitButton: null},
                widgetDesignerCmp: el._component,
            };
        }
        function clickInfoBoxWidgetSlotEditButton() {
            s.infoBoxWidgetSlotEditButton.click();
            return waitForPreactRender();
        }
        function verifyOpenedInfoBoxWidgetForm() {
            const form = s.infoBoxWidgetForm;
            const infoBoxWidgetEl = el.querySelector('.widget-main');
            const inputs = infoBoxWidgetEl.querySelectorAll('input');
            form.firstInfoTitleInput = inputs[0];
            form.firstInfoTextInput = inputs[1];
            assert.ok(!!form.firstInfoTitleInput, 'Pitäisi avata lomake, jossa input');
            form.submitButton = infoBoxWidgetEl.querySelector('button');
        }
        function fillInAndSubmitTheForm() {
            fillInput(newInfo0Title, s.infoBoxWidgetForm.firstInfoTitleInput);
            fillInput(newInfo0Text, s.infoBoxWidgetForm.firstInfoTextInput);
            s.infoBoxWidgetForm.submitButton.click();
            return waitForPreactRender();
        }
        function verifyUpdatedDOMAndNotifiedOverallChanges() {
            const call = onWidgetsDesignerChangeCbSpy.getCall(1);
            assert.ok(!!call, 'Pitäisi notifikoida muutoksesta');
            assert.equal(call.args[0], s.widgetDesignerCmp.getWidgetsAsJson());
            const infoBoxWidgetContentEl = el.querySelector('.widget-main');
            const expectedInfos = [{title:newInfo0Title,text:newInfo0Text}];
            assert.equal(infoBoxWidgetContentEl.innerText,
                         renderInfoBoxWidget(expectedInfos),
                         'Pitäisi uudelleenrenderöidä DOM');
        }
    });
    QUnit.test('twitter-feed -widgetin muokkausnapista voi konfiguroida widgettiä', async assert => {
        const onWidgetsDesignerChangeCbSpy = sinon.spy();
        const done = assert.async();
        const el = renderIntoDocument(window.artistit.WidgetDesigner, {
            widgets: [testWidgets[1]],
            widgetProtos,
            onUpdate: onWidgetsDesignerChangeCbSpy,
            ejsGlobals: mockEjsGlobals,
            templates: Object.assign({}, mockWidgetTemplates),
        });
        const newUserName = 'uusiTwitterUserName';
        ////////////////////////////////////////////////////////////////////////
        const s = setup();
        await clickTwitterWidgetSlotEditButton();
              verifyOpenedTwitterWidgetForm();
        await fillInAndSubmitTheForm();
              verifyUpdatedDOMAndNotifiedOverallChanges();
        done();
        ////////////////////////////////////////////////////////////////////////
        function setup() {
            const slots = el.querySelectorAll('.slot');
            return {
                twitterWidgetSlotEditButton: slots[0].querySelector('button'),
                twitterWidgetForm: {userNameInput: null, submitButton: null},
                widgetDesignerCmp: el._component,
            };
        }
        function clickTwitterWidgetSlotEditButton() {
            s.twitterWidgetSlotEditButton.click();
            return waitForPreactRender();
        }
        function verifyOpenedTwitterWidgetForm() {
            const form = s.twitterWidgetForm;
            const twitterWidgetEl = el.querySelector('.widget-main');
            form.userNameInput = twitterWidgetEl.querySelector('input');
            form.submitButton = twitterWidgetEl.querySelector('button');
            assert.ok(!!form.userNameInput, 'Pitäisi avata lomake, jossa input');
        }
        function fillInAndSubmitTheForm() {
            fillInput(newUserName, s.twitterWidgetForm.userNameInput);
            s.twitterWidgetForm.submitButton.click();
            return waitForPreactRender();
        }
        function verifyUpdatedDOMAndNotifiedOverallChanges() {
            const call = onWidgetsDesignerChangeCbSpy.getCall(1);
            assert.ok(!!call, 'Pitäisi notifikoida muutoksesta');
            assert.equal(call.args[0], s.widgetDesignerCmp.getWidgetsAsJson());
            const twitterWidgetContentEl = el.querySelector('.widget-main');
            assert.equal(twitterWidgetContentEl.innerText,
                         renderTwitterFeedWidget(newUserName),
                         'Pitäisi uudelleenrenderöidä DOM');
        }
    });
});

function waitForPreactRender() {
    return Promise.resolve(); // if it's stupid but it works it's not stupid :D
}
