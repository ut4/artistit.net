/*
 * Tässä tiedostossa: window.artistit.WidgetDesigner: react-komponentti, jolla
 * artisti voi rakennella oman sivunsa.
 */

/* eslint-disable strict */
(function() {
'use strict';
var $el = preact.createElement;
var widgetProtos = null;
var widgetTypeNames = null;
var ejsGlobals = null;
var featherSvg = null;
var widgetConfigFormImpls = {
    'info-box': InfoBoxConfigForm,
    'twitter-feed': TwitterFeedConfigForm,
};

/**
 * @param {{widgets: Array<Widget>; widgetProtos: WidgetProtos; templates: {[name: string]; string}; onUpdate: (widgetsAsJson: string): any;}} props
 */
function WidgetDesigner(props) {
    preact.Component.call(this, props);
    this.templates = props.templates;
    for (var key in this.templates)
        this.templates[key] = decodeURIComponent(this.templates[key]);
    widgetProtos = props.widgetProtos;
    ejsGlobals = props.ejsGlobals;
    widgetTypeNames = Object.keys(widgetProtos);
    this.state = {widgets: props.widgets || [{
        type: widgetTypeNames[0],
        data: widgetProtos[widgetTypeNames[0]].data
    }]};
    featherSvg = function(iconId) {
        return $el('svg', {className: 'feather'},
            $el('use', {'xlink:href': ejsGlobals.staticBaseUrl + 'feather-sprite.svg#' + iconId})
        );
    };
    this.emitUpdate();
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
    var showLayoutButton = self.state.widgets.length > 1;
    return $el('div', {class: 'artist-widgets-list' +
                              (showLayoutButton ? ' with-header-buttons' : '')},
        showLayoutButton && $el('button', {class: 'icon-button filled',
                                           title: 'Järjestä widgettejä'},
                                featherSvg('layout'), 'Järjestä'),
        self.state.widgets.length ? self.state.widgets.map(function(widget, i) {
            return $el(Slot, {widget: widget,
                              widgetIndex: i,
                              template: self.templates[widget.type],
                              onWidgetUpdated: function(widget) {
                                  self.state.widgets[i] = widget;
                                  self.setState({widgets: self.state.widgets});
                                  self.emitUpdate();
                              },
                              onWidgetDeleted: function(widget) {
                                  var widgets = self.state.widgets;
                                  widgets.splice(widgets.indexOf(widget), 1);
                                  self.setState({widgets: widgets});
                                  self.emitUpdate();
                              }});
        }) : $el('p', null, 'Hmm, minimaalista.'),
        $el(EmptySlot, {onNewWidgetSelected: function(widgetTypeName) {
                            self.addNewWidget(widgetTypeName);
                            self.emitUpdate();
                        }})
    );
};
/**
 * @access private
 */
WidgetDesigner.prototype.addNewWidget = function(widgetTypeName) {
    this.state.widgets.push({
        type: widgetTypeName,
        data: widgetProtos[widgetTypeName].data
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
    this.state = {widget: Object.assign({}, props.widget),
                  configFormIsOpen: null};
    if (!this.state.widget.title)
        this.state.widget.title = widgetProtos[props.widget.type].title;
    this.originalWidget = null;
}
Slot.prototype = Object.create(preact.Component.prototype);
/**
 * @access protected
 */
Slot.prototype.render = function() {
    var self = this;
    var defs = widgetProtos[self.props.widget.type];
    return $el('div', {class: 'slot populated'},
        $el('button', {onClick: function() { self.setWidgetEditStateEnabled(); },
                       class: 'icon-button filled',
                       title: 'Muokkaa widgettiä',
                       type: 'button'},
            featherSvg('edit-3')),
         $el('button', {onClick: function() { self.setState({deleteDialogIsOpen: true}); },
                        class: 'icon-button filled',
                        title: 'Poista widgetti',
                        type: 'button'},
             featherSvg('x')),
        $el('div', {class: 'widget'},
            !self.state.configFormIsOpen
                ? renderTitleDefaultState(self, defs.icon)
                : renderTitleEditState(self, defs.icon),
            !self.state.deleteDialogIsOpen
                ? null
                : renderDeleteDialog(self),
            !self.state.configFormIsOpen
                ? renderWidgetDefaultState(self)
                : renderWidgetEditState(self)
        )
    );
};
function renderTitleDefaultState(self, icon) {
    return $el('h3', {class: 'icon-h3'},
        featherSvg(icon),
        self.state.widget.title
    );
}
function renderTitleEditState(self, icon) {
    return $el('h3', {class: 'icon-h3'},
        featherSvg(icon),
        $el('input', {onInput: function(e) { self.onInput(e); },
                      value: self.state.widget.title,
                      name: 'title',
                      class: 'head-input light'})
    );
}
function renderWidgetDefaultState(self) {
    return $el('div', {key: 'widget-main-default-state',
                       class: 'widget-main',
                       dangerouslySetInnerHTML: {__html: window.ejs.render(
                           self.props.template,
                           Object.assign(
                               {widget: self.state.widget,
                                widgetIndex: self.props.widgetIndex,
                                artist: {}},
                               self.state.widget.data,
                               ejsGlobals
                           )
                       )}});
}
function renderWidgetEditState(self) {
    return $el('div', {key: 'widget-main-edit-state', class: 'widget-main'},
        $el(widgetConfigFormImpls[self.state.widget.type],
            {widget: self.state.widget,
             onSave: function() {
                 if (self.state.widget.title == widgetProtos[self.state.widget.type].title)
                     delete self.state.widget.title;
                 self.props.onWidgetUpdated(self.state.widget);
             },
             onCancel: function() {
                 self.setState({widget: self.originalWidget,
                                configFormIsOpen: false});
             }})
    );
}
/**
 * @access private
 */
Slot.prototype.setWidgetEditStateEnabled = function() {
    this.originalWidget = JSON.parse(JSON.stringify(this.state.widget)); // deep-copy
    this.setState({configFormIsOpen: true});
};
/**
 * @access private
 */
Slot.prototype.onInput = function(e) {
    this.state.widget[e.target.name] = e.target.value;
    this.setState({widget: this.state.widget});
};
function renderDeleteDialog(self) {
    return $el('div', {class: 'popup-dialog light'},
        $el('h3', null, 'Poista widgetti?'),
        $el('button', {onClick: function () {
                           self.props.onWidgetDeleted(self.state.widget);
                       },
                       type: 'button'},
            'Poista'),
        $el('a', {onClick: function () {
                      self.setState({deleteDialogIsOpen: false});
                  }},
            'Peruuta')
    );
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/**
 * @param {{onNewWidgetSelected: (widgetProtoIndex: number): any;}} props
 */
function EmptySlot(props) {
    preact.Component.call(this, props);
    this.state = {isNewWidgetSelectorVisible: false,
                  selectedTypeName: widgetTypeNames[0]};
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
                                 self.setState({isNewWidgetSelectorVisible: true});
                             },
                             class: 'icon-button filled',
                             title: 'Lisää widgetti',
                             type: 'button'},
                  featherSvg('plus'))
            : $el('div', null, $el('div', null,
                $el('select', null, widgetTypeNames
                    .map(function(name) {
                        return $el('option', {onClick: function(e) {
                                                self.setState({selectedTypeName: e.target.value});
                                              },
                                              value: name},
                                   widgetProtos[name].friendlyName);
                    })),
                $el('p', null, widgetProtos[self.state.selectedTypeName].description),
                $el('button', {onClick: function() {
                                self.props.onNewWidgetSelected(self.state.selectedTypeName);
                               },
                               type: 'button'},
                    'Ok'),
                $el('a', {onClick: function() {
                              self.setState({isNewWidgetSelectorVisible: false});
                          }}, 'Peruuta')
              ))
    );
};

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/**
 * @param {WidgetConfigFormProps} props
 */
function InfoBoxConfigForm(props) {
    preact.Component.call(this, props);
    var self = this;
    self.state = {infos: props.widget.data.infos};
}
InfoBoxConfigForm.prototype = Object.create(preact.Component.prototype);
/**
 * @access protected
 */
InfoBoxConfigForm.prototype.render = function() {
    var self = this;
    return $el('form', {onSubmit: function(e) { self.handleSubmit(e); }},
        $el('ul', null, self.state.infos.map(function(pair, i) {
            return $el('li', null,
                $el('input', {onInput: function(e) { self.onInput(e, i, 'title'); },
                              value: pair.title}),
                ': ',
                $el('input', {onInput: function(e) { self.onInput(e, i, 'text'); },
                              value: pair.text})
            );
        })),
        $el('div', null,
            $el('button', null, 'Ok'),
            $el('a', {onClick: function() { self.props.onCancel(); }}, 'Peruuta')
        )
    );
};
/**
 * @access private
 */
InfoBoxConfigForm.prototype.onInput = function(e, i, key) {
    var infos = this.state.infos;
    infos[i][key] = e.target.value;
    this.setState({infos: infos});
};
/**
 * @access private
 */
InfoBoxConfigForm.prototype.handleSubmit = function(e) {
    e.preventDefault();
    this.props.onSave({infos: this.state.infos});
};

////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

/**
 * @param {WidgetConfigFormProps} props
 */
function TwitterFeedConfigForm(props) {
    preact.Component.call(this, props);
    this.state = {widgetData: props.widget.data};
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
                          value: this.state.widgetData.userName,
                          name: 'userName',
                          id: 'i-twitter-username'})
        ),
        $el('div', null,
            $el('button', null, 'Ok'),
            $el('a', {onClick: function() { self.props.onCancel(); }}, 'Peruuta')
        )
    );
};
/**
 * @access protected
 */
TwitterFeedConfigForm.prototype.onInput = function(e) {
    var widgetData = this.state.widgetData;
    widgetData[e.target.name] = e.target.value;
    this.setState({widgetData: widgetData});
};
/**
 * @access private
 */
TwitterFeedConfigForm.prototype.handleSubmit = function(e) {
    e.preventDefault();
    this.props.onSave();
};

//
window.artistit.WidgetDesigner = WidgetDesigner;
}());