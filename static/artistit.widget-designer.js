/*
 * Tässä tiedostossa: window.artistit.WidgetDesigner: react-komponentti, jolla
 * artisti voi rakennella oman sivunsa.
 */

/* eslint-disable strict */
(function() {
'use strict';
var $el = preact.createElement;
var featherSvg = window.artistit.widgetTemplates.featherSvg;
var initialWidgetProps = {
    'info-box': {
        infos: [{title: 'Jäsenet', text: 'Jäsen1, Jäsen2'},
                {title: 'Vaikutteet', text: 'Yhtye1, Yhtye2'}]
    },
    'twitter-feed': {tid: 0},
};
var friendlyWidgetNames = ['Infoboksi', 'Twitter-feed'];

/**
 * @param {{widgets: Array<Widget>; initialWidgetProps: {[key: string]: Object};}} props
 */
function WidgetDesigner(props) {
    preact.Component.call(this, props);
    var defaultType = Object.keys(initialWidgetProps)[0];
    this.state = {widgets: props.widgets || [{
        type: defaultType,
        data: initialWidgetProps[defaultType]
    }]};
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
        self.state.widgets.map(function(w) {
            return $el(Slot, {widget: w});
        }),
        $el(EmptySlot, {onNewWidgetSelected: function(widgetType) {
            self.addNewWidget(widgetType);
        }})
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
 * @param {{widget: Widget;}} props
 */
function Slot(props) {
    preact.Component.call(this, props);
    this.widgetInstance = null;
}
Slot.prototype = Object.create(preact.Component.prototype);
/**
 * @access protected
 */
Slot.prototype.render = function() {
    var self = this;
    var w = self.props.widget;
    var widgetProps = {ref: function(instance) { self.widgetInstance = instance; }};
    for (var key in w.data) widgetProps[key] = w.data[key];
    return $el('div', {class: 'slot populated'},
        $el('button', {onClick: function() { self.emitEditBtnClick(); },
                       class: 'icon-button filled',
                       title: 'Muokkaa widgettiä',
                       type: 'button'},
            featherSvg('edit-3')),
        $el('div', {class: 'widget'}, $el('div', null,
            $el(window.artistit.widgetTemplates[w.type], widgetProps)
        ))
    );
};
/**
 * @access private
 */
Slot.prototype.emitEditBtnClick = function() {
    this.widgetInstance.setEditModeIsOn(true);
};

/**
 * @param {{onNewWidgetSelected: (widgetType: string): any;}} props
 */
function EmptySlot(props) {
    preact.Component.call(this, props);
    this.state = {isNewWidgetSelectorVisible: false};
    this.widgetTypes = Object.keys(initialWidgetProps);
    this.selectedType = this.widgetTypes[0];
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
                $el('select', null, self.widgetTypes
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