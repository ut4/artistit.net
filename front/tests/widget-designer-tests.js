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
};
const widgetDefaults = {
    'hello': {icon: 'feather', title: 'Hello widget'},
    'twitter-feed': {icon: 'twitter', title: 'Twitter'},
};
const renderTwitterFeedWidget = userName => 'Mockoutput ' + userName;

QUnit.module('artistit.WidgetDesigner', () => {
    QUnit.test('renderöi widgetit', assert => {
        const el = renderIntoDocument(window.artistit.WidgetDesigner, {
            widgets: testWidgets,
            widgetDefaults,
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
                widgetDefaults['hello'].title
            );
            assert.equal(
                mainEl1.innerText,
                'Hello ' + testWidgets[0].data.prop
            );
            assert.equal(
                titleEl2.innerText,
                widgetDefaults['twitter-feed'].title
            );
            assert.equal(
                mainEl2.innerText,
                renderTwitterFeedWidget(testWidgets[1].data.userName)
            );
        }
    });
    QUnit.test('avaa twitter-feed widgetin muokkauslomakkeen ja vastaanottaa siltä dataa', assert => {
        const onWidgetsDesignerChangeCbSpy = sinon.spy();
        const done = assert.async();
        const el = renderIntoDocument(window.artistit.WidgetDesigner, {
            widgets: [testWidgets[1]],
            widgetDefaults,
            onUpdate: onWidgetsDesignerChangeCbSpy,
            ejsGlobals: mockEjsGlobals,
            templates: Object.assign({}, mockWidgetTemplates),
        });
        const newUserName = 'uusiTwitterUserName';
        ////////////////////////////////////////////////////////////////////////
        const s = setup();
        clickTwitterWidgetSlotEditButton().then(() => {
            verifyOpenedTwitterWidgetForm();
            return fillInAndSubmitTheForm();
        }).then(() => {
            verifyUpdatedDOMAndNotifiedOverallChanges();
            done();
        });
        ////////////////////////////////////////////////////////////////////////
        function setup() {
            const slots = el.querySelectorAll('.slot');
            const renderedWidgetEls = el.querySelectorAll('.widget');
            return {
                twitterWidgetSlotEditButton: slots[0].querySelector('button'),
                twitterWidgetEl: renderedWidgetEls[0],
                twitterWidgetForm: {userNameInput: null, submitButton: null},
                widgetDesignerCmp: el._component,
            };
        }
        function clickTwitterWidgetSlotEditButton() {
            s.twitterWidgetSlotEditButton.click();
            return Promise.resolve();
        }
        function verifyOpenedTwitterWidgetForm() {
            const form = s.twitterWidgetForm;
            form.userNameInput = s.twitterWidgetEl.querySelector('input');
            form.submitButton = s.twitterWidgetEl.querySelector('button');
            assert.ok(!!form.userNameInput, 'Pitäisi avata lomake, jossa input');
        }
        function fillInAndSubmitTheForm() {
            fillInput(newUserName, s.twitterWidgetForm.userNameInput);
            s.twitterWidgetForm.submitButton.click();
            return Promise.resolve();
        }
        function verifyUpdatedDOMAndNotifiedOverallChanges() {
            const call = onWidgetsDesignerChangeCbSpy.firstCall;
            assert.ok(!!call, 'Pitäisi notifikoida muutoksesta');
            assert.ok(call.args[0], s.widgetDesignerCmp.getWidgetsAsJson());
            const twitterWidgetContentEl = el.querySelector('.widget-main');
            assert.equal(twitterWidgetContentEl.innerText,
                         renderTwitterFeedWidget(newUserName),
                         'Pitäisi uudelleenrenderöidä DOM');
        }
    });
});