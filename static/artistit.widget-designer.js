/*
 * Tässä tiedostossa: window.artistit.WidgetDesigner: react-komponentti, jolla
 * artisti voi rakennella oman sivunsa.
 */

/* eslint-disable strict */
(function() {
'use strict';
var $el = preact.createElement;
var widgetDefaults = null;
var ejsGlobals = null;
var featherSvg = null;
var widgetConfigFormImpls = {
    'info-box': InfoBoxConfigForm,
    'twitter-feed': TwitterFeedConfigForm,
};
var initialWidgetProps = {
    'info-box': {
        infos: [{title: 'Jäsenet', text: 'Jäsen1, Jäsen2'},
                {title: 'Vaikutteet', text: 'Yhtye1, Yhtye2'}]
    },
    'twitter-feed': {userName: 'foo', useCustomImpl: false},
};
var friendlyWidgetNames = ['Infoboksi', 'Twitter-feed'];

/**
 * @param {{widgets: Array<Widget>; widgetDefaults: WidgetDefaults; templates: {[name: string]; string}; onUpdate: (widgetsAsJson: string): any;}} props
 */
function WidgetDesigner(props) {
    preact.Component.call(this, props);
    this.widgetTypes = Object.keys(initialWidgetProps);
    var defaultType = this.widgetTypes[0];
    this.templates = props.templates;
    for (var key in this.templates)
        this.templates[key] = decodeURIComponent(this.templates[key]);
    this.state = {widgets: props.widgets || [{
        type: defaultType,
        data: initialWidgetProps[defaultType]
    }]};
    this.emitUpdate();
    widgetDefaults = props.widgetDefaults;
    ejsGlobals = props.ejsGlobals;
    featherSvg = function(iconId) {
        return $el('svg', {className: 'feather'},
            $el('use', {'xlink:href': ejsGlobals.staticBaseUrl + 'feather-sprite.svg#' + iconId})
        );
    };
}
WidgetDesigner.prototype = Object.create(preact.Component.prototype);
/**
 * Palauttaa käyttäjän rakenteleman widgettigridin tietokantaan tallennettavaksi
 * sopivassa muodossa.
 *
 * @access public
 * @returns {string}
 */
WidgetDesigner.prototype.getWidgetsAsJson = function() {
    return JSON.stringify(this.state.widgets);
};
/**
 * @access protected
 */
WidgetDesigner.prototype.render = function() {
    var self = this;
    return $el('div', {class: 'artist-widgets-list'},
        $el('button', {class: 'icon-button filled', title: 'Järjestä widgettejä'},
            featherSvg('layout'), 'Järjestä'),
        self.state.widgets.map(function(widget, i) {
            return $el(Slot, {widget: widget,
                              widgetIndex: i,
                              template: self.templates[widget.type],
                              onWidgetUpdated: function(widget) {
                                  self.state.widgets[i] = widget;
                                  self.setState({widgets: self.state.widgets});
                                  self.emitUpdate();
                              }});
        }),
        $el(EmptySlot, {onNewWidgetSelected: function(widgetType) {
                            self.addNewWidget(widgetType);
                            self.emitUpdate();
                        },
                        widgetTypes: self.widgetTypes})
    );
};
/**
 * @access private
 */
WidgetDesigner.prototype.addNewWidget = function(widgetType) {
    this.state.widgets.push({
        type: widgetType,
        data: initialWidgetProps[widgetType]
    });
    this.setState({widgets: this.state.widgets});
};
/**
 * @access private
 */
WidgetDesigner.prototype.emitUpdate = function() {
    this.props.onUpdate(this.getWidgetsAsJson());
};

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/**
 * @param {{widget: Widget; template: string;}} props
 */
function Slot(props) {
    preact.Component.call(this, props);
    this.state = {configFormIsOpen: null};
}
Slot.prototype = Object.create(preact.Component.prototype);
/**
 * @access protected
 */
Slot.prototype.render = function() {
    var self = this;
    var defs = widgetDefaults[self.props.widget.type];
    return $el('div', {class: 'slot populated'},
        $el('button', {onClick: function() { self.setState({configFormIsOpen: true}); },
                       class: 'icon-button filled',
                       title: 'Muokkaa widgettiä',
                       type: 'button'},
            featherSvg('edit-3')),
        $el('div', {class: 'widget'},
            $el('h3', {class: 'icon-h3'}, featherSvg(defs.icon), defs.title),
            !self.state.configFormIsOpen
                ? renderDefaultState(self)
                : renderEditState(self)
        )
    );
};
function renderDefaultState(self) {
    return $el('div', {class: 'widget-main',
                       dangerouslySetInnerHTML: {__html: window.ejs.render(
                           self.props.template,
                           self.makeWidgetProps(self.props)
                       )}});
}
function renderEditState(self) {
    return $el('div', {class: 'widget-main'},
        $el(widgetConfigFormImpls[self.props.widget.type],
            {widget: self.props.widget,
             onSave: function(newConfig) {
                 self.props.widget.data = newConfig;
                 self.props.onWidgetUpdated(self.props.widget);
                 self.setState({configFormIsOpen: false});
             },
             onCancel: function() {
                 self.setState({configFormIsOpen: false});
             } })
    );
}
/**
 * @access private
 */
Slot.prototype.makeWidgetProps = function(props) {
    var out = {widget: props.widget, widgetIndex: props.widgetIndex, artist: {}};
    var data = props.widget.data;
    for (var key in data)
        out[key] = data[key];
    for (key in ejsGlobals)
        out[key] = ejsGlobals[key];
    return out;
};

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/**
 * @param {{onNewWidgetSelected: (widgetType: string): any; widgetTypes: {[name: string]; string};}} props
 */
function EmptySlot(props) {
    preact.Component.call(this, props);
    this.state = {isNewWidgetSelectorVisible: false};
    this.selectedType = props.widgetTypes[0];
}
EmptySlot.prototype = Object.create(preact.Component.prototype);
/**
 * @access protected
 */
EmptySlot.prototype.render = function() {
    var self = this;
    return $el('div', {class: 'slot empty'},
        !self.state.isNewWidgetSelectorVisible
            ? $el('button', {onClick: function() {
                                self.setNewWidgetSelectorVisible();
                             },
                             class: 'icon-button filled',
                             title: 'Lisää widgetti',
                             type: 'button'},
                  featherSvg('plus'))
            : $el('div', null,
                $el('select', null, self.props.widgetTypes
                    .map(function(widgetType, i) {
                        return $el('option', {onClick: function(e) {
                                                self.selectedType = e.target.value;
                                              },
                                              value: widgetType},
                                    friendlyWidgetNames[i]);
                    })),
                $el('button', {onClick: function() {
                                self.props.onNewWidgetSelected(self.selectedType);
                               },
                               type: 'button'},
                    'Ok')
              )
    );
};
/**
 * @access private
 */
EmptySlot.prototype.setNewWidgetSelectorVisible = function() {
    this.setState({isNewWidgetSelectorVisible: true});
};

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/**
 * @param {WidgetConfigFormProps} props
 */
function InfoBoxConfigForm(props) {
    preact.Component.call(this, props);
}
InfoBoxConfigForm.prototype = Object.create(preact.Component.prototype);
/**
 * @access protected
 */
InfoBoxConfigForm.prototype.render = function() {
    return $el('p', null, 'todo');
};

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/**
 * @param {WidgetConfigFormProps} props
 */
function TwitterFeedConfigForm(props) {
    preact.Component.call(this, props);
    this.state = {userName: props.widget.data.userName,
                  useCustomImpl: props.widget.data.useCustomImpl || false};
}
TwitterFeedConfigForm.prototype = Object.create(preact.Component.prototype);
/**
 * @access protected
 */
TwitterFeedConfigForm.prototype.render = function() {
    var self = this;
    return $el('form', {onSubmit: function(e) { self.handleSubmit(e); }},
        $el('div', null,
            $el('label', {for: 'i-twitter-username'}, 'Twitter-käyttäjänimi'),
            $el('input', {onInput: function(e) { self.onInput(e); },
                          value: this.state.userName,
                          name: 'userName',
                          id: 'i-twitter-username'})
        ),
        $el('div', null,
            $el('button', null, 'Tallenna'),
            $el('a', {onClick: function() { self.props.onCancel(); }}, 'Peruuta')
        )
    );
};
/**
 * @access protected
 */
TwitterFeedConfigForm.prototype.onInput = function(e) {
    var newState = {};
    newState[e.target.name] = e.target.value;
    this.setState(newState);
};
/**
 * @access private
 */
TwitterFeedConfigForm.prototype.handleSubmit = function(e) {
    e.preventDefault();
    this.props.onSave({userName: this.state.userName,
                       useCustomImpl: this.state.useCustomImpl});
};

//
window.artistit.WidgetDesigner = WidgetDesigner;
}());