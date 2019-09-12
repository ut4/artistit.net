/*
 * Tässä tiedostossa: window.artistit.WidgetDesigner: react-komponentti, jolla
 * artisti voi rakennella oman sivunsa.
 */

/* eslint-disable strict */
(function() {
'use strict';
var $el = preact.createElement;
var featherSvg = window.artistit.widgetTemplates.featherSvg;

/**
 * @param {{widgets: Array<Widget>;}} props
 */
function WidgetDesigner(props) {
    preact.Component.call(this, props);
    this.state = {widgets: props.widgets || []};
}
WidgetDesigner.prototype = Object.create(preact.Component.prototype);
/**
 *
 */
WidgetDesigner.prototype.render = function() {
    var self = this;
    return $el('div', {class: 'artist-widgets-list'},
        $el('button', {class: 'icon-button filled', title: 'Järjestä widgettejä'},
            featherSvg('layout'), 'Järjestä'),
        self.state.widgets.length
            ? self.state.widgets.map(function(w) {
                return $el(Slot, {widget: w, onEditBtnClick: function() {
                    //
                }});
            })
            : $el('p', null, 'Hmm, minimaalista.')
    );
};
/**
 *
 */
WidgetDesigner.prototype.openWidgetEditDialog = function(_widget) {
    //
};
/**
 *
 */
function Slot(props) {
    var w = props.widget;
    return $el('div', null,
        $el('button', {onClick: function() { props.onEditBtnClick(w); },
                    class: 'icon-button filled',
                    title: 'Muokkaa widgettiä',
                    type: 'button'},
            featherSvg('edit-3')),
        $el('div', {class: 'widget'}, $el('div', null,
            $el(window.artistit.widgetTemplates[w.type], w.data)
        ))
    );
}
//
window.artistit.WidgetDesigner = WidgetDesigner;
}());