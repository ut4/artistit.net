/*
 * Tässä tiedostossa: window.artistit.WidgetDesigner: react-komponentti, jolla
 * artisti voi rakennella oman sivunsa.
 */

/* eslint-disable strict */
(function() {
'use strict';
var $el = preact.createElement;
var featherSvg = null;
var initialWidgetProps = {
    'info-box': {
        infos: [{title: 'Jäsenet', text: 'Jäsen1, Jäsen2'},
                {title: 'Vaikutteet', text: 'Yhtye1, Yhtye2'}]
    },
    'twitter-feed': {tid: 0},
};
var friendlyWidgetNames = ['Infoboksi', 'Twitter-feed'];

/**
 * @param {{widgets: Array<Widget>; templates: {[name: string]; string}; onUpdate: (widgetsAsJson: string): any;}} props
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
    featherSvg = function(iconId) {
        return $el('svg', {className: 'feather'},
            $el('use', {'xlink:href': props.ejsGlobals.staticBaseUrl + 'feather-sprite.svg#' + iconId})
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
        self.state.widgets.map(function(widget) {
            return $el(Slot, {widget: widget,
                              template: self.templates[widget.type],
                              templateGlobals: self.props.ejsGlobals});
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

/**
 * @param {{widget: Widget; template: string; templateGlobals: Object;}} props
 */
function Slot(props) {
    preact.Component.call(this, props);
}
Slot.prototype = Object.create(preact.Component.prototype);
/**
 * @access protected
 */
Slot.prototype.render = function() {
    var self = this;
    return $el('div', {class: 'slot populated'},
        $el('button', {onClick: function() { self.emitEditBtnClick(); },
                       class: 'icon-button filled',
                       title: 'Muokkaa widgettiä',
                       type: 'button'},
            featherSvg('edit-3')),
        $el('div', {class: 'widget'}, $el('div', {
            dangerouslySetInnerHTML: {__html: window.ejs.render(
                self.props.template, self.makeWidgetProps(self.props.widget))}
        }))
    );
};
/**
 * @access private
 */
Slot.prototype.emitEditBtnClick = function() {
    this.widgetInstance.setEditModeIsOn(true);
};
/**
 * @access private
 */
Slot.prototype.makeWidgetProps = function(widget) {
    var out = {widget: widget};
    for (var key in widget.data)
        out[key] = widget.data[key];
    for (key in this.props.templateGlobals)
        out[key] = this.props.templateGlobals[key];
    return out;
};

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
                                self.setIsNewWidgetSelectorVisible();
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
EmptySlot.prototype.setIsNewWidgetSelectorVisible = function() {
    this.setState({isNewWidgetSelectorVisible: true});
};
//
window.artistit.WidgetDesigner = WidgetDesigner;
}());